// Lapisan MIS (Management Information System) untuk peran Manajer Distribusi.
// Semua fungsi di sini murni & terpisah dari React/store — mereka mengubah data
// mentah (permintaan, keputusan, stok, kota) menjadi *informasi untuk
// pengambilan keputusan*: peringatan (exception), sisa hari pasokan, tren
// periode, backlog yang menua, dan rincian pembentuk KPI (drill-down).
import {
  aggregatePermintaanRanking,
  getPeriodRange,
  isDateInRange,
  parseDate,
} from "./distribusi";
import { formatTonase } from "./format";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Ambang keputusan — sengaja dikumpulkan di satu tempat agar mudah disetel.
export const AMBANG_HARI_PASOKAN = 3; // stok dianggap kritis di bawah ini
export const AMBANG_UMUR_BACKLOG = 5; // hari; permintaan lebih tua dianggap "menua"

const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Selisih hari antara tanggal-string ("YYYY-MM-DD") dan sebuah Date acuan.
const diffHari = (tanggal, baseDate = new Date()) =>
  Math.floor((startOfDay(baseDate) - parseDate(tanggal)) / MS_PER_DAY);

// ── Stok & Sisa Hari Pasokan ────────────────────────────────────────────────
// Menjawab: "Stok masih cukup berapa hari?" dan "Apakah defisit terhadap
// permintaan yang belum dialokasikan?" — dasar keputusan pengadaan.
export const computeStokInsight = (keputusan, permintaan, stokTbs, baseDate = new Date()) => {
  const stok = Number(stokTbs) || 0;

  const terdistribusi = keputusan.filter((item) => item.status !== "menunggu");
  const totalTerdistribusi = terdistribusi.reduce(
    (total, item) => total + (Number(item.volume_tbs) || 0),
    0
  );

  // Laju harian = total volume terdistribusi ÷ rentang hari aktivitas distribusi
  // (dari keputusan terlama sampai terbaru, inklusif). Butuh minimal satu
  // keputusan ber-volume agar bermakna; jika tidak, laju & sisa hari = null.
  let lajuHarian = null;
  let daysOfSupply = null;
  const tanggalList = terdistribusi
    .map((item) => item.tanggal_keputusan)
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b));

  if (totalTerdistribusi > 0 && tanggalList.length > 0) {
    const rentangHari = Math.max(
      1,
      Math.round(
        (parseDate(tanggalList[tanggalList.length - 1]) - parseDate(tanggalList[0])) /
          MS_PER_DAY
      ) + 1
    );
    lajuHarian = totalTerdistribusi / rentangHari;
    daysOfSupply = lajuHarian > 0 ? stok / lajuHarian : null;
  }

  const totalPermintaanTon = permintaan.reduce(
    (total, item) => total + (Number(item.jumlah_permintaan) || 0),
    0
  );
  const totalAlokasiTon = keputusan.reduce(
    (total, item) => total + (Number(item.volume_tbs) || 0),
    0
  );
  const sisaKebutuhan = Math.max(0, totalPermintaanTon - totalAlokasiTon);
  const selisihStok = stok - sisaKebutuhan; // >0 surplus, <0 defisit

  return {
    stok,
    lajuHarian,
    daysOfSupply,
    totalPermintaanTon,
    totalAlokasiTon,
    sisaKebutuhan,
    selisihStok,
    isDefisit: selisihStok < 0,
    isStokKritis: daysOfSupply !== null && daysOfSupply < AMBANG_HARI_PASOKAN,
  };
};

