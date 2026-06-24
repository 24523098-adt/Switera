import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BCRYPT_HASH_PREFIX = /^\$2[aby]\$/;

async function main() {
  let exitCode = 0;

  const [akun, kota, permintaan, keputusan, riwayatKeputusan, notifikasi, activityLog] =
    await Promise.all([
      prisma.akun.count(),
      prisma.kota.count(),
      prisma.permintaan.count(),
      prisma.keputusan.count(),
      prisma.riwayatKeputusan.count(),
      prisma.notifikasi.count(),
      prisma.activityLog.count(),
    ]);

  console.log(
    `COUNTS akun=${akun} kota=${kota} permintaan=${permintaan} keputusan=${keputusan} riwayatKeputusan=${riwayatKeputusan} notifikasi=${notifikasi} activityLog=${activityLog}`
  );

  const expected = {
    akun: 3,
    kota: 8,
    permintaan: 15,
    keputusan: 3,
    riwayatKeputusan: 3,
    notifikasi: 5,
    activityLog: 0,
  };
  const actual = { akun, kota, permintaan, keputusan, riwayatKeputusan, notifikasi, activityLog };

  for (const [key, expectedCount] of Object.entries(expected)) {
    if (actual[key] !== expectedCount) {
      exitCode = 1;
    }
  }

  const akunRows = await prisma.akun.findMany();
  let bcryptOk = true;
  let offendingUsername = null;
  for (const row of akunRows) {
    if (!BCRYPT_HASH_PREFIX.test(row.password)) {
      bcryptOk = false;
      offendingUsername = row.username;
      break;
    }
  }

  if (bcryptOk) {
    console.log("BCRYPT_OK true");
  } else {
    console.log(`BCRYPT_OK false ${offendingUsername}`);
    exitCode = 1;
  }

  process.exitCode = exitCode;
}

main()
  .catch((error) => {
    console.error("Verify script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
