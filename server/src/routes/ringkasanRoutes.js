import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { ringkasanCreateSchema } from "../schemas/ringkasanSchemas.js";
import { buatRingkasanLaporan } from "../services/ringkasanService.js";

const router = express.Router();

// AI-1: ringkasan naratif halaman Laporan. requireAuth tanpa requireRole —
// semua role membaca laporan (konsisten dengan GET /kpi). Sudut pandang
// ringkasan diturunkan dari req.user.role (payload JWT), bukan dari body,
// supaya tidak bisa dipalsukan klien. POST (bukan GET) karena setiap
// panggilan menghasilkan konten baru dan memakan biaya API.

router.post(
  "/laporan/ringkasan",
  requireAuth,
  validate(ringkasanCreateSchema),
  async (req, res, next) => {
    try {
      const hasil = await buatRingkasanLaporan(req.body.periode, req.user.role);
      return res.status(200).json(hasil);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
