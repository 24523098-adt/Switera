import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { keputusanCreateSchema, keputusanUpdateSchema } from "../schemas/keputusanSchemas.js";
import {
  getKeputusan,
  getRiwayatKeputusan,
  addKeputusan,
  updateKeputusan,
  removeKeputusan,
  restoreKeputusan,
} from "../services/keputusanService.js";

const router = express.Router();

// Reads are open to any authenticated role — Dashboard/Laporan read
// decisions across roles, regardless of which role created them.

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const keputusan = await getKeputusan();
    return res.status(200).json(keputusan);
  } catch (error) {
    return next(error);
  }
});

// RBAC rationale (per src/utils/navigation.js): "Keputusan Distribusi"
// (create/cancel/restore decisions) is Manajer Distribusi's menu, with
// Admin retaining superuser write access consistent with every other
// domain in this phase. "Status Distribusi" (Tim Logistik's menu) only
// ever changes a decision's `status` field, which maps to the PUT /:id
// route below — hence Tim Logistik is allow-listed on PUT only, not on
// POST/DELETE/restore.

router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Manajer Distribusi"),
  validate(keputusanCreateSchema),
  async (req, res, next) => {
    try {
      const keputusan = await addKeputusan(req.body, req.user.username, req.user.role);
      return res.status(201).json(keputusan);
    } catch (error) {
      return next(error);
    }
  }
);

// THE race-safety contract surfaced over HTTP: updateKeputusan's
// optimistic-lock conflict (statusCode 409, closes LOGIC-02) propagates
// here via next(err) to the central errorHandler, which honors
// err.statusCode — the client sees a 409 with the Indonesian conflict
// message, never a silently-overwritten row.
router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Manajer Distribusi", "Tim Logistik"),
  validate(keputusanUpdateSchema),
  async (req, res, next) => {
    try {
      const result = await updateKeputusan(req.params.id, req.body, req.user.username, req.user.role);
      return res.status(200).json(result.updated);
    } catch (error) {
      return next(error);
    }
  }
);

router.delete("/:id", requireAuth, requireRole("Admin", "Manajer Distribusi"), async (req, res, next) => {
  try {
    const keputusan = await removeKeputusan(req.params.id, req.user.username, req.user.role);
    return res.status(200).json(keputusan);
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:id/restore",
  requireAuth,
  requireRole("Admin", "Manajer Distribusi"),
  async (req, res, next) => {
    try {
      if (!req.body || req.body.id !== req.params.id) {
        return res.status(400).json({ error: "ID pada body tidak cocok dengan ID pada path." });
      }
      const keputusan = await restoreKeputusan(req.body, req.user.username, req.user.role);
      return res.status(201).json(keputusan);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
