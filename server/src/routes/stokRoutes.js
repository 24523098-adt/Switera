import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { stokUpdateSchema } from "../schemas/stokSchemas.js";
import { getStokTbs, setStokTbs } from "../services/stokService.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const stokTbs = await getStokTbs();
    return res.status(200).json({ stokTbs });
  } catch (error) {
    return next(error);
  }
});

// Write is Manajer Distribusi-only server-side (AUTH-03), mirroring kota's
// write guard — stok TBS is sawit-domain data, no longer an Admin concern.
router.put("/", requireAuth, requireRole("Manajer Distribusi"), validate(stokUpdateSchema), async (req, res, next) => {
  try {
    const stokTbs = await setStokTbs(req.body.stokTbs, req.user.username, req.user.role);
    return res.status(200).json({ stokTbs });
  } catch (error) {
    return next(error);
  }
});

export default router;
