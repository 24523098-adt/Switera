import Anthropic from "@anthropic-ai/sdk";
import { getDaftarKota } from "./kotaService.js";
import { getPermintaan } from "./permintaanService.js";
import { getStokTbs } from "./stokService.js";
import { getKeputusan, getRiwayatKeputusan } from "./keputusanService.js";
import { getKpiMetrics } from "./distribusiService.js";

// AI-1: ringkasan naratif halaman Laporan. Panggilan Claude API hanya
// terjadi di sini (server-side) — ANTHROPIC_API_KEY dibaca dari server/.env
// dan tidak pernah dikirim ke frontend.

const MODEL = "claude-opus-4-8";

// Klien dibuat lazy (bukan module-level) supaya server tetap bisa boot
// tanpa ANTHROPIC_API_KEY — endpoint lain tidak boleh ikut tumbang hanya
// karena fitur AI belum dikonfigurasi.
let anthropicClient = null;

const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(
      new Error(
        "Ringkasan AI belum dikonfigurasi. Set ANTHROPIC_API_KEY di server/.env lalu restart server."
      ),
      { statusCode: 503 }
    );
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }

  return anthropicClient;
};

// Ported verbatim dari src/utils/distribusi.js (getPeriodRange/isDateInRange)
// agar angka pada ringkasan cocok persis dengan filter periode yang dilihat
// pengguna di Laporan.jsx. Jangan ubah logikanya di salah satu sisi saja.
const parseDate = (value) => new Date(`${value}T00:00:00`);

const getPeriodRange = (periode, baseDate = new Date()) => {
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

const isDateInRange = (value, range) => {
  const current = parseDate(value);
  return current >= range.start && current <= range.end;
};

const periodeLabels = {
  semua: "seluruh periode",
  "minggu-ini": "minggu ini",
  "bulan-ini": "bulan ini",
};

const totalTon = (rows, field) =>
  rows.reduce((total, item) => total + (Number(item[field]) || 0), 0);

const topKota = (rows, kotaField, volumeField, limit = 8) => {
  const grouped = rows.reduce((result, item) => {
    const kota = item[kotaField];
    result.set(kota, (result.get(kota) ?? 0) + (Number(item[volumeField]) || 0));
    return result;
  }, new Map());

  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([kota, ton]) => ({ kota, ton }));
};

// Agregat ringkas (bukan baris mentah) supaya prompt tetap kecil berapa pun
// besar datanya — Claude menerima angka yang sudah dihitung server, bukan
// dump tabel.
const buildDataLaporan = (periode, role, data) => {
  const { permintaan, keputusan, riwayat, daftarKota, stokTbs, kpi } = data;
  const range = periode === "semua" ? null : getPeriodRange(periode);

  const filteredPermintaan = permintaan.filter(
    (item) => !range || isDateInRange(item.tanggal_permintaan, range)
  );
  const filteredKeputusan = keputusan.filter(
    (item) => !range || isDateInRange(item.tanggal_keputusan, range)
  );
  const filteredRiwayat = riwayat.filter(
    (item) => !range || isDateInRange(item.tanggal_keputusan, range)
  );

  const statusCounts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
  filteredKeputusan.forEach((item) => {
    if (statusCounts[item.status] !== undefined) {
      statusCounts[item.status] += 1;
    }
  });

  return {
    periode: periodeLabels[periode] ?? periode,
    sudutPandang:
      role === "Tim Logistik"
        ? "Tim Logistik (fokus operasional: progres pengiriman, armada, status distribusi)"
        : "Manajer Distribusi (fokus manajerial: riwayat keputusan, pemenuhan permintaan, alokasi antar kota)",
    stokTbsSaatIniTon: stokTbs,
    jumlahKotaTerdaftar: daftarKota.length,
    permintaan: {
      jumlahEntri: filteredPermintaan.length,
      totalTon: totalTon(filteredPermintaan, "jumlah_permintaan"),
      kotaTeratas: topKota(filteredPermintaan, "kota", "jumlah_permintaan"),
    },
    distribusiAktif: {
      jumlah: filteredKeputusan.length,
      totalTon: totalTon(filteredKeputusan, "volume_tbs"),
      statusPengiriman: statusCounts,
      kotaTujuanTeratas: topKota(filteredKeputusan, "kota_tujuan", "volume_tbs"),
    },
    riwayatKeputusan: {
      jumlah: filteredRiwayat.length,
      totalTon: totalTon(filteredRiwayat, "volume_tbs"),
      selesai: filteredRiwayat.filter((item) => item.status === "selesai").length,
      dibatalkan: filteredRiwayat.filter((item) => item.status === "dibatalkan").length,
    },
    kpi: {
      tingkatPemenuhanPersen: kpi.fulfillmentRate,
      tepatWaktuPersen: kpi.onTimeRate,
      rataRataSiklusJam:
        kpi.avgSiklusJam === null ? null : Math.round(kpi.avgSiklusJam * 10) / 10,
      kotaTercover: kpi.kotaTercover,
      totalKota: kpi.totalKota,
    },
  };
};

