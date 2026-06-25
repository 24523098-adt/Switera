import prisma from "../db/prismaClient.js";
import { tambahNotifikasi } from "./notifikasiService.js";
import { catatAktivitas } from "./activityLogService.js";

/**
 * Maps a Prisma Permintaan row (camelCase) to the src/store.js snake_case
 * API shape the frontend (Phase 9) expects: { id, kota, tanggal_permintaan,
 * tanggal_input, jumlah_permintaan, keterangan }.
 */
function toApi(row) {
  return {
    id: row.id,
    kota: row.kotaNama,
    tanggal_permintaan: row.tanggalPermintaan,
    tanggal_input: row.tanggalInput,
    jumlah_permintaan: row.jumlahPermintaan,
    keterangan: row.keterangan,
  };
}

/**
 * Maps a snake_case entry (or partial update) to Prisma camelCase data.
 * Only includes keys that are actually present on `entry` so partial
 * updates (updatePermintaan) merge correctly instead of overwriting
 * untouched fields with undefined.
 */
function toDb(entry) {
  const data = {};

  if (Object.prototype.hasOwnProperty.call(entry, "kota")) {
    data.kotaNama = entry.kota;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "tanggal_permintaan")) {
    data.tanggalPermintaan = entry.tanggal_permintaan;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "tanggal_input")) {
    data.tanggalInput = entry.tanggal_input;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "jumlah_permintaan")) {
    data.jumlahPermintaan = Number(entry.jumlah_permintaan);
  }
  if (Object.prototype.hasOwnProperty.call(entry, "keterangan")) {
    data.keterangan = entry.keterangan ?? null;
  }

  return data;
}

/**
 * Mirrors src/store.js's normalizePermintaanEntry: tanggal_permintaan
 * defaults to tanggal_input and vice-versa, so a caller that only supplies
 * one of the two date fields still gets both populated.
 */
function normalizeTanggal(entry) {
  return {
    ...entry,
    tanggal_permintaan: entry.tanggal_permintaan ?? entry.tanggal_input ?? "",
    tanggal_input: entry.tanggal_input ?? entry.tanggal_permintaan ?? "",
  };
}

/**
 * Returns every Permintaan row in the src/store.js snake_case shape.
 */
export async function getPermintaan() {
  const rows = await prisma.permintaan.findMany();
  return rows.map(toApi);
}

/**
 * Generates the next PMT-### id, replicating src/store.js's getNextId
 * exactly: find the max numeric suffix among existing ids, add 1, format
 * zero-padded to 3 digits, and skip forward past any collision.
 */
async function getNextPermintaanId() {
  const rows = await prisma.permintaan.findMany({ select: { id: true } });
  const existingIds = new Set(rows.map((row) => String(row.id)));

  let nextNumber =
    rows.reduce((maxValue, row) => {
      const numericId = Number(String(row.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  let candidate = `PMT-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `PMT-${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Returns true if a Permintaan row already exists for the same kota +
 * tanggal_permintaan (excluding excludeId, if given). Mirrors
 * src/store.js's hasPermintaanDuplikat arg keys exactly (tanggalPermintaan,
 * not tanggal_permintaan) even though the underlying field is snake_case.
 */
export async function hasPermintaanDuplikat({ kota, tanggalPermintaan, excludeId }) {
  const count = await prisma.permintaan.count({
    where: {
      kotaNama: kota,
      tanggalPermintaan,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return count > 0;
}

/**
 * Creates a new Permintaan row. Generates a PMT-### id when entry.id is
 * absent, normalizes tanggal_permintaan/tanggal_input mutual defaults, and
 * returns the created row in the store.js snake_case shape.
 *
 * Closes LOGIC-03 for this mutation: after creating the row, pushes a
 * notification (and, when the new amount anomalously exceeds the historical
 * average for that kota by more than 50%, a second warning notification),
 * then records an activity-log entry — all inside this same async function
 * body, awaited in sequence, before returning. (aktor, role) are supplied by
 * the route layer from req.user; this function never reads req.user itself.
 */
export async function addPermintaan(entry, aktor, role) {
  // Read existing history for this kota BEFORE the insert, matching
  // src/store.js:363's ordering (riwayatSebelumnya is computed before the
  // new row is added to the collection).
  const riwayatSebelumnya = await prisma.permintaan.findMany({
    where: { kotaNama: entry.kota },
  });

  const normalized = normalizeTanggal(entry);
  const id = normalized.id ?? (await getNextPermintaanId());

  const created = await prisma.permintaan.create({
    data: { id, ...toDb(normalized) },
  });

  await tambahNotifikasi({
    judul: "Data permintaan baru",
    pesan: `Data permintaan ${entry.jumlah_permintaan} ton untuk kota ${entry.kota} berhasil ditambahkan.`,
    tipe: "info",
  });

  if (riwayatSebelumnya.length > 0) {
    const rataRataSebelumnya =
      riwayatSebelumnya.reduce((total, item) => total + (Number(item.jumlahPermintaan) || 0), 0) /
      riwayatSebelumnya.length;
    const nilaiBaru = Number(entry.jumlah_permintaan) || 0;
    const batasAnomali = rataRataSebelumnya * 1.5;

    if (rataRataSebelumnya > 0 && nilaiBaru > batasAnomali) {
      await tambahNotifikasi({
        judul: "Anomali permintaan terdeteksi",
        pesan: `Permintaan kota ${entry.kota} (${nilaiBaru} ton) melebihi rata-rata historisnya (${Math.round(rataRataSebelumnya)} ton) lebih dari 50%.`,
        tipe: "warning",
      });
    }
  }

  await catatAktivitas(aktor, role, `Menambahkan data permintaan kota ${entry.kota}`);

  return toApi(created);
}

/**
 * Partially updates a Permintaan row — only the snake_case keys present on
 * `updates` are written, leaving every other field untouched. Throws a
 * statusCode-tagged 404 with the same "tidak ditemukan" Indonesian message
 * convention if the id does not exist, instead of letting Prisma's raw
 * P2025 error reach the client.
 */
export async function updatePermintaan(id, updates, aktor, role) {
  const existing = await prisma.permintaan.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error("Data permintaan tidak ditemukan."), { statusCode: 404 });
  }

  const updated = await prisma.permintaan.update({
    where: { id },
    data: toDb(updates),
  });

  await catatAktivitas(aktor, role, `Mengubah data permintaan kota ${updates.kota ?? id}`);

  return toApi(updated);
}

/**
 * Deletes a Permintaan row by id. Throws the same statusCode-tagged 404
 * convention as updatePermintaan when the id does not exist.
 */
export async function removePermintaan(id, aktor, role) {
  const existing = await prisma.permintaan.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error("Data permintaan tidak ditemukan."), { statusCode: 404 });
  }

  await prisma.permintaan.delete({ where: { id } });

  await catatAktivitas(aktor, role, `Menghapus data permintaan kota ${existing?.kotaNama ?? id}`);

  return { id };
}
