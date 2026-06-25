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

  try {
    const manajer = await login(baseUrl, "manajer", "manajer123");

    report(
      "LOGIN_SETUP_OK",
      manajer.status === 200 && Boolean(manajer.token),
      `(manajer status=${manajer.status})`
    );

    // (1) GET /rekomendasi-distribusi with manajer token -> 200 array, each
    // item has kota/totalPermintaan/kapasitas/skor/alokasi keys.
    const rekomendasiRes = await fetch(`${baseUrl}/rekomendasi-distribusi`, {
      headers: { Authorization: `Bearer ${manajer.token}` },
    });
    const rekomendasiBody = await rekomendasiRes.json();
    const rekomendasiShapeOk =
      Array.isArray(rekomendasiBody) &&
      rekomendasiBody.every(
        (item) =>
          "kota" in item &&
          "totalPermintaan" in item &&
          "kapasitas" in item &&
          "skor" in item &&
          "alokasi" in item
      );
    const rekomendasiOk = rekomendasiRes.status === 200 && rekomendasiShapeOk;
    report(
      "GET_REKOMENDASI_DISTRIBUSI_OK",
      rekomendasiOk,
      rekomendasiOk ? `(${rekomendasiBody.length} items)` : `(status=${rekomendasiRes.status})`
    );

    // (2) GET /kpi with manajer token -> 200 object with the five KPI keys.
    const kpiRes = await fetch(`${baseUrl}/kpi`, {
      headers: { Authorization: `Bearer ${manajer.token}` },
    });
    const kpiBody = await kpiRes.json();
    const kpiShapeOk =
      kpiBody &&
      "fulfillmentRate" in kpiBody &&
      "onTimeRate" in kpiBody &&
      "avgSiklusJam" in kpiBody &&
      "kotaTercover" in kpiBody &&
      "totalKota" in kpiBody;
    const kpiOk = kpiRes.status === 200 && kpiShapeOk;
    report("GET_KPI_OK", kpiOk, kpiOk ? `(${JSON.stringify(kpiBody)})` : `(status=${kpiRes.status})`);

    // (3) GET /rekomendasi-distribusi with NO Authorization header -> 401
    // (requireAuth still enforced even though it's a read).
    const noAuthRes = await fetch(`${baseUrl}/rekomendasi-distribusi`);
    const noAuthOk = noAuthRes.status === 401;
    report("NO_AUTH_401_OK", noAuthOk, noAuthOk ? "" : `(status=${noAuthRes.status})`);

    report("DISTRIBUSI_ROUTES_OK", rekomendasiOk && kpiOk && noAuthOk);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
