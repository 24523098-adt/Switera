import "dotenv/config";
import prisma from "../db/prismaClient.js";
import {
  addKeputusan,
  updateKeputusan,
  removeKeputusan,
} from "./keputusanService.js";

let exitCode = 0;

function report(label, ok, details) {
  console.log(`${label} ${ok}${details ? ` ${details}` : ""}`);
  if (!ok) exitCode = 1;
}

async function main() {
  let throwawayId = null;

  try {
    // Create one throwaway keputusan row via addKeputusan.
    const created = await addKeputusan(
      {
        kota_tujuan: "Pekanbaru",
        volume_tbs: 10,
        tanggal_keputusan: "2026-06-25",
        diputuskan_oleh: "__KeputusanRaceVerifyTemp__",
        status: "menunggu",
      },
      "verify-script",
      "Admin"
    );
    throwawayId = created.id;

    const createOk =
      typeof created.id === "string" &&
      created.id.startsWith("KPT-") &&
      created.status === "menunggu" &&
      Boolean(created.waktu_menunggu);
    report(
      "KEPUTUSAN_CREATE_OK",
      createOk,
      createOk ? `(id=${created.id})` : `(body=${JSON.stringify(created)})`
    );

    // Confirm the dual-write landed in both tables.
    const [liveRow, riwayatRow] = await Promise.all([
      prisma.keputusan.findUnique({ where: { id: throwawayId } }),
      prisma.riwayatKeputusan.findUnique({ where: { id: throwawayId } }),
    ]);
    const dualWriteOk = Boolean(liveRow) && Boolean(riwayatRow);
    report("KEPUTUSAN_DUAL_WRITE_OK", dualWriteOk);

    // Fire TWO concurrent updateKeputusan calls targeting the same id and
    // the same target status — the LOGIC-02 race condition this plan closes.
    const results = await Promise.allSettled([
      updateKeputusan(throwawayId, { status: "dalam-pengiriman" }, "verify-script", "Admin"),
      updateKeputusan(throwawayId, { status: "dalam-pengiriman" }, "verify-script", "Admin"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    const exactlyOneEach = fulfilled.length === 1 && rejected.length === 1;
    report(
      "KEPUTUSAN_RACE_COUNT_OK",
      exactlyOneEach,
      `(fulfilled=${fulfilled.length}, rejected=${rejected.length})`
    );

    const rejectedError = rejected[0]?.reason;
    const rejectedMessageOk =
      exactlyOneEach &&
      typeof rejectedError?.message === "string" &&
      rejectedError.message.includes("sudah diperbarui") &&
      rejectedError.statusCode === 409;
    report(
      "KEPUTUSAN_RACE_REJECT_SHAPE_OK",
      rejectedMessageOk,
      rejectedMessageOk
        ? ""
        : `(message=${JSON.stringify(rejectedError?.message)}, statusCode=${rejectedError?.statusCode})`
    );

    const winnerValue = fulfilled[0]?.value;
    const winnerShapeOk =
      exactlyOneEach &&
      winnerValue?.statusBerubah === true &&
      winnerValue?.existingStatus === "menunggu" &&
      winnerValue?.updated?.status === "dalam-pengiriman" &&
      Boolean(winnerValue?.updated?.waktu_dalam_pengiriman);
    report(
      "KEPUTUSAN_RACE_WINNER_SHAPE_OK",
      winnerShapeOk,
      winnerShapeOk ? "" : `(value=${JSON.stringify(winnerValue)})`
    );

    // Confirm RiwayatKeputusan was updated to match the winner (only after
    // the optimistic-lock write committed).
    const riwayatAfter = await prisma.riwayatKeputusan.findUnique({ where: { id: throwawayId } });
    const riwayatConsistentOk = riwayatAfter?.status === "dalam-pengiriman";
    report("KEPUTUSAN_RIWAYAT_CONSISTENT_OK", riwayatConsistentOk);

    report(
      "KEPUTUSAN_RACE_OK",
      createOk &&
        dualWriteOk &&
        exactlyOneEach &&
        rejectedMessageOk &&
        winnerShapeOk &&
        riwayatConsistentOk
    );
  } finally {
    // Self-clean: delete the throwaway row via removeKeputusan regardless
    // of outcome, so this script is idempotent/re-runnable.
    if (throwawayId) {
      try {
        await removeKeputusan(throwawayId, "verify-script", "Admin");
      } catch {
        // Best-effort cleanup — ignore errors here (e.g. row already gone).
      }
    }
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
