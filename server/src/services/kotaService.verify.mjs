import prisma from "../db/prismaClient.js";
import { getDaftarKota, getKotaReferenceCounts, updateKota, hapusKota } from "./kotaService.js";

let exitCode = 0;

function report(label, ok, details) {
  console.log(`${label} ${ok}${details ? ` ${details}` : ""}`);
  if (!ok) exitCode = 1;
}

async function checkFkJoin() {
  const pekanbaru = await prisma.kota.findUnique({
    where: { nama: "Pekanbaru" },
    include: { permintaan: true, keputusan: true, riwayatKeputusan: true },
  });

  const permintaanLen = pekanbaru?.permintaan?.length ?? 0;
  const keputusanLen = pekanbaru?.keputusan?.length ?? 0;

  const ok = permintaanLen === 2 && keputusanLen === 1;
  report(
    "FK_JOIN_OK",
    ok,
    ok ? "" : `(actual permintaan=${permintaanLen} keputusan=${keputusanLen}, expected permintaan=2 keputusan=1)`
  );
}

async function checkBlockDelete() {
  let threw = false;
  try {
    await hapusKota("Pekanbaru", "verify-script", "Admin");
  } catch {
    threw = true;
  }

  const daftar = await getDaftarKota();
  const stillPresent = daftar.some((kota) => kota.nama === "Pekanbaru");

  const ok = threw && stillPresent;
  report(
    "BLOCK_DELETE_OK",
    ok,
    ok ? "" : `(threw=${threw}, stillPresent=${stillPresent})`
  );
}

async function checkCascadeRename() {
  let ok = true;
  const details = [];

  await updateKota("Padang", { nama: "Padang Baru", kapasitas: 170 }, "verify-script", "Admin");

  const oldNamePermintaan = await prisma.permintaan.findMany({ where: { kotaNama: "Padang" } });
  const newNamePermintaan = await prisma.permintaan.findMany({ where: { kotaNama: "Padang Baru" } });
  if (oldNamePermintaan.length !== 0 || newNamePermintaan.length !== 1) {
    ok = false;
    details.push(
      `permintaan old=${oldNamePermintaan.length} new=${newNamePermintaan.length} (expected old=0 new=1)`
    );
  }

  const oldNameKeputusan = await prisma.keputusan.findMany({ where: { kotaTujuanNama: "Padang" } });
  const newNameKeputusan = await prisma.keputusan.findMany({ where: { kotaTujuanNama: "Padang Baru" } });
  if (oldNameKeputusan.length !== 0 || newNameKeputusan.length !== 1) {
    ok = false;
    details.push(
      `keputusan old=${oldNameKeputusan.length} new=${newNameKeputusan.length} (expected old=0 new=1)`
    );
  }

  const oldNameRiwayat = await prisma.riwayatKeputusan.findMany({ where: { kotaTujuanNama: "Padang" } });
  const newNameRiwayat = await prisma.riwayatKeputusan.findMany({ where: { kotaTujuanNama: "Padang Baru" } });
  if (oldNameRiwayat.length !== 0 || newNameRiwayat.length !== 1) {
    ok = false;
    details.push(
      `riwayatKeputusan old=${oldNameRiwayat.length} new=${newNameRiwayat.length} (expected old=0 new=1)`
    );
  }

  report("CASCADE_RENAME_OK", ok, ok ? "" : `(${details.join("; ")})`);

  // Revert the rename so the script is safely re-runnable without manual DB resets.
  await updateKota("Padang Baru", { nama: "Padang", kapasitas: 170 }, "verify-script", "Admin");
}

async function main() {
  try {
    await checkFkJoin();
    await checkBlockDelete();
    await checkCascadeRename();
  } finally {
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
