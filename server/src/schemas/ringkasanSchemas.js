import { z } from "zod";

// Body shape: { periode: "semua" | "minggu-ini" | "bulan-ini" }. Nilai enum
// mengikuti periodeOptions di src/pages/Laporan.jsx — satu-satunya field
// yang di-allowlist untuk endpoint ringkasan AI.

export const ringkasanCreateSchema = z.object({
  periode: z
    .enum(["semua", "minggu-ini", "bulan-ini"], {
      errorMap: () => ({ message: "Periode tidak valid." }),
    })
    .default("semua"),
});
