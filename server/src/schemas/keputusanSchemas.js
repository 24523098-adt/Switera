import { z } from "zod";

/**
 * Schema for POST /keputusan (create). Mirrors src/store.js's keputusan
 * shape (snake_case): kota_tujuan, volume_tbs, tanggal_keputusan,
 * diputuskan_oleh, status. volume_tbs is coerced from numeric strings then
 * rejected if non-positive (T-08-D-NEG). status is optional — the service
 * defaults it to "menunggu" when absent, matching src/store.js's
 * addKeputusan (`entry.status ?? "menunggu"`).
 */
export const keputusanCreateSchema = z.object({
  kota_tujuan: z.string().min(1, "Kota tujuan wajib diisi."),
  volume_tbs: z.coerce.number().positive("Volume TBS harus lebih dari 0."),
  tanggal_keputusan: z.string().min(1, "Tanggal keputusan wajib diisi."),
  diputuskan_oleh: z.string().min(1, "Diputuskan oleh wajib diisi."),
  status: z.enum(["menunggu", "dalam-pengiriman", "selesai"]).optional(),
});

/**
 * Schema for PUT /keputusan/:id (partial update). Every field optional;
 * volume_tbs, when present, still must be positive. status's enum includes
 * "dibatalkan" — store.js itself writes "dibatalkan" via updates in some
 * internal paths (see STATE.md 06-01 decision note), even though the
 * public cancel path is DELETE, not PUT — kept permissive here to match
 * that existing internal flexibility.
 */
export const keputusanUpdateSchema = z.object({
  kota_tujuan: z.string().min(1, "Kota tujuan wajib diisi.").optional(),
  volume_tbs: z.coerce.number().positive("Volume TBS harus lebih dari 0.").optional(),
  tanggal_keputusan: z.string().min(1, "Tanggal keputusan wajib diisi.").optional(),
  diputuskan_oleh: z.string().min(1, "Diputuskan oleh wajib diisi.").optional(),
  status: z.enum(["menunggu", "dalam-pengiriman", "selesai", "dibatalkan"]).optional(),
  armada: z.string().optional(),
  eta: z.string().optional(),
});
