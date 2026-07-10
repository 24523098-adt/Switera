export const parseDate = (value) => new Date(`${value}T00:00:00`);

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const aggregatePermintaanRanking = (permintaan) => {
  const grouped = permintaan.reduce((result, item) => {
    const current = result.get(item.kota) ?? {
      kota: item.kota,
      totalPermintaan: 0,
      earliestTanggalInput: item.tanggal_input,
    };

    current.totalPermintaan += Number(item.jumlah_permintaan) || 0;

    if (
      item.tanggal_input &&
      (!current.earliestTanggalInput ||
        parseDate(item.tanggal_input) < parseDate(current.earliestTanggalInput))
    ) {
      current.earliestTanggalInput = item.tanggal_input;
    }

    result.set(item.kota, current);
    return result;
  }, new Map());

  return [...grouped.values()].sort((first, second) => {
    if (second.totalPermintaan !== first.totalPermintaan) {
      return second.totalPermintaan - first.totalPermintaan;
    }

    if (
      first.earliestTanggalInput &&
      second.earliestTanggalInput &&
      first.earliestTanggalInput !== second.earliestTanggalInput
    ) {
      return (
        parseDate(first.earliestTanggalInput) -
        parseDate(second.earliestTanggalInput)
      );
    }

    return first.kota.localeCompare(second.kota, "id-ID");
  });
};

export const getLatestKeputusanByKota = (keputusan) =>
  keputusan.reduce((result, item) => {
    const existing = result.get(item.kota_tujuan);

    if (
      !existing ||
      parseDate(item.tanggal_keputusan) > parseDate(existing.tanggal_keputusan)
    ) {
      result.set(item.kota_tujuan, item);
    }

    return result;
  }, new Map());

export const getDuplicateGroups = (permintaan) => {
  const groups = permintaan.reduce((result, item) => {
    const key = `${item.kota}-${item.tanggal_permintaan}`;
    const current = result.get(key) ?? [];
    current.push(item);
    result.set(key, current);
    return result;
  }, new Map());

  return [...groups.values()].filter((items) => items.length > 1);
};

export const getPeriodRange = (periode, baseDate = new Date()) => {
  const today = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  if (periode === "minggu-ini") {
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
};

export const isDateInRange = (value, range) => {
  const current = parseDate(value);
  return current >= range.start && current <= range.end;
};

export const computeRekomendasiDistribusi = (permintaan, daftarKota, stokTbs) => {
  const ranking = aggregatePermintaanRanking(permintaan);
  const kapasitasMap = new Map(daftarKota.map((kota) => [kota.nama, kota.kapasitas]));

  const maxPermintaan = Math.max(1, ...ranking.map((item) => item.totalPermintaan));
  const maxKapasitas = Math.max(1, ...daftarKota.map((kota) => kota.kapasitas));

  const scored = ranking.map((item) => {
    const kapasitas = kapasitasMap.get(item.kota) ?? 0;
    const normalizedDemand = item.totalPermintaan / maxPermintaan;
    const normalizedCapacity = kapasitas / maxKapasitas;
    const skor = Math.round((normalizedDemand * 0.65 + normalizedCapacity * 0.35) * 100);

    return {
      kota: item.kota,
      totalPermintaan: item.totalPermintaan,
      kapasitas,
      skor,
    };
  });

  scored.sort((a, b) => b.skor - a.skor);

  let stokTersisa = stokTbs;

  return scored.map((item) => {
    const batasKapasitas = Math.min(item.totalPermintaan, item.kapasitas);
    const alokasi = Math.max(0, Math.min(batasKapasitas, stokTersisa));
    stokTersisa -= alokasi;

    return {
      ...item,
      alokasi,
      terpenuhiPenuh: alokasi >= item.totalPermintaan,
      dibatasiKapasitas: alokasi < item.totalPermintaan && item.kapasitas < item.totalPermintaan,
    };
  });
};

export const computeKpiMetrics = (keputusan, permintaan, daftarKota) => {
  const totalPermintaanTon = permintaan.reduce(
    (total, item) => total + (Number(item.jumlah_permintaan) || 0),
    0
  );
  const totalAlokasiTon = keputusan.reduce(
    (total, item) => total + (Number(item.volume_tbs) || 0),
    0
  );
  const fulfillmentRate =
    totalPermintaanTon > 0 ? Math.round((totalAlokasiTon / totalPermintaanTon) * 100) : 0;

  const selesai = keputusan.filter(
    (item) => item.status === "selesai" && item.waktu_menunggu && item.waktu_selesai
  );

  let onTimeRate = null;
  let avgSiklusJam = null;

  if (selesai.length > 0) {
    const siklusJamList = selesai.map((item) => {
      const mulai = new Date(item.waktu_menunggu).getTime();
      const akhir = new Date(item.waktu_selesai).getTime();
      return (akhir - mulai) / (1000 * 60 * 60);
    });

    avgSiklusJam =
      siklusJamList.reduce((total, jam) => total + jam, 0) / siklusJamList.length;
  }

  // Ketepatan Waktu hanya dihitung dari keputusan selesai yang PUNYA ETA.
  // Keputusan tanpa ETA (mis. langsung menunggu -> selesai) dikeluarkan dari
  // basis, bukan dianggap tepat waktu, supaya angka mencerminkan kepatuhan
  // ETA yang sebenarnya. Bila tidak ada satu pun keputusan selesai ber-ETA,
  // onTimeRate tetap null -> UI menampilkan "Belum ada data".
  const selesaiBerEta = selesai.filter((item) => item.eta);
  if (selesaiBerEta.length > 0) {
    const tepatWaktu = selesaiBerEta.filter(
      (item) => new Date(item.waktu_selesai) <= new Date(`${item.eta}T23:59:59`)
    );
    onTimeRate = Math.round((tepatWaktu.length / selesaiBerEta.length) * 100);
  }

  const kotaTercoverSet = new Set(keputusan.map((item) => item.kota_tujuan));

  return {
    fulfillmentRate,
    onTimeRate,
    avgSiklusJam,
    kotaTercover: kotaTercoverSet.size,
    totalKota: daftarKota.length,
  };
};
