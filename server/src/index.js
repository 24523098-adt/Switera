import "dotenv/config";
import express from "express";
import cors from "cors";
import { pathToFileURL } from "url";
import authRouter from "./routes/authRoutes.js";

const PORT = process.env.PORT || 4000;

export const app = express();

// Open CORS is acceptable for this dev-only milestone (single local-only
// school demo, no public exposure). Tightening to the Vite dev origin is
// Phase 8's API-03 — intentionally deferred, not an oversight.
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRouter);

// Cross-platform "run directly vs imported" check: pathToFileURL normalizes
// Windows backslash paths to the same file:// URL format import.meta.url
// uses, so this works correctly on Windows, macOS, and Linux.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Switera server listening on port ${PORT}`);
  });
}
