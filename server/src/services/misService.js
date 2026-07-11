import { getPermintaan } from "./permintaanService.js";
import { getKeputusan } from "./keputusanService.js";
import { getDaftarKota } from "./kotaService.js";
import { getStokTbs } from "./stokService.js";
import {
  getRekomendasiDistribusi,
  aggregatePermintaanRanking,
} from "./distribusiService.js";
import { tambahNotifikasi, adaNotifikasiTerbaru } from "./notifikasiService.js";
import { getTargetKpi } from "./targetKpiService.js";
import prisma from "../db/prismaClient.js";

/**
 * Lapisan MIS (Management Information System) sisi server untuk peran Manajer
 * Distribusi. Semua fungsi di sini murni membaca data terkini dari service
 * domain yang sudah ada (permintaan, keputusan, kota, stok) lalu mengolahnya
 * menjadi informasi keputusan: situasi hari ini, tindakan mendesak, prioritas,
 * keputusan berjalan, proyeksi stok, KPI, dan efisiensi logistik. Tidak ada
 * endpoint lama yang diubah; ini murni tambahan.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const parseTanggal = (value) => new Date(`${value}T00:00:00`);

const startOfToday = (base = new Date()) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate());

// Selisih hari (bulat) antara tanggal-string "YYYY-MM-DD" dan hari ini.
const hariSejakTanggal = (tanggal, base = new Date()) =>
  tanggal ? Math.floor((startOfToday(base) - parseTanggal(tanggal)) / DAY_MS) : null;

// Selisih hari (bulat) antara sebuah DateTime dan hari ini.
const hariSejakWaktu = (waktu, base = new Date()) =>
  waktu ? Math.floor((startOfToday(base) - startOfToday(new Date(waktu))) / DAY_MS) : null;

const toTanggalKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const bulatkan = (nilai, desimal = 0) => {
  const faktor = 10 ** desimal;
  return Math.round(nilai * faktor) / faktor;
};

// Rata-rata permintaan harian dari N hari terakhir (default 30). Membagi total
// ton dalam jendela dengan jumlah hari, bukan jumlah baris, agar mencerminkan
// laju konsumsi harian yang sebenarnya.
const rataPermintaanHarian = (permintaan, hari = 30, base = new Date()) => {
  const batas = startOfToday(base).getTime() - hari * DAY_MS;
  const totalDalamJendela = permintaan
    .filter((item) => item.tanggal_permintaan && parseTanggal(item.tanggal_permintaan).getTime() >= batas)
    .reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0);
  return totalDalamJendela / hari;
};

// Peta kota -> DateTime distribusi selesai terakhir.
const petaSelesaiTerakhir = (keputusan) => {
  const peta = new Map();
  keputusan.forEach((item) => {
    if (item.status !== "selesai") return;
    const waktu = item.waktu_selesai ? new Date(item.waktu_selesai) : parseTanggal(item.tanggal_keputusan);
    const sebelumnya = peta.get(item.kota_tujuan);
    if (!sebelumnya || waktu > sebelumnya) {
      peta.set(item.kota_tujuan, waktu);
    }
  });
  return peta;
};

// Hari tanpa distribusi selesai untuk sebuah kota: dihitung dari distribusi
// selesai terakhir, atau jika belum pernah, dari permintaan terlama kota itu.
const hitungHariTanpaDistribusi = (kota, selesaiTerakhir, earliestInputByKota, base = new Date()) => {
  const terakhir = selesaiTerakhir.get(kota);
  if (terakhir) {
    return Math.max(0, Math.floor((startOfToday(base) - startOfToday(terakhir)) / DAY_MS));
  }
  const earliest = earliestInputByKota.get(kota);
  return earliest ? Math.max(0, hariSejakTanggal(earliest, base) ?? 0) : 0;
};

const petaEarliestInput = (permintaan) => {
  const ranking = aggregatePermintaanRanking(permintaan);
  return new Map(ranking.map((item) => [item.kota, item.earliestTanggalInput]));
};

const STATUS_AKTIF = ["menunggu", "dalam-pengiriman"];

// ── 1. Situasi hari ini ──────────────────────────────────────────────────────
export async function getSituasiHariIni() {
  const [permintaan, keputusan, daftarKota, stok, target] = await Promise.all([
    getPermintaan(),
    getKeputusan(),
    getDaftarKota(),
    getStokTbs(),
    getTargetKpi(),
  ]);
  const now = new Date();

  const kotaDenganKeputusan = new Set(keputusan.map((item) => item.kota_tujuan));
  const totalPermintaanMenunggu = permintaan
    .filter((item) => !kotaDenganKeputusan.has(item.kota))
    .reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0);

  const totalPermintaanTon = permintaan.reduce(
    (total, item) => total + (Number(item.jumlah_permintaan) || 0),
    0
  );

  // Kota belum terpenuhi: punya permintaan tetapi tidak ada keputusan selesai
  // dalam 7 hari terakhir.
  const kotaPermintaan = new Set(permintaan.map((item) => item.kota));
  const kotaSelesai7Hari = new Set(
    keputusan
      .filter((item) => {
        if (item.status !== "selesai") return false;
        const hari = hariSejakWaktu(item.waktu_selesai, now) ?? hariSejakTanggal(item.tanggal_keputusan, now);
        return hari !== null && hari <= 7;
      })
      .map((item) => item.kota_tujuan)
  );
  const kotaBelumTerpenuhi = [...kotaPermintaan].filter((kota) => !kotaSelesai7Hari.has(kota)).length;

  const rataHarian = rataPermintaanHarian(permintaan, 30, now);
  const hariStokHabis = rataHarian > 0 ? Math.floor(stok / rataHarian) : null;

  // Ambang status stok dibaca dari target manajemen (bukan konstanta):
  // di bawah minHariPasokan = perhatian, di bawah setengahnya = kritis.
  const ambangKritis = Math.max(1, Math.ceil(target.minHariPasokan / 2));
  let statusStok = "aman";
  if (hariStokHabis !== null) {
    if (hariStokHabis < ambangKritis) statusStok = "kritis";
    else if (hariStokHabis <= target.minHariPasokan) statusStok = "perhatian";
    else statusStok = "aman";
  }

  return {
    stokTersisa: stok,
    totalPermintaanMenunggu: bulatkan(totalPermintaanMenunggu, 1),
    totalPermintaanTon: bulatkan(totalPermintaanTon, 1),
    kotaBelumTerpenuhi,
    hariStokHabis,
    statusStok,
    rataPermintaanHarian: bulatkan(rataHarian, 1),
    defisitSurplus: bulatkan(stok - totalPermintaanMenunggu, 1),
  };
}

// ── 2. Tindakan mendesak ─────────────────────────────────────────────────────
const RANK_TINGKAT = { kritis: 0, perhatian: 1, informasi: 2 };

export async function getTindakanMendesak() {
  const [permintaan, keputusan, daftarKota, stok, target] = await Promise.all([
    getPermintaan(),
    getKeputusan(),
    getDaftarKota(),
    getStokTbs(),
    getTargetKpi(),
  ]);
  const now = new Date();
  const tindakan = [];

  const totalKapasitas = daftarKota.reduce((total, kota) => total + (Number(kota.kapasitas) || 0), 0);
  const selesaiTerakhir = petaSelesaiTerakhir(keputusan);
  const earliestInput = petaEarliestInput(permintaan);

  // stok_kritis: stok di bawah 20 persen kapasitas total
  if (totalKapasitas > 0 && stok < 0.2 * totalKapasitas) {
    tindakan.push({
      tipe: "stok_kritis",
      tingkat: "kritis",
      judul: "Stok TBS kritis",
      deskripsi: `Stok tersisa ${stok} ton, di bawah 20 persen kapasitas total (${totalKapasitas} ton).`,
      aksi: "keputusan-distribusi",
      data: { stok, totalKapasitas, ambang: Math.round(0.2 * totalKapasitas) },
    });
  }

  // kota_terbengkalai: tidak dapat distribusi selesai dalam 10 hari serta
  // masih ada permintaan (kritis > 10 hari, perhatian 7 sampai 10 hari)
  const kotaPermintaan = new Set(permintaan.map((item) => item.kota));
  kotaPermintaan.forEach((kota) => {
    const hari = hitungHariTanpaDistribusi(kota, selesaiTerakhir, earliestInput, now);
    if (hari > 10) {
      tindakan.push({
        tipe: "kota_terbengkalai",
        tingkat: "kritis",
        judul: `Kota ${kota} terbengkalai`,
        deskripsi: `${kota} belum menerima distribusi selesai selama ${hari} hari sementara masih ada permintaan.`,
        aksi: "keputusan-distribusi",
        data: { kota, hariTanpaDistribusi: hari },
      });
    } else if (hari >= 7) {
      tindakan.push({
        tipe: "kota_terbengkalai",
        tingkat: "perhatian",
        judul: `Kota ${kota} perlu perhatian`,
        deskripsi: `${kota} belum menerima distribusi selesai selama ${hari} hari.`,
        aksi: "keputusan-distribusi",
        data: { kota, hariTanpaDistribusi: hari },
      });
    }
  });

  // anomali_permintaan: permintaan terbaru melebihi rata-rata historis lebih
  // dari 50 persen
  const permintaanByKota = new Map();
  permintaan.forEach((item) => {
    const list = permintaanByKota.get(item.kota) ?? [];
    list.push(item);
    permintaanByKota.set(item.kota, list);
  });
  permintaanByKota.forEach((list, kota) => {
    if (list.length < 2) return;
    const urut = [...list].sort(
      (a, b) => parseTanggal(a.tanggal_permintaan) - parseTanggal(b.tanggal_permintaan)
    );
    const terbaru = Number(urut[urut.length - 1].jumlah_permintaan) || 0;
    const sebelumnya = urut.slice(0, -1);
    const rata = sebelumnya.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0) / sebelumnya.length;
    if (rata > 0 && terbaru > rata * 1.5) {
      tindakan.push({
        tipe: "anomali_permintaan",
        tingkat: "perhatian",
        judul: `Lonjakan permintaan ${kota}`,
        deskripsi: `Permintaan terbaru ${terbaru} ton, lebih dari 50 persen di atas rata-rata historis (${bulatkan(rata, 1)} ton).`,
        aksi: "analisis-ranking",
        data: { kota, terbaru, rataHistoris: bulatkan(rata, 1) },
      });
    }
  });

  // eta_terlewat: keputusan dalam pengiriman yang sudah melewati tanggal ETA
  keputusan.forEach((item) => {
    if (item.status === "dalam-pengiriman" && item.eta && parseTanggal(item.eta) < startOfToday(now)) {
      tindakan.push({
        tipe: "eta_terlewat",
        tingkat: "kritis",
        judul: `Estimasi tiba terlewat: ${item.kota_tujuan}`,
        deskripsi: `Pengiriman ke ${item.kota_tujuan} sudah melewati estimasi tiba ${item.eta}.`,
        aksi: "keputusan-distribusi",
        data: { id: item.id, kota: item.kota_tujuan, eta: item.eta },
      });
    }
  });

  // keputusan_pending_lama: keputusan menunggu melewati batas eskalasi yang
  // ditetapkan manajer (target.maxHariEskalasi), bukan konstanta.
  keputusan.forEach((item) => {
    if (item.status !== "menunggu") return;
    const hari = hariSejakWaktu(item.waktu_menunggu, now) ?? hariSejakTanggal(item.tanggal_keputusan, now) ?? 0;
    if (hari > target.maxHariEskalasi) {
      tindakan.push({
        tipe: "keputusan_pending_lama",
        tingkat: "perhatian",
        judul: `Keputusan tertunda: ${item.kota_tujuan}`,
        deskripsi: `Keputusan ke ${item.kota_tujuan} sudah ${hari} hari berstatus menunggu dan belum dieksekusi.`,
        aksi: "keputusan-distribusi",
        data: { id: item.id, kota: item.kota_tujuan, hari },
      });
    }
  });

  return tindakan.sort((a, b) => RANK_TINGKAT[a.tingkat] - RANK_TINGKAT[b.tingkat]);
}

// ── 3. Rekomendasi prioritas ─────────────────────────────────────────────────
export async function getRekomendasiPrioritas() {
  const [rekomendasi, keputusan, permintaan] = await Promise.all([
    getRekomendasiDistribusi(),
    getKeputusan(),
    getPermintaan(),
  ]);
  const now = new Date();
  const selesaiTerakhir = petaSelesaiTerakhir(keputusan);
  const earliestInput = petaEarliestInput(permintaan);

  // Status keputusan aktif per kota (menunggu/dalam-pengiriman), jika tidak ada
  // ambil selesai, jika belum pernah "belum-ada".
  const statusKeputusanByKota = new Map();
  keputusan.forEach((item) => {
    const prev = statusKeputusanByKota.get(item.kota_tujuan);
    if (STATUS_AKTIF.includes(item.status)) {
      statusKeputusanByKota.set(item.kota_tujuan, item.status);
    } else if (!prev) {
      statusKeputusanByKota.set(item.kota_tujuan, item.status);
    }
  });

  return rekomendasi
    .map((item) => {
      const hariTanpaDistribusi = hitungHariTanpaDistribusi(item.kota, selesaiTerakhir, earliestInput, now);
      const statusKeputusanAktif = statusKeputusanByKota.get(item.kota) ?? "belum-ada";
      const skorUrgensi = Math.min(100, Math.round(item.skor * 0.6 + hariTanpaDistribusi * 2));
      return { ...item, hariTanpaDistribusi, statusKeputusanAktif, skorUrgensi };
    })
    .sort((a, b) => b.skorUrgensi - a.skorUrgensi);
}

// ── 4. Keputusan berjalan ────────────────────────────────────────────────────
export async function getKeputusanBerjalan() {
  const keputusan = await getKeputusan();
  const now = new Date();

  return keputusan
    .filter((item) => STATUS_AKTIF.includes(item.status))
    .map((item) => {
      const durasiHari = Math.max(0, hariSejakTanggal(item.tanggal_keputusan, now) ?? 0);
      let statusEta = "tanpa_eta";
      if (item.eta) {
        statusEta = parseTanggal(item.eta) < startOfToday(now) ? "terlewat" : "tepat_waktu";
      }
      return {
        id: item.id,
        kota: item.kota_tujuan,
        volume_tbs: item.volume_tbs,
        status: item.status,
        tanggal_keputusan: item.tanggal_keputusan,
        armada: item.armada,
        eta: item.eta,
        durasiHari,
        statusEta,
      };
    })
    .sort((a, b) => b.durasiHari - a.durasiHari);
}

// ── 5. Proyeksi stok ─────────────────────────────────────────────────────────
export async function getProyeksiStok() {
  const [permintaan, stok] = await Promise.all([getPermintaan(), getStokTbs()]);
  const now = new Date();
  const rataHarian = rataPermintaanHarian(permintaan, 30, now);
  const hariHabis = rataHarian > 0 ? Math.floor(stok / rataHarian) : null;

  const proyeksi = [];
  for (let i = 1; i <= 14; i += 1) {
    const tanggal = new Date(startOfToday(now).getTime() + i * DAY_MS);
    const estimasiStok = Math.max(0, bulatkan(stok - rataHarian * i, 1));
    proyeksi.push({ tanggal: toTanggalKey(tanggal), estimasiStok });
  }

  return {
    stokSaatIni: stok,
    rataPermintaanHarian: bulatkan(rataHarian, 1),
    hariHabis,
    proyeksi,
  };
}

// ── 6. KPI Manajer (diekspos sebagai /mis/kpi agar tidak menimpa /kpi lama) ──
// Mengembalikan realisasi + target manajemen + status tercapai/meleset per
// KPI (management by objectives) — angka tidak berdiri sendiri, selalu
// dibandingkan dengan target yang ditetapkan manajer.
export async function getKpiManajer() {
  const [keputusan, daftarKota, target] = await Promise.all([
    getKeputusan(),
    getDaftarKota(),
    getTargetKpi(),
  ]);

  const total = keputusan.length;
  const selesai = keputusan.filter((item) => item.status === "selesai");
  const tingkatPemenuhan = total > 0 ? Math.round((selesai.length / total) * 100) : 0;

  const keputusanAktif = keputusan.filter((item) => STATUS_AKTIF.includes(item.status)).length;

  // Rata-rata waktu pengiriman (hari): dari mulai pengiriman ke selesai, atau
  // fallback dari mulai menunggu ke selesai.
  const durasiList = selesai
    .map((item) => {
      const mulai = item.waktu_dalam_pengiriman ?? item.waktu_menunggu;
      if (!mulai || !item.waktu_selesai) return null;
      return (new Date(item.waktu_selesai) - new Date(mulai)) / DAY_MS;
    })
    .filter((nilai) => nilai !== null && nilai >= 0);
  const rataWaktuPengiriman =
    durasiList.length > 0 ? bulatkan(durasiList.reduce((a, b) => a + b, 0) / durasiList.length, 1) : null;

  // Utilisasi kapasitas rata-rata: alokasi aktif per kota dibagi kapasitasnya.
  const alokasiByKota = keputusan.reduce((map, item) => {
    map.set(item.kota_tujuan, (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0));
    return map;
  }, new Map());
  const utilList = daftarKota
    .filter((kota) => Number(kota.kapasitas) > 0)
    .map((kota) => Math.min(100, ((alokasiByKota.get(kota.nama) || 0) / kota.kapasitas) * 100));
  const utilisasiKapasitas =
    utilList.length > 0 ? Math.round(utilList.reduce((a, b) => a + b, 0) / utilList.length) : 0;

  const status = {
    pemenuhan: tingkatPemenuhan >= target.targetPemenuhan ? "tercapai" : "meleset",
    waktuKirim:
      rataWaktuPengiriman === null
        ? "tak-terukur"
        : rataWaktuPengiriman <= target.targetWaktuKirim
          ? "tercapai"
          : "meleset",
    utilisasi: utilisasiKapasitas >= target.targetUtilisasi ? "tercapai" : "meleset",
  };

  return { tingkatPemenuhan, keputusanAktif, rataWaktuPengiriman, utilisasiKapasitas, target, status };
}

// ── 7. Efisiensi logistik ────────────────────────────────────────────────────
export async function getEfisiensiLogistik() {
  const keputusan = await getKeputusan();
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);

  // Tingkat penyelesaian bulan ini: keputusan selesai bulan ini dibagi seluruh
  // keputusan yang dibuat bulan ini.
  const bulanIni = keputusan.filter((item) => parseTanggal(item.tanggal_keputusan) >= awalBulan);
  const selesaiBulanIni = bulanIni.filter((item) => item.status === "selesai").length;
  const tingkatPenyelesaian =
    bulanIni.length > 0 ? Math.round((selesaiBulanIni / bulanIni.length) * 100) : 0;

  // Keputusan pending lama: aktif lebih dari 2 hari sejak masuk status
  // sekarang tanpa berubah.
  const keputusanPendingLama = keputusan
    .filter((item) => STATUS_AKTIF.includes(item.status))
    .map((item) => {
      const waktuStatus = item.status === "dalam-pengiriman" ? item.waktu_dalam_pengiriman : item.waktu_menunggu;
      const hari = hariSejakWaktu(waktuStatus, now) ?? hariSejakTanggal(item.tanggal_keputusan, now) ?? 0;
      return { id: item.id, kota: item.kota_tujuan, status: item.status, durasiHari: hari };
    })
    .filter((item) => item.durasiHari > 2)
    .sort((a, b) => b.durasiHari - a.durasiHari);

  // Rata-rata waktu per perubahan status (jam).
  const rataTransisi = (dariField, keField) => {
    const nilai = keputusan
      .map((item) => {
        if (!item[dariField] || !item[keField]) return null;
        return (new Date(item[keField]) - new Date(item[dariField])) / (1000 * 60 * 60);
      })
      .filter((n) => n !== null && n >= 0);
    return nilai.length > 0 ? bulatkan(nilai.reduce((a, b) => a + b, 0) / nilai.length, 1) : null;
  };

  const rataWaktuPerStatus = {
    menungguKeDalamPengiriman: rataTransisi("waktu_menunggu", "waktu_dalam_pengiriman"),
    dalamPengirimanKeSelesai: rataTransisi("waktu_dalam_pengiriman", "waktu_selesai"),
  };

  return { tingkatPenyelesaian, keputusanPendingLama, rataWaktuPerStatus };
}

// ── 8. Sinkronisasi notifikasi cerdas ────────────────────────────────────────
// Membuat notifikasi otomatis berbasis kondisi MIS, dengan dedupe 24 jam agar
// tidak menumpuk saat kondisi yang sama masih berlaku:
//   - proyeksi stok: bila stok diperkirakan habis < 14 hari (tipe kritis)
//   - eskalasi keputusan: bila keputusan menunggu > 3 hari (tipe perhatian)
export async function sinkronNotifikasiMis() {
  const dibuat = [];
  const now = new Date();
  const target = await getTargetKpi();

  // Rekam snapshot KPI hari ini (satu baris per tanggal) — fail-soft agar
  // kegagalan perekaman tidak menggagalkan sinkronisasi notifikasi.
  let snapshotDirekam = false;
  try {
    await rekamKpiSnapshotHarian(now);
    snapshotDirekam = true;
  } catch {
    // biarkan: snapshot menyusul pada pemuatan dashboard berikutnya
  }

  const proyeksi = await getProyeksiStok();
  if (proyeksi.hariHabis !== null && proyeksi.hariHabis < target.minHariPasokan) {
    const judul = "Proyeksi stok TBS menipis";
    if (!(await adaNotifikasiTerbaru(judul))) {
      await tambahNotifikasi({
        judul,
        pesan: `Stok TBS diperkirakan habis dalam ${proyeksi.hariHabis} hari berdasarkan laju permintaan.`,
        tipe: "kritis",
      });
      dibuat.push(judul);
    }
  }

  const keputusan = await getKeputusan();
  for (const item of keputusan) {
    if (item.status !== "menunggu") continue;
    const hari = hariSejakWaktu(item.waktu_menunggu, now) ?? hariSejakTanggal(item.tanggal_keputusan, now) ?? 0;
    if (hari > target.maxHariEskalasi) {
      const judul = `Eskalasi keputusan ${item.kota_tujuan}`;
      if (!(await adaNotifikasiTerbaru(judul))) {
        await tambahNotifikasi({
          judul,
          pesan: `Keputusan ke kota ${item.kota_tujuan} sudah ${hari} hari belum dieksekusi Tim Logistik.`,
          tipe: "perhatian",
        });
        dibuat.push(judul);
      }
    }
  }

  return { dibuat: dibuat.length, judul: dibuat, snapshotDirekam };
}

// ── 9. Riwayat KPI harian (time-series untuk Tren Kinerja) ──────────────────
// Snapshot direkam maksimal sekali per tanggal (upsert), sehingga memanggil
// berulang di hari yang sama hanya memperbarui nilai hari itu — riwayat hari
// sebelumnya tidak pernah ditulis ulang.
export async function rekamKpiSnapshotHarian(base = new Date()) {
  const tanggal = toTanggalKey(startOfToday(base));
  const [kpi, permintaan, stok] = await Promise.all([
    getKpiManajer(),
    getPermintaan(),
    getStokTbs(),
  ]);

  const totalPermintaanTon = bulatkan(
    permintaan.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0),
    1
  );

  const data = {
    tingkatPemenuhan: kpi.tingkatPemenuhan,
    keputusanAktif: kpi.keputusanAktif,
    rataWaktuPengiriman: kpi.rataWaktuPengiriman,
    utilisasiKapasitas: kpi.utilisasiKapasitas,
    stokTbs: stok,
    totalPermintaanTon,
  };

  return prisma.kpiSnapshot.upsert({
    where: { tanggal },
    update: data,
    create: { tanggal, ...data },
  });
}

// Riwayat snapshot KPI N hari terakhir, terurut menaik (siap untuk sumbu-x
// grafik tren). Default 30 hari.
export async function getRiwayatKpi(hari = 30) {
  const jumlahHari = Math.min(90, Math.max(1, Number(hari) || 30));
  const rows = await prisma.kpiSnapshot.findMany({
    orderBy: { tanggal: "desc" },
    take: jumlahHari,
  });
  return rows.reverse().map((row) => ({
    tanggal: row.tanggal,
    tingkatPemenuhan: row.tingkatPemenuhan,
    keputusanAktif: row.keputusanAktif,
    rataWaktuPengiriman: row.rataWaktuPengiriman,
    utilisasiKapasitas: row.utilisasiKapasitas,
    stokTbs: row.stokTbs,
    totalPermintaanTon: row.totalPermintaanTon,
  }));
}
