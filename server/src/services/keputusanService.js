import prisma from "../db/prismaClient.js";
import { tambahNotifikasi } from "./notifikasiService.js";
import { catatAktivitas } from "./activityLogService.js";

/**
 * Mirrors src/store.js's statusLabelMap exactly — used to build the
 * human-readable status label in the "Status distribusi diperbarui"
 * notification/activity-log message (updateKeputusan's LOGIC-03 side
 * effect below).
 */
const statusLabelMap = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};

/**
 * Maps a status value to its corresponding "waktu*" DateTime column name on
 * both the Keputusan and RiwayatKeputusan tables (waktuMenunggu,
 * waktuDalamPengiriman, waktuSelesai, waktuDibatalkan). Mirrors
 * src/store.js's template-literal convention (`waktu_${status}`) but with
 * the snake_case status converted to the schema's camelCase column name.
 */
const WAKTU_FIELD_BY_STATUS = {
  menunggu: "waktuMenunggu",
  "dalam-pengiriman": "waktuDalamPengiriman",
  selesai: "waktuSelesai",
  dibatalkan: "waktuDibatalkan",
};

// Id baris singleton stok TBS (lihat Stok model di schema.prisma) — dipakai
// oleh penyesuaian stok C-1 di bawah (kurang saat keputusan dibuat/di-undo,
// tambah saat dibatalkan).
const STOK_SINGLETON_ID = "singleton";

/**
 * Maps a Prisma Keputusan/RiwayatKeputusan row (camelCase) to the
 * src/store.js snake_case API shape the frontend expects: { id,
 * kota_tujuan, volume_tbs, tanggal_keputusan, diputuskan_oleh, status,
 * waktu_menunggu, waktu_dalam_pengiriman, waktu_selesai, waktu_dibatalkan }.
 */
function toApi(row) {
  return {
    id: row.id,
    kota_tujuan: row.kotaTujuanNama,
    volume_tbs: row.volumeTbs,
    tanggal_keputusan: row.tanggalKeputusan,
    diputuskan_oleh: row.diputuskanOleh,
    status: row.status,
    armada: row.armada,
    eta: row.eta,
    waktu_menunggu: row.waktuMenunggu,
    waktu_dalam_pengiriman: row.waktuDalamPengiriman,
    waktu_selesai: row.waktuSelesai,
    waktu_dibatalkan: row.waktuDibatalkan,
  };
}

/**
 * Maps a snake_case entry (or partial update) to Prisma camelCase data.
 * Only includes keys actually present on `entry` (via hasOwnProperty) so
 * partial updates (updateKeputusan) merge correctly instead of overwriting
 * untouched fields with undefined. The four waktu_* fields pass through
 * as-is (null/undefined for absent ones) — callers that need to SET a
 * waktu_* timestamp do so explicitly outside toDb (see addKeputusan /
 * updateKeputusan below), never by guessing it from entry.
 */
function toDb(entry) {
  const data = {};

  if (Object.prototype.hasOwnProperty.call(entry, "kota_tujuan")) {
    data.kotaTujuanNama = entry.kota_tujuan;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "volume_tbs")) {
    data.volumeTbs = Number(entry.volume_tbs);
  }
  if (Object.prototype.hasOwnProperty.call(entry, "tanggal_keputusan")) {
    data.tanggalKeputusan = entry.tanggal_keputusan;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "diputuskan_oleh")) {
    data.diputuskanOleh = entry.diputuskan_oleh;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "status")) {
    data.status = entry.status;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "armada")) {
    data.armada = entry.armada;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "eta")) {
    data.eta = entry.eta;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "waktu_menunggu")) {
    data.waktuMenunggu = entry.waktu_menunggu ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "waktu_dalam_pengiriman")) {
    data.waktuDalamPengiriman = entry.waktu_dalam_pengiriman ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "waktu_selesai")) {
    data.waktuSelesai = entry.waktu_selesai ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(entry, "waktu_dibatalkan")) {
    data.waktuDibatalkan = entry.waktu_dibatalkan ?? null;
  }

  return data;
}

