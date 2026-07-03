// Satu-satunya titik panggil Gemini API untuk seluruh backend — dipakai
// fitur AI-1 (ringkasanService) dan AI-2 (rekomendasiAiService). Kunci
// GEMINI_API_KEY dibaca dari server/.env dan tidak pernah dikirim ke
// frontend. Gemini dipilih karena punya free tier tanpa kartu kredit
// (aistudio.google.com), cukup untuk demo sekolah. Dipanggil via fetch
// bawaan Node (REST v1beta), tanpa dependency baru.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw Object.assign(
      new Error(
        "Fitur AI belum dikonfigurasi. Set GEMINI_API_KEY di server/.env lalu restart server."
      ),
      { statusCode: 503 }
    );
  }
  return key.trim();
};

const extractText = (data) =>
  (data?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

// Kegagalan layanan AI tidak boleh bocor sebagai 500 generik — semua jalur
// gagal dipetakan ke statusCode + pesan Indonesia yang bisa ditampilkan
// langsung oleh halaman pemanggil.
export async function generateText({ system, prompt }) {
  const apiKey = getApiKey();

  let response;
  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw Object.assign(
      new Error("Tidak dapat menghubungi layanan AI. Periksa koneksi internet server."),
      { statusCode: 502 }
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(
      new Error("Kunci API layanan AI tidak valid. Periksa GEMINI_API_KEY di server/.env."),
      { statusCode: 503 }
    );
  }
  if (response.status === 429) {
    throw Object.assign(
      new Error("Kuota gratis layanan AI tercapai. Coba lagi beberapa saat lagi."),
      { statusCode: 503 }
    );
  }
  if (!response.ok) {
    throw Object.assign(
      new Error("Layanan AI mengalami gangguan. Coba lagi nanti."),
      { statusCode: 502 }
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Model kadang menyelipkan penanda bold markdown meski diminta teks
  // polos — frontend merender plain text, jadi '**' akan tampil mentah.
  const text = extractText(payload).replace(/\*\*/g, "");

  if (!text) {
    throw Object.assign(
      new Error("Layanan AI tidak mengembalikan jawaban. Coba lagi."),
      { statusCode: 502 }
    );
  }

  return text;
}
