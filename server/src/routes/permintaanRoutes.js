import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { permintaanCreateSchema, permintaanUpdateSchema } from "../schemas/permintaanSchemas.js";
import {
  getPermintaan,
  hasPermintaanDuplikat,
  addPermintaan,
  updatePermintaan,
  removePermintaan,
} from "../services/permintaanService.js";

const router = express.Router();

// Reads are open to any authenticated role — every role's dashboards and
// the ranking engine consume request data downstream (AUTH-03 reasoning
// mirrors kotaRoutes.js: src/utils/navigation.js places "Input Data" /
// "Manajemen Data" in the Admin menu only, so writes are gated below, not
// reads).

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const permintaan = await getPermintaan();
    return res.status(200).json(permintaan);
  } catch (error) {
    return next(error);
  }
});

router.get("/duplikat", requireAuth, async (req, res, next) => {
  try {
    const { kota, tanggal_permintaan, excludeId } = req.query;
    const duplikat = await hasPermintaanDuplikat({
      kota,
      tanggalPermintaan: tanggal_permintaan,
      excludeId,
    });
    return res.status(200).json({ duplikat });
  } catch (error) {
    return next(error);
  }
});

// Writes are Admin-only server-side (AUTH-03) — the real security boundary,
// independent of the frontend's cosmetic menu gating.

router.post(
  "/",
  requireAuth,
  requireRole("Admin"),
  validate(permintaanCreateSchema),
  async (req, res, next) => {
    try {
      const permintaan = await addPermintaan(req.body, req.user.username, req.user.role);
      return res.status(201).json(permintaan);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin"),
  validate(permintaanUpdateSchema),
  async (req, res, next) => {
    try {
      const permintaan = await updatePermintaan(req.params.id, req.body, req.user.username, req.user.role);
      return res.status(200).json(permintaan);
    } catch (error) {
      return next(error);
    }
  }
);

router.delete("/:id", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const result = await removePermintaan(req.params.id, req.user.username, req.user.role);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