/**
 * Returns every live Keputusan row in the src/store.js snake_case shape.
 */
export async function getKeputusan() {
  const rows = await prisma.keputusan.findMany();
  return rows.map(toApi);
}

/**
 * Returns every RiwayatKeputusan (decision history) row in the
 * src/store.js snake_case shape.
 */
export async function getRiwayatKeputusan() {
  const rows = await prisma.riwayatKeputusan.findMany();
  return rows.map(toApi);
}

/**
 * Generates the next KPT-### id, replicating src/store.js's getNextId
 * exactly: read from RiwayatKeputusan (matches state.riwayatKeputusan),
 * find the max numeric suffix, add 1, zero-padded to 3 digits, skip
 * forward past any collision.
 */
async function getNextKeputusanId() {
  const rows = await prisma.riwayatKeputusan.findMany({ select: { id: true } });
  const existingIds = new Set(rows.map((row) => String(row.id)));

  let nextNumber =
    rows.reduce((maxValue, row) => {
      const numericId = Number(String(row.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  let candidate = `KPT-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `KPT-${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Creates a new Keputusan row. Generates a KPT-### id when entry.id is
 * absent, defaults status to "menunggu", sets the matching waktu_* field to
 * now, and writes to BOTH the Keputusan and RiwayatKeputusan tables inside
 * one transaction (mirrors src/store.js's addKeputusan dual-write and
 * seed.js's seedKeputusanAndRiwayat comment: "store.js seeds BOTH
 * state.keputusan and state.riwayatKeputusan").
 *
 * Closes LOGIC-03 for this mutation: after the dual-table create commits,
 * pushes a notification then records an activity-log entry — both inside
 * this same async function body, awaited in sequence, before returning.
 * (aktor, role) are supplied by the route layer from req.user; this
 * function never reads req.user itself.
 */
export async function addKeputusan(entry, aktor, role) {
  const id = entry.id ?? (await getNextKeputusanId());
  const status = entry.status ?? "menunggu";
  const waktuField = WAKTU_FIELD_BY_STATUS[status];

  const baseData = {
    ...toDb(entry),
    status,
    ...(waktuField ? { [waktuField]: new Date() } : {}),
  };

  // C-1: kurangi stok TBS secara atomik saat keputusan dibuat. Pengurangan
  // bersyarat (updateMany dengan guard stokTbs >= volume) memastikan dua
  // keputusan bersamaan tidak bisa sama-sama menghabiskan stok yang sama —
  // pola optimistic-lock yang sama dengan LOGIC-02. Seluruhnya dibungkus satu
  // interactive transaction bersama pembuatan keputusan+riwayat, sehingga stok
  // hanya berkurang bila keputusan benar-benar tersimpan (dan sebaliknya).
  const volume = Number(entry.volume_tbs) || 0;
  let saldoSebelum = 0;
  let saldoSesudah = 0;

  const created = await prisma.$transaction(async (tx) => {
    const pengurangan = await tx.stok.updateMany({
      where: { id: STOK_SINGLETON_ID, stokTbs: { gte: volume } },
      data: { stokTbs: { decrement: volume } },
    });

    if (pengurangan.count === 0) {
      const stokRow = await tx.stok.findUnique({ where: { id: STOK_SINGLETON_ID } });
      const tersedia = stokRow ? stokRow.stokTbs : 0;
      throw Object.assign(
        new Error(`Stok TBS tidak mencukupi. Tersedia ${tersedia} ton, dibutuhkan ${volume} ton.`),
        { statusCode: 400 }
      );
    }

    // C-2: baca saldo pasca-pengurangan di dalam transaksi agar nilai
    // sebelum/sesudah yang dicatat konsisten dengan penulisan yang barusan
    // terjadi (saldoSebelum direkonstruksi = saldoSesudah + volume).
    const stokRow = await tx.stok.findUnique({ where: { id: STOK_SINGLETON_ID } });
    saldoSesudah = stokRow ? stokRow.stokTbs : 0;
    saldoSebelum = saldoSesudah + volume;

    const createdRow = await tx.keputusan.create({ data: { id, ...baseData } });
    await tx.riwayatKeputusan.create({ data: { id, ...baseData } });
    return createdRow;
  });

  await tambahNotifikasi({
    judul: "Keputusan distribusi baru",
    pesan: `Keputusan distribusi baru tersedia untuk kota ${entry.kota_tujuan}.`,
    tipe: "info",
  });
  await catatAktivitas(aktor, role, `Menyimpan keputusan distribusi kota ${entry.kota_tujuan}`);
  // C-2: jejak audit pergerakan stok (keluar) akibat distribusi.
  await catatAktivitas(
    aktor,
    role,
    `Stok TBS berkurang ${volume} ton untuk distribusi ke ${entry.kota_tujuan} (saldo ${saldoSebelum} → ${saldoSesudah} ton)`
  );

  return toApi(created);
}

/**
 * Partially updates a Keputusan row — THE RACE-SAFE PATH (closes LOGIC-02).
 *
 * src/store.js's updateKeputusan is a check-then-act flow with zero
 * concurrency guard: it reads existing.status, decides whether the status
 * changed, then unconditionally overwrites the row. Two concurrent
 * approval requests for the same decision can both read the pre-change
 * status and both believe they are the one transitioning it.
 *
 * The fix: make the UPDATE itself the lock. Step 4 below is a single
 * atomic SQL `UPDATE ... WHERE id = ? AND status = ?` statement —
 * PostgreSQL guarantees only one of two concurrent identical statements
 * can match and update the row; the loser's result.count is 0. This is
 * the binding LOGIC-02 mechanism (optimistic locking via conditional
 * updateMany), not a unique constraint or a $transaction with row
 * locking — see 08-04-PLAN.md objective for the full rationale.
 *
 * SUBTLE CASE (fixed after live-HTTP testing surfaced it under real
 * concurrent load): when two concurrent requests target the SAME
 * destination status (e.g. both PUT { status: "dalam-pengiriman" } while
 * the row is "menunggu"), a naive `WHERE status: existing.status` guard is
 * insufficient. If request A commits first (menunggu -> dalam-pengiriman)
 * and request B's own read then observes the row AFTER A's commit, B's
 * `existing.status` is ALREADY "dalam-pengiriman" — the value B itself
 * intends to write. B's updateMany becomes a true no-op
 * (`WHERE status='dalam-pengiriman' SET status='dalam-pengiriman'`) that
 * still matches and reports count=1, silently treating a lost race as a
 * second success. The fix: a write only counts as a legitimate winning
 * transition when the read-time status actually differs from the target
 * status (statusBerubah). If it does not differ, the request is either a
 * true no-op update (no status key supplied) — allowed — or it is a
 * status-change request arriving after the transition already happened —
 * rejected as a 409 conflict, exactly as if it had lost the updateMany race.
 */
export async function updateKeputusan(id, updates, aktor, role) {
  // Step 1: read the current row ONCE.
  const existing = await prisma.keputusan.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error("Keputusan tidak ditemukan."), { statusCode: 404 });
  }

  const statusRequested = Object.prototype.hasOwnProperty.call(updates, "status");

  // Step 2: determine whether this update changes status (mirrors
  // src/store.js's exact condition).
  const statusBerubah = statusRequested && existing.status !== updates.status;

  // A status-change request whose target status already matches the
  // row's current status is NOT a legitimate transition to apply — it is
  // either a redundant no-op the caller should not treat as a fresh
  // success, or (the concurrent case above) a loser of the race that read
  // the post-commit state. Reject it as a conflict rather than silently
  // reporting success, so the route layer's 409 mapping is the one
  // observable outcome for "someone already made this exact change."
  if (statusRequested && !statusBerubah) {
    throw Object.assign(
      new Error("Status keputusan sudah diperbarui oleh proses lain. Muat ulang data dan coba lagi."),
      { statusCode: 409 }
    );
  }

  // Step 3: build the partial update payload, adding the matching waktu_*
  // timestamp only when the status is actually transitioning.
  const data = toDb(updates);
  if (statusBerubah) {
    const waktuField = WAKTU_FIELD_BY_STATUS[updates.status];
    if (waktuField) {
      data[waktuField] = new Date();
    }
  }

  // Step 4: THE LOCK-ACQUIRING WRITE. The `status: existing.status` guard
  // in the WHERE clause means this UPDATE only succeeds if the row's
  // status is STILL what we just read it as. If a concurrent request
  // already changed it, result.count is 0 — we lost the race.
  const result = await prisma.keputusan.updateMany({
    where: { id, status: existing.status },
    data,
  });

  // Step 5: the loser gets a 409 conflict. No automatic retry — surface
  // the conflict to the caller (route layer maps this to an HTTP 409).
  if (result.count === 0) {
    throw Object.assign(
      new Error("Status keputusan sudah diperbarui oleh proses lain. Muat ulang data dan coba lagi."),
      { statusCode: 409 }
    );
  }

  // Step 6: only the winner reaches here. RiwayatKeputusan has no
  // concurrent-writer race (only the live Keputusan row is contested), so
  // it is updated after the optimistic-lock write commits, staying
  // consistent with whichever request won. This does NOT need to be in
  // the same transaction as step 4 — step 4 alone is the atomicity
  // boundary; step 6 only ever runs for the confirmed winner.
  await prisma.riwayatKeputusan.update({ where: { id }, data });

  const updated = await prisma.keputusan.findUnique({ where: { id } });

  // Step 7 (LOGIC-03): side effects fire ONLY for the confirmed winner of
  // the optimistic lock (this line is unreachable for the 409 loser, which
  // already threw in Step 5), and ONLY when statusBerubah is true — mirrors
  // src/store.js's updateKeputusan, which guards its pushNotifikasi/
  // recordActivity calls behind the same statusBerubah check. This ordering
  // is the binding LOGIC-02/LOGIC-03 interaction: side effects happen
  // strictly after the lock-acquiring write is confirmed to have won, never
  // before, and never for the request that lost the race.
  if (statusBerubah) {
    const labelStatus = statusLabelMap[updates.status] ?? updates.status;

    await tambahNotifikasi({
      judul: "Status distribusi diperbarui",
      pesan: `Status distribusi ke ${existing.kotaTujuanNama} telah diperbarui menjadi ${labelStatus}.`,
      tipe: "success",
    });
    await catatAktivitas(
      aktor,
      role,
      `Memperbarui status distribusi kota ${existing.kotaTujuanNama} menjadi ${labelStatus}`
    );
  }

  // Step 8: return existing.status/statusBerubah so the route layer can
  // inspect the outcome without re-reading the row.
  return { updated: toApi(updated), statusBerubah, existingStatus: existing.status };
}

/**
 * Cancels a decision: marks the RiwayatKeputusan row "dibatalkan" with
 * waktuDibatalkan set, then deletes the live Keputusan row (mirrors
 * src/store.js's removeKeputusan — NOT a soft delete on the live table,
 * only on the historical one).
 */
export async function removeKeputusan(id, aktor, role) {
  const existing = await prisma.keputusan.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error("Keputusan tidak ditemukan."), { statusCode: 404 });
  }

  // C-1: batal distribusi mengembalikan volume ke stok TBS (simetri dengan
  // pengurangan di addKeputusan), agar pembatalan tidak menyisakan stok yang
  // berkurang permanen. Interactive transaction dipakai (bukan array) supaya
  // saldo pasca-increment bisa dibaca untuk jejak audit C-2.
  const volumeDikembalikan = Number(existing.volumeTbs) || 0;
  let saldoSebelum = 0;
  let saldoSesudah = 0;

  await prisma.$transaction(async (tx) => {
    await tx.riwayatKeputusan.update({
      where: { id },
      data: { status: "dibatalkan", waktuDibatalkan: new Date() },
    });
    await tx.keputusan.delete({ where: { id } });
    const stokRow = await tx.stok.update({
      where: { id: STOK_SINGLETON_ID },
      data: { stokTbs: { increment: volumeDikembalikan } },
    });
    saldoSesudah = stokRow.stokTbs;
    saldoSebelum = saldoSesudah - volumeDikembalikan;
  });

  await catatAktivitas(aktor, role, `Membatalkan keputusan distribusi kota ${existing?.kotaTujuanNama ?? id}`);
  // C-2: jejak audit pergerakan stok (masuk) akibat pembatalan distribusi.
  await catatAktivitas(
    aktor,
    role,
    `Stok TBS bertambah ${volumeDikembalikan} ton karena pembatalan distribusi ke ${existing.kotaTujuanNama} (saldo ${saldoSebelum} → ${saldoSesudah} ton)`
  );

  return toApi(existing);
}

/**
 * Restores a previously cancelled/removed decision: re-creates the live
 * Keputusan row and overwrites the matching RiwayatKeputusan row with the
 * restored item (mirrors src/store.js's restoreKeputusan exactly).
 */
export async function restoreKeputusan(item, aktor, role) {
  const data = toDb(item);

  // C-1: mengembalikan (undo) keputusan mengurangi stok lagi, dengan guard
  // kecukupan yang sama seperti addKeputusan — bila stok sudah terpakai proses
  // lain sejak pembatalan, undo ditolak alih-alih membuat stok negatif.
  const volume = Number(item.volume_tbs) || 0;
  let saldoSebelum = 0;
  let saldoSesudah = 0;

  const created = await prisma.$transaction(async (tx) => {
    const pengurangan = await tx.stok.updateMany({
      where: { id: STOK_SINGLETON_ID, stokTbs: { gte: volume } },
      data: { stokTbs: { decrement: volume } },
    });

    if (pengurangan.count === 0) {
      const stokRow = await tx.stok.findUnique({ where: { id: STOK_SINGLETON_ID } });
      const tersedia = stokRow ? stokRow.stokTbs : 0;
      throw Object.assign(
        new Error(
          `Stok TBS tidak mencukupi untuk mengembalikan keputusan. Tersedia ${tersedia} ton, dibutuhkan ${volume} ton.`
        ),
        { statusCode: 400 }
      );
    }

    // C-2: saldo pasca-pengurangan untuk jejak audit (saldoSebelum = saldoSesudah + volume).
    const stokRow = await tx.stok.findUnique({ where: { id: STOK_SINGLETON_ID } });
    saldoSesudah = stokRow ? stokRow.stokTbs : 0;
    saldoSebelum = saldoSesudah + volume;

    const createdRow = await tx.keputusan.create({ data: { id: item.id, ...data } });
    await tx.riwayatKeputusan.update({ where: { id: item.id }, data });
    return createdRow;
  });

  await catatAktivitas(aktor, role, `Mengembalikan keputusan distribusi kota ${item.kota_tujuan}`);
  // C-2: jejak audit pergerakan stok (keluar) akibat undo/restore keputusan.
  await catatAktivitas(
    aktor,
    role,
    `Stok TBS berkurang ${volume} ton karena pengembalian distribusi ke ${item.kota_tujuan} (saldo ${saldoSebelum} → ${saldoSesudah} ton)`
  );

  return toApi(created);
}