// ── Tren & Variance permintaan (minggu ini vs minggu lalu) ───────────────────
export const computeTrenPeriode = (permintaan, baseDate = new Date()) => {
  const rangeIni = getPeriodRange("minggu-ini", baseDate);
  const rangeLalu = {
    start: new Date(rangeIni.start.getTime() - 7 * MS_PER_DAY),
    end: new Date(rangeIni.end.getTime() - 7 * MS_PER_DAY),
  };

  const jumlahDalamRange = (range) =>
    permintaan.reduce((total, item) => {
      if (item.tanggal_permintaan && isDateInRange(item.tanggal_permintaan, range)) {
        return total + (Number(item.jumlah_permintaan) || 0);
      }
      return total;
    }, 0);

  const permintaanIni = jumlahDalamRange(rangeIni);
  const permintaanLalu = jumlahDalamRange(rangeLalu);
  const deltaPersen =
    permintaanLalu > 0
      ? Math.round(((permintaanIni - permintaanLalu) / permintaanLalu) * 100)
      : null;

  let arah = "stabil";
  if (deltaPersen !== null) {
    if (deltaPersen > 0) arah = "naik";
    else if (deltaPersen < 0) arah = "turun";
  } else if (permintaanIni > 0) {
    arah = "naik";
  }

  return { permintaanIni, permintaanLalu, deltaPersen, arah };
};

// ── Backlog yang menua (per kota belum terpenuhi, diurut dari yang terlama) ───
export const computeBacklogAging = (permintaan, keputusan, baseDate = new Date()) => {
  const ranking = aggregatePermintaanRanking(permintaan);
  const alokasiByKota = keputusan.reduce((map, item) => {
    map.set(
      item.kota_tujuan,
      (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0)
    );
    return map;
  }, new Map());

  return ranking
    .map((item) => {
      const alokasi = alokasiByKota.get(item.kota) || 0;
      const kekurangan = Math.max(0, item.totalPermintaan - alokasi);
      const umurHari = item.earliestTanggalInput
        ? Math.max(0, diffHari(item.earliestTanggalInput, baseDate))
        : 0;
      return {
        kota: item.kota,
        totalPermintaan: item.totalPermintaan,
        alokasi,
        kekurangan,
        umurHari,
        tanggalTertua: item.earliestTanggalInput,
      };
    })
    .filter((item) => item.kekurangan > 0)
    .sort((a, b) => b.umurHari - a.umurHari || b.kekurangan - a.kekurangan);
};

// ── Pelanggaran SLA (pengiriman melewati ETA) ────────────────────────────────
export const computeSlaBreaches = (keputusan, baseDate = new Date()) => {
  const hariIni = startOfDay(baseDate);
  const breaches = [];

  keputusan.forEach((item) => {
    if (item.status === "selesai" && item.eta && item.waktu_selesai) {
      const batas = new Date(`${item.eta}T23:59:59`);
      if (new Date(item.waktu_selesai) > batas) {
        breaches.push({ id: item.id, kota: item.kota_tujuan, eta: item.eta, jenis: "terlambat-selesai" });
      }
    } else if (item.status === "dalam-pengiriman" && item.eta) {
      if (parseDate(item.eta) < hariIni) {
        breaches.push({ id: item.id, kota: item.kota_tujuan, eta: item.eta, jenis: "melewati-eta" });
      }
    }
  });

  return breaches;
};

const URUTAN_SEVERITY = { kritis: 0, perhatian: 1 };

