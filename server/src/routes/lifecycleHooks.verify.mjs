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

// Proves LOGIC-03: a mutation's activity-log / notifikasi row is visible
// via GET in the SAME request/response cycle that created the mutation —
// no second client call required. Covers permintaan, keputusan, kota, and
// stok — the full set src/store.js instruments today, not a
// permintaan/keputusan-only subset.
async function main() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const TEST_CITY = "__LifecycleHooksVerifyTemp__";
  let permintaanId = null;
  let keputusanId = null;
  let priorStokValue = null;

  try {
    const admin = await login(baseUrl, "admin", "admin123");
    report("LOGIN_SETUP_OK", admin.status === 200 && Boolean(admin.token), `(status=${admin.status})`);
    const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` };
    const readHeaders = { Authorization: `Bearer ${admin.token}` };

    // Best-effort pre-clean from any prior failed run.
    await fetch(`${baseUrl}/kota/${encodeURIComponent(TEST_CITY)}`, { method: "DELETE", headers: readHeaders });

    // (1) POST /permintaan -> 201; immediately GET /activity-log -> newest
    // entry matches "Menambahkan data permintaan kota {kota}" with no
    // second client call in between creating the row and reading the log.
    const permintaanRes = await fetch(`${baseUrl}/permintaan`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        kota: "Pekanbaru",
        tanggal_permintaan: "2026-06-25",
        tanggal_input: "2026-06-25",
        jumlah_permintaan: 5,
        keterangan: "lifecycleHooks.verify.mjs",
      }),
    });
    const permintaanBody = await permintaanRes.json();
    permintaanId = permintaanBody?.id ?? null;
    const permintaanCreateOk = permintaanRes.status === 201 && Boolean(permintaanId);
    report("PERMINTAAN_CREATE_OK", permintaanCreateOk, permintaanCreateOk ? `(id=${permintaanId})` : `(status=${permintaanRes.status})`);

    const activityAfterPermintaanRes = await fetch(`${baseUrl}/activity-log`, { headers: readHeaders });
    const activityAfterPermintaan = await activityAfterPermintaanRes.json();
    const newestAfterPermintaan = activityAfterPermintaan[0];
    const permintaanActivityOk =
      newestAfterPermintaan?.aksi === "Menambahkan data permintaan kota Pekanbaru";
    report(
      "PERMINTAAN_ACTIVITY_SAME_REQUEST_OK",
      permintaanActivityOk,
      permintaanActivityOk ? "" : `(newest=${JSON.stringify(newestAfterPermintaan)})`
    );

    // (2) GET /notifikasi -> newest entry's judul is "Data permintaan baru"
    // — same same-request proof for notifications.
    const notifAfterPermintaanRes = await fetch(`${baseUrl}/notifikasi`, { headers: readHeaders });
    const notifAfterPermintaan = await notifAfterPermintaanRes.json();
    const newestNotifAfterPermintaan = notifAfterPermintaan[0];
    const permintaanNotifOk = newestNotifAfterPermintaan?.judul === "Data permintaan baru";
    report(
      "PERMINTAAN_NOTIF_SAME_REQUEST_OK",
      permintaanNotifOk,
      permintaanNotifOk ? "" : `(newest=${JSON.stringify(newestNotifAfterPermintaan)})`
    );

    // (3) POST /keputusan then PUT /keputusan/:id with a different status ->
    // GET /activity-log's newest matches the status-change message AND
    // GET /notifikasi's newest matches "Status distribusi diperbarui".
    const keputusanRes = await fetch(`${baseUrl}/keputusan`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        kota_tujuan: "Pekanbaru",
        volume_tbs: 8,
        tanggal_keputusan: "2026-06-25",
        diputuskan_oleh: "lifecycleHooks.verify.mjs",
        status: "menunggu",
      }),
    });
    const keputusanBody = await keputusanRes.json();
    keputusanId = keputusanBody?.id ?? null;
    const keputusanCreateOk = keputusanRes.status === 201 && Boolean(keputusanId);
    report("KEPUTUSAN_CREATE_OK", keputusanCreateOk, keputusanCreateOk ? `(id=${keputusanId})` : `(status=${keputusanRes.status})`);

    const keputusanPutRes = await fetch(`${baseUrl}/keputusan/${keputusanId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ status: "dalam-pengiriman" }),
    });
    const keputusanPutOk = keputusanPutRes.status === 200;
    report("KEPUTUSAN_STATUS_UPDATE_OK", keputusanPutOk, keputusanPutOk ? "" : `(status=${keputusanPutRes.status})`);

    const activityAfterKeputusanRes = await fetch(`${baseUrl}/activity-log`, { headers: readHeaders });
    const activityAfterKeputusan = await activityAfterKeputusanRes.json();
    const newestAfterKeputusan = activityAfterKeputusan[0];
    const keputusanActivityOk =
      newestAfterKeputusan?.aksi === "Memperbarui status distribusi kota Pekanbaru menjadi Dalam Pengiriman";
    report(
      "KEPUTUSAN_ACTIVITY_SAME_REQUEST_OK",
      keputusanActivityOk,
      keputusanActivityOk ? "" : `(newest=${JSON.stringify(newestAfterKeputusan)})`
    );

    const notifAfterKeputusanRes = await fetch(`${baseUrl}/notifikasi`, { headers: readHeaders });
    const notifAfterKeputusan = await notifAfterKeputusanRes.json();
    const newestNotifAfterKeputusan = notifAfterKeputusan[0];
    const keputusanNotifOk = newestNotifAfterKeputusan?.judul === "Status distribusi diperbarui";
    report(
      "KEPUTUSAN_NOTIF_SAME_REQUEST_OK",
      keputusanNotifOk,
      keputusanNotifOk ? "" : `(newest=${JSON.stringify(newestNotifAfterKeputusan)})`
    );

    // (4) POST /kota with a throwaway city name -> 201; immediately
    // GET /activity-log -> newest entry's aksi matches
    // "Menambahkan kota {nama} ke daftar kota".
    const kotaCreateRes = await fetch(`${baseUrl}/kota`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ nama: TEST_CITY, kapasitas: 25 }),
    });
    const kotaCreateOk = kotaCreateRes.status === 201;
    report("KOTA_CREATE_OK", kotaCreateOk, kotaCreateOk ? "" : `(status=${kotaCreateRes.status})`);

    const activityAfterKotaCreateRes = await fetch(`${baseUrl}/activity-log`, { headers: readHeaders });
    const activityAfterKotaCreate = await activityAfterKotaCreateRes.json();
    const newestAfterKotaCreate = activityAfterKotaCreate[0];
    const kotaCreateActivityOk =
      newestAfterKotaCreate?.aksi === `Menambahkan kota ${TEST_CITY} ke daftar kota`;
    report(
      "KOTA_CREATE_ACTIVITY_SAME_REQUEST_OK",
      kotaCreateActivityOk,
      kotaCreateActivityOk ? "" : `(newest=${JSON.stringify(newestAfterKotaCreate)})`
    );

    // (5) PUT /stok-tbs with a throwaway value -> 200; immediately
    // GET /activity-log -> newest entry's aksi matches
    // "Memperbarui stok TBS tersedia menjadi {value} ton", then restore.
    const priorStokRes = await fetch(`${baseUrl}/stok-tbs`, { headers: readHeaders });
    const priorStokBody = await priorStokRes.json();
    priorStokValue = priorStokBody.stokTbs;

    const stokUpdateRes = await fetch(`${baseUrl}/stok-tbs`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ stokTbs: 444 }),
    });
    const stokUpdateOk = stokUpdateRes.status === 200;
    report("STOK_UPDATE_OK", stokUpdateOk, stokUpdateOk ? "" : `(status=${stokUpdateRes.status})`);

    const activityAfterStokRes = await fetch(`${baseUrl}/activity-log`, { headers: readHeaders });
    const activityAfterStok = await activityAfterStokRes.json();
    const newestAfterStok = activityAfterStok[0];
    const stokActivityOk = newestAfterStok?.aksi === "Memperbarui stok TBS tersedia menjadi 444 ton";
    report(
      "STOK_ACTIVITY_SAME_REQUEST_OK",
      stokActivityOk,
      stokActivityOk ? "" : `(newest=${JSON.stringify(newestAfterStok)})`
    );

    const stokRestoreRes = await fetch(`${baseUrl}/stok-tbs`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ stokTbs: priorStokValue }),
    });
    const stokRestoreOk = stokRestoreRes.status === 200;
    report("STOK_RESTORE_OK", stokRestoreOk, stokRestoreOk ? "" : `(status=${stokRestoreRes.status})`);

    // (6) DELETE the throwaway city -> 200; immediately GET /activity-log
    // -> newest entry's aksi matches "Menghapus kota {nama} dari daftar
    // kota".
    const kotaDeleteRes = await fetch(`${baseUrl}/kota/${encodeURIComponent(TEST_CITY)}`, {
      method: "DELETE",
      headers: readHeaders,
    });
    const kotaDeleteOk = kotaDeleteRes.status === 200;
    report("KOTA_DELETE_OK", kotaDeleteOk, kotaDeleteOk ? "" : `(status=${kotaDeleteRes.status})`);

    const activityAfterKotaDeleteRes = await fetch(`${baseUrl}/activity-log`, { headers: readHeaders });
    const activityAfterKotaDelete = await activityAfterKotaDeleteRes.json();
    const newestAfterKotaDelete = activityAfterKotaDelete[0];
    const kotaDeleteActivityOk =
      newestAfterKotaDelete?.aksi === `Menghapus kota ${TEST_CITY} dari daftar kota`;
    report(
      "KOTA_DELETE_ACTIVITY_SAME_REQUEST_OK",
      kotaDeleteActivityOk,
      kotaDeleteActivityOk ? "" : `(newest=${JSON.stringify(newestAfterKotaDelete)})`
    );

    report(
      "LIFECYCLE_HOOKS_OK",
      permintaanCreateOk &&
        permintaanActivityOk &&
        permintaanNotifOk &&
        keputusanCreateOk &&
        keputusanPutOk &&
        keputusanActivityOk &&
        keputusanNotifOk &&
        kotaCreateOk &&
        kotaCreateActivityOk &&
        stokUpdateOk &&
        stokActivityOk &&
        stokRestoreOk &&
        kotaDeleteOk &&
        kotaDeleteActivityOk
    );
  } finally {
    // (7) Clean up the created permintaan/keputusan rows — kota/stok steps
    // already self-clean via their own delete/restore calls above.
    try {
      const { token: cleanupToken } = await login(baseUrl, "admin", "admin123");
      const cleanupHeaders = { Authorization: `Bearer ${cleanupToken}` };

      if (permintaanId) {
        await fetch(`${baseUrl}/permintaan/${permintaanId}`, { method: "DELETE", headers: cleanupHeaders });
      }
      if (keputusanId) {
        await fetch(`${baseUrl}/keputusan/${keputusanId}`, { method: "DELETE", headers: cleanupHeaders });
      }
    } catch {
      // Best-effort cleanup — ignore errors here (e.g. rows already gone).
    }

    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
