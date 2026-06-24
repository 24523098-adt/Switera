import "dotenv/config";
import { app } from "../index.js";
import prisma from "../db/prismaClient.js";

let exitCode = 0;

function report(label, ok, details) {
  console.log(`${label} ${ok}${details ? ` ${details}` : ""}`);
  if (!ok) exitCode = 1;
}

async function login(baseUrl, username, password) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  return { status: res.status, token: body.token };
}

async function main() {
  // Start the app on an ephemeral port so this script never collides with a
  // dev server already listening on PORT, and is safely re-runnable.
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const TEST_CITY = "__KotaRoutesVerifyTemp__";

  try {
    const admin = await login(baseUrl, "admin", "admin123");
    const logistik = await login(baseUrl, "logistik", "logistik123");

    report(
      "LOGIN_SETUP_OK",
      admin.status === 200 && Boolean(admin.token) && logistik.status === 200 && Boolean(logistik.token),
      `(admin status=${admin.status}, logistik status=${logistik.status})`
    );

    // (1) GET /kota with admin token -> 200 array
    const listRes = await fetch(`${baseUrl}/kota`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const listBody = await listRes.json();
    const listOk = listRes.status === 200 && Array.isArray(listBody);
    report("GET_KOTA_OK", listOk, listOk ? "" : `(status=${listRes.status})`);

    // (2) POST /kota with logistik token -> 403
    const forbiddenRes = await fetch(`${baseUrl}/kota`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${logistik.token}` },
      body: JSON.stringify({ nama: "ShouldNotBeCreated", kapasitas: 10 }),
    });
    const forbiddenOk = forbiddenRes.status === 403;
    report("KOTA_RBAC_DENY_OK", forbiddenOk, forbiddenOk ? "" : `(status=${forbiddenRes.status})`);

    // (3) POST /kota with admin token + empty nama -> 400 with fields.nama
    const badBodyRes = await fetch(`${baseUrl}/kota`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({ nama: "", kapasitas: -1 }),
    });
    const badBody = await badBodyRes.json();
    const badBodyOk = badBodyRes.status === 400 && Boolean(badBody?.fields?.nama);
    report(
      "KOTA_VALIDATION_OK",
      badBodyOk,
      badBodyOk ? "" : `(status=${badBodyRes.status}, fields=${JSON.stringify(badBody?.fields)})`
    );

    // (4) POST /kota with admin token + valid new city -> 201, then DELETE -> 200 (self-cleaning)
    // Best-effort pre-clean in case a prior failed run left the temp city behind.
    await fetch(`${baseUrl}/kota/${encodeURIComponent(TEST_CITY)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${admin.token}` },
    });

    const createRes = await fetch(`${baseUrl}/kota`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({ nama: TEST_CITY, kapasitas: 50 }),
    });
    const createBody = await createRes.json();
    const createOk =
      createRes.status === 201 && Array.isArray(createBody) && createBody.some((k) => k.nama === TEST_CITY);
    report("KOTA_CREATE_OK", createOk, createOk ? "" : `(status=${createRes.status})`);

    const deleteRes = await fetch(`${baseUrl}/kota/${encodeURIComponent(TEST_CITY)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const deleteBody = await deleteRes.json();
    const deleteOk =
      deleteRes.status === 200 && Array.isArray(deleteBody) && !deleteBody.some((k) => k.nama === TEST_CITY);
    report("KOTA_DELETE_OK", deleteOk, deleteOk ? "" : `(status=${deleteRes.status})`);

    report("KOTA_ROUTES_OK", listOk && forbiddenOk && badBodyOk && createOk && deleteOk);

    // (5) PUT /stok-tbs with logistik token -> 403
    const stokForbiddenRes = await fetch(`${baseUrl}/stok-tbs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${logistik.token}` },
      body: JSON.stringify({ stokTbs: 999 }),
    });
    const stokForbiddenOk = stokForbiddenRes.status === 403;
    report("STOK_RBAC_DENY_OK", stokForbiddenOk, stokForbiddenOk ? "" : `(status=${stokForbiddenRes.status})`);

    // (6) PUT /stok-tbs with admin token + valid value -> 200, then restore prior value
    const priorRes = await fetch(`${baseUrl}/stok-tbs`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const priorBody = await priorRes.json();
    const priorValue = priorBody.stokTbs;

    const updateRes = await fetch(`${baseUrl}/stok-tbs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({ stokTbs: 777 }),
    });
    const updateBody = await updateRes.json();
    const updateOk = updateRes.status === 200 && updateBody.stokTbs === 777;
    report("STOK_UPDATE_OK", updateOk, updateOk ? "" : `(status=${updateRes.status}, body=${JSON.stringify(updateBody)})`);

    const restoreRes = await fetch(`${baseUrl}/stok-tbs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({ stokTbs: priorValue }),
    });
    const restoreBody = await restoreRes.json();
    const restoreOk = restoreRes.status === 200 && restoreBody.stokTbs === priorValue;
    report("STOK_RESTORE_OK", restoreOk, restoreOk ? "" : `(status=${restoreRes.status})`);

    report("STOK_ROUTES_OK", stokForbiddenOk && updateOk && restoreOk);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
