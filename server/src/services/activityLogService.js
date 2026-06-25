import prisma from "../db/prismaClient.js";

/**
 * Generates the next LOG-### id, replicating src/store.js's getNextId
 * exactly: find the max numeric suffix among existing ids, add 1, zero-padded
 * to 3 digits, skip forward past any collision. Written as a small local
 * helper, matching notifikasiService's getNextNotifikasiId pattern.
 */
async function getNextActivityLogId() {
  const rows = await prisma.activityLog.findMany({ select: { id: true } });
  const existingIds = new Set(rows.map((row) => String(row.id)));

  let nextNumber =
    rows.reduce((maxValue, row) => {
      const numericId = Number(String(row.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  let candidate = `LOG-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `LOG-${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Returns every ActivityLog row, newest first. Mirrors src/store.js's
 * getActivityLog() shape exactly: { id, aktor, role, aksi, waktu }.
 */
export async function getActivityLog() {
  return prisma.activityLog.findMany({ orderBy: { waktu: "desc" } });
}

/**
 * Creates a new activity-log row. Mirrors src/store.js's pushActivity +
 * catatAktivitas combined: id via getNextActivityLogId(), waktu defaults to
 * now.
 *
 * This is the function permintaanService/keputusanService/kotaService/
 * stokService all call internally as a side effect of their own mutations
 * (LOGIC-03) — it is never reachable directly from a client; no POST route
 * exists for activity-log (see activityLogRoutes.js). Server-side mutations
 * have no session state (no state.userAktif), so the caller (the route
 * layer, via req.user) supplies aktor/role explicitly as plain string
 * arguments — this function never reads req.user itself, keeping the
 * service layer framework-agnostic.
 */
export async function catatAktivitas(aktor, role, aksi) {
  const id = await getNextActivityLogId();

  return prisma.activityLog.create({
    data: { id, aktor, role, aksi, waktu: new Date() },
  });
}
