import "dotenv/config";
import express from "express";
import cors from "cors";
import { pathToFileURL } from "url";
import authRouter from "./routes/authRoutes.js";
import protectedRouter from "./routes/protectedRoutes.js";
import kotaRouter from "./routes/kotaRoutes.js";
import stokRouter from "./routes/stokRoutes.js";
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
app.use("/protected", protectedRouter);
app.use("/kota", kotaRouter);
app.use("/stok-tbs", stokRouter);

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
