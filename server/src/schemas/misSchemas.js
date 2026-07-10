import { z } from "zod";

// Body PUT /mis/target-kpi. Semua field wajib (form target selalu mengirim
// nilai lengkap), rentang dibatasi agar target tetap masuk akal sebagai
// ambang keputusan (T-08-K-MASS: hanya field allowlist ini yang diterima).
export const targetKpiUpdateSchema = z.object({
  targetPemenuhan: z.coerce
    .number({ invalid_type_error: "Target pemenuhan harus berupa angka." })
    .int("Target pemenuhan harus bilangan bulat.")
    .min(1, "Target pemenuhan minimal 1%.")
    .max(100, "Target pemenuhan maksimal 100%."),
  targetWaktuKirim: z.coerce
    .number({ invalid_type_error: "Target waktu kirim harus berupa angka." })
    .positive("Target waktu kirim harus lebih dari 0 hari.")
    .max(30, "Target waktu kirim maksimal 30 hari."),
  targetUtilisasi: z.coerce
    .number({ invalid_type_error: "Target utilisasi harus berupa angka." })
    .int("Target utilisasi harus bilangan bulat.")
    .min(1, "Target utilisasi minimal 1%.")
    .max(100, "Target utilisasi maksimal 100%."),
  minHariPasokan: z.coerce
    .number({ invalid_type_error: "Hari pasokan minimum harus berupa angka." })
    .int("Hari pasokan minimum harus bilangan bulat.")
    .min(1, "Hari pasokan minimum minimal 1 hari.")
    .max(90, "Hari pasokan minimum maksimal 90 hari."),
  maxHariEskalasi: z.coerce
    .number({ invalid_type_error: "Batas hari eskalasi harus berupa angka." })
    .int("Batas hari eskalasi harus bilangan bulat.")
    .min(1, "Batas hari eskalasi minimal 1 hari.")
    .max(30, "Batas hari eskalasi maksimal 30 hari."),
});
