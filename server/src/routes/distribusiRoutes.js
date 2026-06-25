import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getRekomendasiDistribusi, getKpiMetrics } from "../services/distribusiService.js";

const router = express.Router();

// Reads are open to any authenticated role — Manajer Distribusi consumes
// this directly (AnalisisRanking.jsx, KeputusanDistribusi.jsx) and
// Admin/Tim Logistik dashboards surface summarized versions. No role
// restricts a READ here, consistent with kota/permintaan GET routes
// elsewhere in this phase (AUTH-03: still requireAuth-gated, just not
// requireRole-gated).

router.get("/rekomendasi-distribusi", requireAuth, async (req, res, next) => {
  try {
    const rekomendasi = await getRekomendasiDistribusi();
    return res.status(200).json(rekomendasi);
  } catch (error) {
    return next(error);
  }
});

router.get("/kpi", requireAuth, async (req, res, next) => {
  try {
    const kpi = await getKpiMetrics();
    return res.status(200).json(kpi);
  } catch (error) {
    return next(error);
  }
});

export default router;
