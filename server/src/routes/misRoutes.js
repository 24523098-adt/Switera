import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import {
  getSituasiHariIni,
  getTindakanMendesak,
  getRekomendasiPrioritas,
  getKeputusanBerjalan,
  getProyeksiStok,
  getKpiManajer,
  getEfisiensiLogistik,
  sinkronNotifikasiMis,
} from "../services/misService.js";

/**
 * Router MIS untuk Manajer Distribusi. Semua endanya bersifat READ dan khusus
 * peran Manajer Distribusi (requireAuth + requireRole). Router ini memakai
 * full path sendiri (pola sama dengan distribusiRoutes) sehingga di-mount
 * tanpa prefix di index.js. Tidak menimpa endpoint lama; KPI manajer sengaja
 * di /mis/kpi, bukan /kpi (yang sudah ada).
 */
const router = express.Router();

const hanyaManajer = [requireAuth, requireRole("Manajer Distribusi")];

const bungkus = (handler) => async (req, res, next) => {
  try {
    return res.status(200).json(await handler());
  } catch (error) {
    return next(error);
  }
};

router.get("/mis/situasi-hari-ini", ...hanyaManajer, bungkus(getSituasiHariIni));
router.get("/mis/tindakan-mendesak", ...hanyaManajer, bungkus(getTindakanMendesak));
router.get("/mis/rekomendasi-prioritas", ...hanyaManajer, bungkus(getRekomendasiPrioritas));
router.get("/mis/keputusan-berjalan", ...hanyaManajer, bungkus(getKeputusanBerjalan));
router.get("/mis/proyeksi-stok", ...hanyaManajer, bungkus(getProyeksiStok));
router.get("/mis/kpi", ...hanyaManajer, bungkus(getKpiManajer));
router.get("/efisiensi-logistik", ...hanyaManajer, bungkus(getEfisiensiLogistik));

// Sinkronisasi notifikasi cerdas (dipanggil frontend saat dashboard dimuat).
router.post("/mis/sinkron-notifikasi", ...hanyaManajer, bungkus(sinkronNotifikasiMis));

export default router;
