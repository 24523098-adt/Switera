import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { kotaCreateSchema, kotaUpdateSchema } from "../schemas/kotaSchemas.js";
import {
  getDaftarKota,
  getKotaReferenceCounts,
  tambahKota,
  updateKota,
  hapusKota,
} from "../services/kotaService.js";

const router = express.Router();

// Reads are open to any authenticated role — the city list feeds dropdowns
// across Admin, Manajer Distribusi, and Tim Logistik pages alike.

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const daftarKota = await getDaftarKota();
    return res.status(200).json(daftarKota);
  } catch (error) {
    return next(error);
  }
});

router.get("/:nama/references", requireAuth, async (req, res, next) => {
  try {
    const counts = await getKotaReferenceCounts(req.params.nama);
    return res.status(200).json(counts);
  } catch (error) {
    return next(error);
  }
});

// Writes are Admin-only server-side (AUTH-03) — "Manajemen Kota" is in the
// Admin menu only per src/utils/navigation.js, but that's frontend-cosmetic
// gating; requireRole("Admin") here is the real security boundary.

router.post("/", requireAuth, requireRole("Admin"), validate(kotaCreateSchema), async (req, res, next) => {
  try {
    const daftarKota = await tambahKota(req.body, req.user.username, req.user.role);
    return res.status(201).json(daftarKota);
  } catch (error) {
    return next(error);
  }
});

router.put("/:nama", requireAuth, requireRole("Admin"), validate(kotaUpdateSchema), async (req, res, next) => {
  try {
    const daftarKota = await updateKota(req.params.nama, req.body, req.user.username, req.user.role);
    return res.status(200).json(daftarKota);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:nama", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const daftarKota = await hapusKota(req.params.nama, req.user.username, req.user.role);
    return res.status(200).json(daftarKota);
  } catch (error) {
    return next(error);
  }
});

export default router;