// ── Pusat Peringatan (management by exception) ───────────────────────────────
// Menggabungkan sinyal di atas menjadi satu daftar anomali yang menuntut
// keputusan manajer, terurut dari yang paling mendesak.
export const computeExceptions = ({ keputusan, permintaan, stokTbs, baseDate = new Date() }) => {
  const alerts = [];

  const stok = computeStokInsight(keputusan, permintaan, stokTbs, baseDate);
  if (stok.isStokKritis) {
    alerts.push({
      id: "stok-kritis",
      severity: "kritis",
      kategori: "Stok",
      ikon: "inventory_2",
      pesan: `Stok TBS menipis — cukup untuk ± ${Math.floor(stok.daysOfSupply)} hari lagi.`,
      target: "keputusan-distribusi",
      aksiLabel: "Kelola distribusi",
    });
  } else if (stok.isDefisit) {
    alerts.push({
      id: "stok-defisit",
      severity: "perhatian",
      kategori: "Stok",
      ikon: "inventory_2",
      pesan: `Stok kurang ${formatTonase(Math.abs(stok.selisihStok))} dari kebutuhan yang belum dialokasikan.`,
      target: "keputusan-distribusi",
      aksiLabel: "Kelola distribusi",
    });
  }

  const sla = computeSlaBreaches(keputusan, baseDate);
  if (sla.length > 0) {
    alerts.push({
      id: "sla-breach",
      severity: "kritis",
      kategori: "Tenggat",
      ikon: "schedule",
      pesan: `${sla.length} pengiriman melewati estimasi tiba.`,
      target: "laporan",
      aksiLabel: "Lihat laporan",
    });
  }

  const backlog = computeBacklogAging(permintaan, keputusan, baseDate);
  const menua = backlog.filter((item) => item.umurHari >= AMBANG_UMUR_BACKLOG);
  if (menua.length > 0) {
    const teratas = menua[0];
    alerts.push({
      id: "backlog-menua",
      severity: "perhatian",
      kategori: "Backlog",
      ikon: "hourglass_top",
      pesan: `${menua.length} kota menunggu keputusan > ${AMBANG_UMUR_BACKLOG} hari (terlama: ${teratas.kota}, ${teratas.umurHari} hari).`,
      target: "keputusan-distribusi",
      aksiLabel: "Buat keputusan",
    });
  } else if (backlog.length > 0) {
    const totalKekurangan = backlog.reduce((total, item) => total + item.kekurangan, 0);
    alerts.push({
      id: "kota-belum-terpenuhi",
      severity: "perhatian",
      kategori: "Cakupan",
      ikon: "location_off",
      pesan: `${backlog.length} kota belum terpenuhi penuh (total kekurangan ${formatTonase(totalKekurangan)}).`,
      target: "keputusan-distribusi",
      aksiLabel: "Buat keputusan",
    });
  }

  return alerts.sort((a, b) => URUTAN_SEVERITY[a.severity] - URUTAN_SEVERITY[b.severity]);
};

// ── Drill-down KPI ───────────────────────────────────────────────────────────
// Rincian pembentuk "Tingkat Pemenuhan" & "Cakupan Kota" — per kota, diurut
// dari pemenuhan terendah (paling butuh perhatian lebih dulu).
export const computePemenuhanPerKota = (permintaan, keputusan) => {
  const ranking = aggregatePermintaanRanking(permintaan);
  const alokasiByKota = keputusan.reduce((map, item) => {
    map.set(
      item.kota_tujuan,
      (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0)
    );
    return map;
  }, new Map());

  return ranking
    .map((item) => {
      const alokasi = alokasiByKota.get(item.kota) || 0;
      const persen =
        item.totalPermintaan > 0
          ? Math.round((alokasi / item.totalPermintaan) * 100)
          : 0;
      return {
        kota: item.kota,
        totalPermintaan: item.totalPermintaan,
        alokasi,
        persen,
      };
    })
    .sort((a, b) => a.persen - b.persen || b.totalPermintaan - a.totalPermintaan);
};

// Rincian pembentuk "Ketepatan Waktu" & "Rata-rata Siklus" — per keputusan
// yang sudah selesai, dengan lama siklus (jam) dan status tepat/terlambat.
export const computeSiklusDetail = (keputusan) =>
  keputusan
    .filter((item) => item.status === "selesai" && item.waktu_menunggu && item.waktu_selesai)
    .map((item) => {
      const mulai = new Date(item.waktu_menunggu).getTime();
      const akhir = new Date(item.waktu_selesai).getTime();
      const siklusJam = Math.round(((akhir - mulai) / (1000 * 60 * 60)) * 10) / 10;
      const tepatWaktu = item.eta
        ? new Date(item.waktu_selesai) <= new Date(`${item.eta}T23:59:59`)
        : null;
      return {
        id: item.id,
        kota: item.kota_tujuan,
        volume: Number(item.volume_tbs) || 0,
        siklusJam,
        eta: item.eta ?? null,
        tepatWaktu,
      };
    })
    .sort((a, b) => b.siklusJam - a.siklusJam);