const SYSTEM_PROMPT = [
  "Kamu adalah analis distribusi untuk Switera, aplikasi manajemen distribusi",
  "stok TBS (tandan buah segar kelapa sawit) antar kota. Tugasmu menulis",
  "ringkasan laporan distribusi dalam Bahasa Indonesia yang baik.",
  "",
  "Aturan penulisan:",
  "- Tulis 2-4 paragraf naratif yang mengalir; tanpa heading, tanpa bullet,",
  "  tanpa markdown, tanpa sapaan pembuka atau penutup.",
  "- Mulai langsung dari temuan terpenting untuk sudut pandang pembaca.",
  "- Sebut angka penting (total ton, jumlah pengiriman, persentase KPI)",
  "  persis seperti pada data — jangan mengarang atau membulatkan sendiri.",
  "- Jika suatu nilai null atau datanya kosong, katakan datanya belum",
  "  tersedia; jangan berspekulasi.",
  "- Tutup dengan satu observasi atau perhatian yang layak ditindaklanjuti",
  "  (mis. kota dengan permintaan belum terpenuhi, pengiriman menumpuk di",
  "  status tertentu, atau stok menipis).",
].join("\n");

const extractText = (response) =>
  response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

export async function buatRingkasanLaporan(periode, role) {
  const client = getClient();

  const [permintaan, keputusan, riwayat, daftarKota, stokTbs, kpi] =
    await Promise.all([
      getPermintaan(),
      getKeputusan(),
      getRiwayatKeputusan(),
      getDaftarKota(),
      getStokTbs(),
      getKpiMetrics(),
    ]);

  const dataLaporan = buildDataLaporan(periode, role, {
    permintaan,
    keputusan,
    riwayat,
    daftarKota,
    stokTbs,
    kpi,
  });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Buat ringkasan laporan distribusi dari data berikut:\n\n${JSON.stringify(dataLaporan, null, 2)}`,
        },
      ],
    });
  } catch (error) {
    // Kegagalan layanan AI tidak boleh bocor sebagai 500 generik — petakan
    // ke pesan Indonesia yang bisa ditampilkan langsung oleh Laporan.jsx.
    if (error instanceof Anthropic.AuthenticationError) {
      throw Object.assign(
        new Error("Kunci API layanan AI tidak valid. Periksa ANTHROPIC_API_KEY di server/.env."),
        { statusCode: 503 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw Object.assign(
        new Error("Layanan AI sedang sibuk. Coba lagi beberapa saat lagi."),
        { statusCode: 503 }
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw Object.assign(
        new Error("Tidak dapat menghubungi layanan AI. Periksa koneksi internet server."),
        { statusCode: 502 }
      );
    }
    throw Object.assign(
      new Error("Layanan AI mengalami gangguan. Coba lagi nanti."),
      { statusCode: 502 }
    );
  }

  const ringkasan = extractText(response);

  if (!ringkasan) {
    throw Object.assign(
      new Error("Layanan AI tidak mengembalikan ringkasan. Coba lagi."),
      { statusCode: 502 }
    );
  }

  return {
    ringkasan,
    periode,
    dibuatPada: new Date().toISOString(),
  };
}
