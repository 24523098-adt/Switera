import prisma from "../db/prismaClient.js";

/**
 * Generates the next NTF-### id, replicating src/store.js's getNextId
 * exactly: find the max numeric suffix among existing ids, add 1, zero-padded
 * to 3 digits, skip forward past any collision. Written as a small local
 * helper (not shared with permintaanService/keputusanService's equivalents)
 * since notifikasiService has no service-layer dependency on either of them.
 */
async function getNextNotifikasiId() {
  const rows = await prisma.notifikasi.findMany({ select: { id: true } });
  const existingIds = new Set(rows.map((row) => String(row.id)));

  let nextNumber =
    rows.reduce((maxValue, row) => {
      const numericId = Number(String(row.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  let candidate = `NTF-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `NTF-${String(nextNumber).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Returns every Notifikasi row, newest first. Mirrors src/store.js's
 * getNotifikasi() shape exactly: { id, judul, pesan, tipe, dibaca, waktu }.
 */
export async function getNotifikasi() {
  return prisma.notifikasi.findMany({ orderBy: { waktu: "desc" } });
}

/**
 * Creates a new notification row. Mirrors src/store.js's pushNotifikasi +
 * tambahNotifikasi combined: id defaults via getNextNotifikasiId(), tipe
 * defaults to "info", dibaca defaults to false, waktu defaults to now.
 *
 * This is the function permintaanService/keputusanService call internally
 * as a side effect of their own mutations (LOGIC-03) — it is never reachable
 * directly from a client POST; notifikasiRoutes.js exposes no create route.
 */
export async function tambahNotifikasi({ judul, pesan, tipe, id }) {
  const notifId = id ?? (await getNextNotifikasiId());

  return prisma.notifikasi.create({
    data: {
      id: notifId,
      judul,
      pesan,
      tipe: tipe ?? "info",
      dibaca: false,
      waktu: new Date(),
    },
  });
}

/**
 * Mengecek apakah sudah ada notifikasi dengan judul sama dalam N jam terakhir.
 * Dipakai sinkronisasi notifikasi cerdas MIS agar tidak membuat duplikat setiap
 * kali kondisi yang sama masih berlaku (dedupe).
 */
export async function adaNotifikasiTerbaru(judul, dalamJam = 24) {
  const batas = new Date(Date.now() - dalamJam * 60 * 60 * 1000);
  const row = await prisma.notifikasi.findFirst({ where: { judul, waktu: { gte: batas } } });
  return Boolean(row);
}

/**
 * Marks a single notification as read. Mirrors src/store.js's tandaiDibaca.
 */
export async function tandaiDibaca(id) {
  return prisma.notifikasi.update({
    where: { id },
    data: { dibaca: true },
  });
}

/**
 * Marks every notification as read. Mirrors src/store.js's
 * tandaiSemuaDibaca, returning the refreshed list.
 */
export async function tandaiSemuaDibaca() {
  await prisma.notifikasi.updateMany({
    where: {},
    data: { dibaca: true },
  });

  return getNotifikasi();
}
