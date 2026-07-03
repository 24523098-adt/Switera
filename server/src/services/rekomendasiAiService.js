import { getPermintaan } from "./permintaanService.js";
import { getStokTbs } from "./stokService.js";
import { getKeputusan } from "./keputusanService.js";
import { getRekomendasiDistribusi } from "./distribusiService.js";
import { generateText } from "./geminiClient.js";

// AI-2: rekomendasi keputusan naratif untuk halaman Keputusan Distribusi.
// AI TIDAK menghitung ulang skor/alokasi — ia menarasikan hasil algoritme
// getRekomendasiDistribusi() (bobot 0.65 permintaan / 0.35 kapasitas +
// alokasi walk) supaya sarannya selalu konsisten dengan angka yang tampil
// di halaman. Panggilan Gemini terpusat di geminiClient.js.

const SYSTEM_PROMPT = [
  "Kamu adalah penasihat keputusan distribusi untuk Switera, aplikasi",
  "manajemen distribusi stok TBS (tandan buah segar kelapa sawit) antar",
  "kota. Pembacamu adalah Manajer Distribusi yang akan menekan tombol",
  "'Setujui Rekomendasi' atau memilih kota lain.",
  "",
  "Aturan penulisan:",
  "- Buka dengan satu paragraf singkat kondisi saat ini (stok tersedia,",
  "  total permintaan, berapa kota antre).",
  "- Lanjutkan dengan rekomendasi bernomor (maksimal 3) urut prioritas.",
  "  Tiap nomor: nama kota, volume alokasi dalam ton persis seperti pada",
  "  data, dan alasan singkat (skor, permintaan, batasan kapasitas/stok).",
  "- Rekomendasikan HANYA kota dengan alokasiDisarankanTon lebih dari 0.",
  "  Jika tidak ada kota yang layak, jangan membuat daftar — katakan stok",
  "  tidak mencukupi dan sarankan menambah stok TBS terlebih dahulu.",
  "- JANGAN merekomendasikan kota yang tercantum pada daftar",
  "  kotaDenganKeputusanAktif — kota itu sudah punya keputusan berjalan",
  "  dan sistem akan menolak keputusan baru untuknya.",
  "- Gunakan angka persis dari data; jangan mengarang atau menghitung",
  "  ulang skor/alokasi.",
  "- Tutup dengan satu kalimat risiko atau catatan (mis. stok tersisa",
  "  setelah alokasi, permintaan yang tidak terpenuhi).",
  "- Teks polos berbahasa Indonesia; tanpa heading, tanpa markdown, tanpa",
  "  sapaan. Penomoran cukup '1.', '2.', '3.' di awal baris.",
].join("\n");

export async function buatRekomendasiKeputusan() {
  const [permintaan, keputusan, stokTbs, rekomendasi] = await Promise.all([
    getPermintaan(),
    getKeputusan(),
    getStokTbs(),
    getRekomendasiDistribusi(),
  ]);

  // Kota dengan keputusan belum-selesai tidak boleh direkomendasikan lagi —
  // cermin dari guard duplikat di KeputusanDistribusi.jsx (saveKeputusan).
  const kotaDenganKeputusanAktif = [
    ...new Set(
      keputusan
        .filter((item) => item.status !== "selesai")
        .map((item) => item.kota_tujuan)
    ),
  ];

  const dataKeputusan = {
    stokTbsTersediaTon: stokTbs,
    totalPermintaanTon: permintaan.reduce(
      (total, item) => total + (Number(item.jumlah_permintaan) || 0),
      0
    ),
    kotaDenganKeputusanAktif,
    // Hasil algoritme ranking/alokasi apa adanya (sudah urut skor tertinggi).
    rankingAlokasi: rekomendasi.map((item) => ({
      kota: item.kota,
      skor: item.skor,
      totalPermintaanTon: item.totalPermintaan,
      kapasitasTon: item.kapasitas,
      alokasiDisarankanTon: item.alokasi,
      terpenuhiPenuh: item.terpenuhiPenuh,
      dibatasiKapasitas: item.dibatasiKapasitas,
    })),
  };

  const rekomendasiAi = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `Berikan rekomendasi keputusan distribusi dari data berikut:\n\n${JSON.stringify(dataKeputusan, null, 2)}`,
  });

  return {
    rekomendasi: rekomendasiAi,
    dibuatPada: new Date().toISOString(),
  };
}
