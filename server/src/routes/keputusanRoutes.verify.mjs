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

  const TEST_KOTA = "Pekanbaru";
  const TEST_TANGGAL = "2026-06-25";

  let createdId = null;

  try {
    const admin = await login(baseUrl, "admin", "admin123");
    const manajer = await login(baseUrl, "manajer", "manajer123");
    const logistik = await login(baseUrl, "logistik", "logistik123");

    report(
      "LOGIN_SETUP_OK",
      admin.status === 200 &&
        Boolean(admin.token) &&
        manajer.status === 200 &&
        Boolean(manajer.token) &&
        logistik.status === 200 &&
        Boolean(logistik.token),
      `(admin=${admin.status}, manajer=${manajer.status}, logistik=${logistik.status})`
    );

    // (1) GET /keputusan with any authenticated token -> 200 array
    const listRes = await fetch(`${baseUrl}/keputusan`, {
      headers: { Authorization: `Bearer ${logistik.token}` },
    });
    const listBody = await listRes.json();
    const listOk = listRes.status === 200 && Array.isArray(listBody);
    report("GET_KEPUTUSAN_OK", listOk, listOk ? "" : `(status=${listRes.status})`);

    // GET /riwayat-keputusan with any authenticated token -> 200 array
    const riwayatRes = await fetch(`${baseUrl}/riwayat-keputusan`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const riwayatBody = await riwayatRes.json();
    const riwayatOk = riwayatRes.status === 200 && Array.isArray(riwayatBody);
    report("GET_RIWAYAT_KEPUTUSAN_OK", riwayatOk, riwayatOk ? "" : `(status=${riwayatRes.status})`);

    // (2) POST /keputusan with logistik token -> 403
    const forbiddenRes = await fetch(`${baseUrl}/keputusan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${logistik.token}` },
      body: JSON.stringify({
        kota_tujuan: TEST_KOTA,
        volume_tbs: 10,
        tanggal_keputusan: TEST_TANGGAL,
        diputuskan_oleh: "logistik",
      }),
    });
    const forbiddenOk = forbiddenRes.status === 403;
    report("KEPUTUSAN_POST_RBAC_DENY_OK", forbiddenOk, forbiddenOk ? "" : `(status=${forbiddenRes.status})`);

    // (3) POST with manajer token + volume_tbs: -1 -> 400 with fields.volume_tbs
    const badBodyRes = await fetch(`${baseUrl}/keputusan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${manajer.token}` },
      body: JSON.stringify({
        kota_tujuan: TEST_KOTA,
        volume_tbs: -1,
        tanggal_keputusan: TEST_TANGGAL,
        diputuskan_oleh: "manajer",
      }),
    });
    const badBody = await badBodyRes.json();
    const badBodyOk = badBodyRes.status === 400 && Boolean(badBody?.fields?.volume_tbs);
    report(
      "KEPUTUSAN_VALIDATION_OK",
      badBodyOk,
      badBodyOk ? "" : `(status=${badBodyRes.status}, fields=${JSON.stringify(badBody?.fields)})`
    );

    // (4) POST with manajer token valid body -> 201, capture id
    const createRes = await fetch(`${baseUrl}/keputusan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${manajer.token}` },
      body: JSON.stringify({
        kota_tujuan: TEST_KOTA,
        volume_tbs: 25,
        tanggal_keputusan: TEST_TANGGAL,
        diputuskan_oleh: "__KeputusanRoutesVerifyTemp__",
      }),
    });
    const createBody = await createRes.json();
    const createOk =
      createRes.status === 201 &&
      createBody.kota_tujuan === TEST_KOTA &&
      createBody.status === "menunggu" &&
      typeof createBody.id === "string" &&
      createBody.id.startsWith("KPT-");
    report(
      "KEPUTUSAN_CREATE_OK",
      createOk,
      createOk ? `(id=${createBody.id})` : `(status=${createRes.status}, body=${JSON.stringify(createBody)})`
    );
    createdId = createBody.id;

    // (5) THE concurrent-request test required by LOGIC-02: fire TWO
    // concurrent PUT /keputusan/:id { status: "dalam-pengiriman" } requests
    // with logistik token via Promise.all -> exactly one 200, one 409.
    const [putA, putB] = await Promise.all([
      fetch(`${baseUrl}/keputusan/${encodeURIComponent(createdId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${logistik.token}` },
        body: JSON.stringify({ status: "dalam-pengiriman" }),
      }),
      fetch(`${baseUrl}/keputusan/${encodeURIComponent(createdId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${logistik.token}` },
        body: JSON.stringify({ status: "dalam-pengiriman" }),
      }),
    ]);
    const statuses = [putA.status, putB.status];
    const count200 = statuses.filter((s) => s === 200).length;
    const count409 = statuses.filter((s) => s === 409).length;
    const raceOk = count200 === 1 && count409 === 1;
    report(
      "KEPUTUSAN_PUT_RACE_OK",
      raceOk,
      `(statuses=${JSON.stringify(statuses)}, count200=${count200}, count409=${count409})`
    );

    // PUT with manajer token -> 403 is NOT expected (manajer is allowed);
    // confirm PUT with a non-allowed... actually all three writer roles are
    // allowed on PUT per the plan's RBAC rationale, so no PUT-deny case
    // exists for this route. Instead confirm the 409 body carries the
    // Indonesian conflict message.
    const conflictRes = putA.status === 409 ? putA : putB;
    const conflictBody = await conflictRes.json();
    const conflictMessageOk =
      typeof conflictBody?.error === "string" && conflictBody.error.includes("sudah diperbarui");
    report(
      "KEPUTUSAN_PUT_CONFLICT_MESSAGE_OK",
      conflictMessageOk,
      conflictMessageOk ? "" : `(body=${JSON.stringify(conflictBody)})`
    );

    // POST /:id/restore and DELETE require Admin/Manajer Distribusi only —
    // confirm Tim Logistik is rejected on DELETE.
    const deleteForbiddenRes = await fetch(`${baseUrl}/keputusan/${encodeURIComponent(createdId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${logistik.token}` },
    });
    const deleteForbiddenOk = deleteForbiddenRes.status === 403;
    report(
      "KEPUTUSAN_DELETE_RBAC_DENY_OK",
      deleteForbiddenOk,
      deleteForbiddenOk ? "" : `(status=${deleteForbiddenRes.status})`
    );

    // (6) DELETE the created decision with manajer token -> 200 (self-clean)
    const deleteRes = await fetch(`${baseUrl}/keputusan/${encodeURIComponent(createdId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${manajer.token}` },
    });
    const deleteBody = await deleteRes.json();
    const deleteOk = deleteRes.status === 200 && deleteBody.id === createdId;
    report("KEPUTUSAN_DELETE_OK", deleteOk, deleteOk ? "" : `(status=${deleteRes.status})`);
    createdId = null;

    report(
      "KEPUTUSAN_ROUTES_OK",
      listOk &&
        riwayatOk &&
        forbiddenOk &&
        badBodyOk &&
        createOk &&
        raceOk &&
        conflictMessageOk &&
        deleteForbiddenOk &&
        deleteOk,
      `(race: count200=${count200}, count409=${count409})`
    );
  } finally {
    // Best-effort cleanup in case an assertion above threw before the
    // self-clean DELETE ran.
    if (createdId) {
      try {
        const admin = await login(baseUrl, "admin", "admin123");
        await fetch(`${baseUrl}/keputusan/${encodeURIComponent(createdId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${admin.token}` },
        });
      } catch {
        // Best-effort — ignore.
      }
    }
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
