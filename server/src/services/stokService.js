import prisma from "../db/prismaClient.js";
import { catatAktivitas } from "./activityLogService.js";

const SINGLETON_ID = "singleton";

/**
 * Returns the current TBS stock value from the Stok singleton row.
 * Mirrors src/store.js's getStokTbs() return type (plain number). If the
 * singleton row is missing (should not happen after seeding), defensively
 * returns 0 instead of throwing.
 */
export async function getStokTbs() {
  const row = await prisma.stok.findUnique({ where: { id: SINGLETON_ID } });
  return row ? row.stokTbs : 0;
}

/**
 * Sets the TBS stock value, upserting the Stok singleton row. Coerces the
 * input the same way src/store.js's setStokTbs does (Number(value) || 0),
 * so non-numeric or falsy input never corrupts the stored value. Returns
 * the new number.
 *
 * Closes LOGIC-03 for this mutation: after the upsert writes the coerced
 * numericValue, records an activity-log entry using that SAME coerced
 * value (not the raw input), inside this same async function body, before
 * returning (no notifikasi — src/store.js never fires one from
 * setStokTbs).
 */
export async function setStokTbs(value, aktor, role) {
  const numericValue = Number(value) || 0;

  await prisma.stok.upsert({
    where: { id: SINGLETON_ID },
    update: { stokTbs: numericValue },
    create: { id: SINGLETON_ID, stokTbs: numericValue },
  });

  await catatAktivitas(aktor, role, `Memperbarui stok TBS tersedia menjadi ${numericValue} ton`);

  return numericValue;
}
