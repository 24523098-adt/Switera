import prisma from "../db/prismaClient.js";
import { verifyLogin, registerAkun } from "../services/akunService.js";

let exitCode = 0;

function report(label, ok, details) {
  console.log(`${label} ${ok}${details ? ` ${details}` : ""}`);
  if (!ok) exitCode = 1;
}

const THROWAWAY_USERNAME = "verify_throwaway_user";

async function checkLogin() {
  const correct = await verifyLogin("admin", "admin123");
  const wrong = await verifyLogin("admin", "wrong");

  const ok = Boolean(correct) && !correct.password && wrong === null;
  report(
    "LOGIN_OK",
    ok,
    ok ? "" : `(correct=${JSON.stringify(correct)}, wrong=${JSON.stringify(wrong)})`
  );
}

async function checkRegisterHashAndDup() {
  // Self-cleaning: remove any leftover throwaway row from a previous failed run.
  await prisma.akun.deleteMany({ where: { username: THROWAWAY_USERNAME } });

  const created = await registerAkun(
    { nama: "Verify Throwaway", username: THROWAWAY_USERNAME, role: "Admin" },
    "throwaway-password"
  );

  const row = await prisma.akun.findUnique({ where: { username: THROWAWAY_USERNAME } });
  const hashOk = Boolean(row) && typeof row.password === "string" && row.password.startsWith("$2");
  report(
    "REGISTER_HASH_OK",
    hashOk && !created.password,
    hashOk ? "" : `(stored password=${row?.password})`
  );

  let dupThrew = false;
  try {
    await registerAkun({ nama: "Dup Throwaway", username: THROWAWAY_USERNAME, role: "Admin" }, "x");
  } catch (error) {
    dupThrew = error.message === "Username sudah digunakan.";
  }
  report("DUP_REJECT_OK", dupThrew, dupThrew ? "" : "(duplicate register did not throw expected error)");

  // Self-clean so the script is safely re-runnable.
  await prisma.akun.deleteMany({ where: { username: THROWAWAY_USERNAME } });
}

async function main() {
  try {
    await checkLogin();
    await checkRegisterHashAndDup();
  } finally {
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
