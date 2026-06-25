import "dotenv/config";
import { getRekomendasiDistribusi } from "./distribusiService.js";
import { getDaftarKota, updateKota } from "./kotaService.js";
import prisma from "../db/prismaClient.js";

let exitCode = 0;

function report(label, ok, details) {
  console.log(`${label} ${ok}${details ? ` ${details}` : ""}`);
  if (!ok) exitCode = 1;
}

const TARGET_CITY = "Pekanbaru";

async function main() {
  let originalKapasitas;

  try {
    // Capture the city's current kapasitas so this script can self-clean
    // regardless of what the seed currently holds (idempotent re-run safe).
    const daftarKotaBefore = await getDaftarKota();
    const kotaBefore = daftarKotaBefore.find((kota) => kota.nama === TARGET_CITY);

    if (!kotaBefore) {
      report("DISTRIBUSI_FRESH_OK", false, `(seeded city "${TARGET_CITY}" not found)`);
      process.exitCode = 1;
      return;
    }

    originalKapasitas = kotaBefore.kapasitas;

    // (1) First call — baseline read.
    const firstCall = await getRekomendasiDistribusi();
    const firstSnapshot = firstCall.find((item) => item.kota === TARGET_CITY);

    report(
      "FIRST_CALL_OK",
      Boolean(firstSnapshot),
      firstSnapshot ? `(kapasitas=${firstSnapshot.kapasitas}, skor=${firstSnapshot.skor})` : "(city missing from ranking)"
    );

    // (2) Mutate the city's kapasitas directly via kotaService, to a
    // deliberately different value (double it, capped at a sane bound so
    // the score change stays visible relative to the other seeded cities).
    const mutatedKapasitas = originalKapasitas === 999 ? 111 : 999;
    await updateKota(TARGET_CITY, { nama: TARGET_CITY, kapasitas: mutatedKapasitas });

    // (3) Second call — must reflect the live DB value, not a cached one.
    const secondCall = await getRekomendasiDistribusi();
    const secondSnapshot = secondCall.find((item) => item.kota === TARGET_CITY);

    const reflectsChange = Boolean(secondSnapshot) && secondSnapshot.kapasitas === mutatedKapasitas;

    report(
      "DISTRIBUSI_FRESH_OK",
      reflectsChange,
      reflectsChange
        ? `(kapasitas changed ${firstSnapshot?.kapasitas} -> ${secondSnapshot.kapasitas}, skor ${firstSnapshot?.skor} -> ${secondSnapshot.skor})`
        : `(FAIL — first=${JSON.stringify(firstSnapshot)}, second=${JSON.stringify(secondSnapshot)})`
    );
  } finally {
    // (4) Self-clean — always revert, even if an assertion above failed.
    if (originalKapasitas !== undefined) {
      await updateKota(TARGET_CITY, { nama: TARGET_CITY, kapasitas: originalKapasitas });
      const daftarKotaAfter = await getDaftarKota();
      const kotaAfter = daftarKotaAfter.find((kota) => kota.nama === TARGET_CITY);
      const restored = kotaAfter?.kapasitas === originalKapasitas;
      report("CLEANUP_OK", restored, restored ? "" : `(expected ${originalKapasitas}, got ${kotaAfter?.kapasitas})`);
    }

    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
