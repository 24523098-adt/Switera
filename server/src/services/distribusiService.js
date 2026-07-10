import { getDaftarKota } from "./kotaService.js";
import { getPermintaan } from "./permintaanService.js";
import { getStokTbs } from "./stokService.js";
import { getKeputusan } from "./keputusanService.js";

/**
 * Ported verbatim from src/utils/distribusi.js. These four functions are
 * pure (no DB/React coupling) — same scoring weights (0.65 demand / 0.35
 * capacity), same allocation walk, same KPI formulas. Do not alter the
 * logic here; only the wrapper functions below change where the input
 * arrays come from.
 */

const parseDate = (value) => new Date(`${value}T00:00:00`);

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

const computeRekomendasiDistribusi = (permintaan, daftarKota, stokTbs) => {
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

const computeKpiMetrics = (keputusan, permintaan, daftarKota) => {
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

// LOGIC-01: no module-level variable holds permintaan/daftarKota/stokTbs —
// every call re-queries the database via the three underlying services
// inside this function body, so the result always reflects the current
// DB state, never a value cached from a previous request.
export async function getRekomendasiDistribusi() {
  const [permintaan, daftarKota, stokTbs] = await Promise.all([
    getPermintaan(),
    getDaftarKota(),
    getStokTbs(),
  ]);

  return computeRekomendasiDistribusi(permintaan, daftarKota, stokTbs);
}

// LOGIC-01: no module-level variable holds keputusan/permintaan/daftarKota —
// every call re-queries the database via the three underlying services
// inside this function body, so the KPI result always reflects the current
// DB state, never a value cached from a previous request.
export async function getKpiMetrics() {
  const [keputusan, permintaan, daftarKota] = await Promise.all([
    getKeputusan(),
    getPermintaan(),
    getDaftarKota(),
  ]);

  return computeKpiMetrics(keputusan, permintaan, daftarKota);
}
