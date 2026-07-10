import "dotenv/config";
import express from "express";
import cors from "cors";
import { pathToFileURL } from "url";
import authRouter from "./routes/authRoutes.js";
import akunRouter from "./routes/akunRoutes.js";
import kotaRouter from "./routes/kotaRoutes.js";
import stokRouter from "./routes/stokRoutes.js";
import permintaanRouter from "./routes/permintaanRoutes.js";
import keputusanRouter from "./routes/keputusanRoutes.js";
import distribusiRouter from "./routes/distribusiRoutes.js";
import misRouter from "./routes/misRoutes.js";
import ringkasanRouter from "./routes/ringkasanRoutes.js";
import notifikasiRouter from "./routes/notifikasiRoutes.js";
import activityLogRouter from "./routes/activityLogRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import requireAuth from "./middleware/requireAuth.js";
import { getRiwayatKeputusan } from "./services/keputusanService.js";
import { errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 4000;

export const app = express();

// CORS locked to the Vite dev origin (API-03) — the frontend Vite dev
// server binds to 0.0.0.0:5173 per vite.config.js, so the browser-visible
// origin is http://localhost:5173. CORS_ORIGIN env var overrides the
// default without a code change (not hardcode-only). credentials: true
// allows the Authorization header / cookies to cross the boundary.
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/akun", akunRouter);
app.use("/kota", kotaRouter);
app.use("/stok-tbs", stokRouter);
app.use("/permintaan", permintaanRouter);
app.use("/keputusan", keputusanRouter);
app.use("/notifikasi", notifikasiRouter);
app.use("/activity-log", activityLogRouter);

// Endpoint publik (tanpa requireAuth) untuk halaman Landing pra-login —
// lihat komentar header di publicRoutes.js untuk alasan lengkapnya.
app.use("/public", publicRouter);

// distribusiRouter defines its own full paths (/rekomendasi-distribusi,
// /kpi) rather than being mounted under a shared prefix — mounted with no
// prefix so the final URLs match the ROADMAP success criterion's literal
// endpoint names exactly (Express 5 supports a router mounted at root with
// full paths defined inside it).
app.use(distribusiRouter);

// misRouter juga full-path sendiri (/mis/*, /efisiensi-logistik) — pola mount
// tanpa prefix yang sama dengan distribusiRouter. Endpoint MIS baru untuk
// Manajer Distribusi; tidak menimpa route lama.
app.use(misRouter);

// ringkasanRouter juga mendefinisikan full path-nya sendiri
// (/laporan/ringkasan) — pola mount tanpa prefix yang sama dengan
// distribusiRouter di atas.
app.use(ringkasanRouter);

// riwayat-keputusan (decision history) is its own top-level data domain per
// the ROADMAP/REQUIREMENTS, not a sub-resource of /keputusan — mounted as a
// dedicated route reusing the same getRiwayatKeputusan-backed handler.
app.get("/riwayat-keputusan", requireAuth, async (req, res, next) => {
  try {
    const riwayat = await getRiwayatKeputusan();
    return res.status(200).json(riwayat);
  } catch (error) {
    return next(error);
  }
});

// keep last — central error handler. Wave 2/3 domain routers must mount
// ABOVE this line; Express only treats a 4-arg middleware registered last
// as the error handler.
app.use(errorHandler);

// Cross-platform "run directly vs imported" check: pathToFileURL normalizes
// Windows backslash paths to the same file:// URL format import.meta.url
// uses, so this works correctly on Windows, macOS, and Linux. Guard
// process.argv[1] being undefined (e.g. `node -e "import(...)"` in verify
// scripts has no script-file argument) so dynamic-import-only invocations
// never throw — they simply skip auto-listen, same as any other import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Switera server listening on port ${PORT}`);
  });
}
