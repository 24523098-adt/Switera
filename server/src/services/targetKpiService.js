import prisma from "../db/prismaClient.js";
import { catatAktivitas } from "./activityLogService.js";

const SINGLETON_ID = "singleton";

// Default target — hanya dipakai bila baris singleton belum ada (mis. DB lama
// yang belum di-seed ulang). Nilainya sama dengan default kolom di schema.
export const TARGET_DEFAULT = {
  targetPemenuhan: 80,
  targetWaktuKirim: 2,
  targetUtilisasi: 70,
  minHariPasokan: 14,
  maxHariEskalasi: 3,
};

const toApi = (row) => ({
  targetPemenuhan: row.targetPemenuhan,
  targetWaktuKirim: row.targetWaktuKirim,
  targetUtilisasi: row.targetUtilisasi,
  minHariPasokan: row.minHariPasokan,
  maxHariEskalasi: row.maxHariEskalasi,
});

/**
 * Target KPI yang berlaku saat ini (management by objectives). Bila baris
 * singleton belum ada, kembalikan default tanpa menulis — pembuatan baris
 * terjadi lewat setTargetKpi atau seed.
 */
export async function getTargetKpi() {
  const row = await prisma.targetKpi.findUnique({ where: { id: SINGLETON_ID } });
  return row ? toApi(row) : { ...TARGET_DEFAULT };
}

/**
 * Memperbarui target KPI (upsert singleton, pola stokService.setStokTbs) dan
 * mencatat activity log berisi ringkasan nilai baru agar perubahan target
 * manajemen punya jejak audit.
 */
export async function setTargetKpi(data, aktor, role) {
  const row = await prisma.targetKpi.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...TARGET_DEFAULT, ...data },
  });

  await catatAktivitas(
    aktor,
    role,
    `Memperbarui target kinerja (pemenuhan ${row.targetPemenuhan}%, waktu kirim ${row.targetWaktuKirim} hari, ` +
      `utilisasi ${row.targetUtilisasi}%, pasokan min ${row.minHariPasokan} hari, eskalasi ${row.maxHariEskalasi} hari)`
  );

  return toApi(row);
}
