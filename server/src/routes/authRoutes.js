import express from "express";
import { verifyLogin, registerAkun } from "../services/akunService.js";
import { signToken } from "../auth/jwt.js";
import { roleOptions } from "./roleOptions.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const akun = await verifyLogin(username, password);
    if (!akun) {
      // Same generic message for unknown-user and wrong-password — prevents
      // credential enumeration (T-07-ENUM).
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const token = signToken({ id: akun.id, username: akun.username, role: akun.role });

    return res.status(200).json({
      token,
      user: { id: akun.id, nama: akun.nama, username: akun.username, role: akun.role },
    });
  } catch (error) {
    return res.status(500).json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nama, username, password, role } = req.body ?? {};

    if (!nama) {
      return res.status(400).json({ error: "Nama wajib diisi." });
    }
    if (!username) {
      return res.status(400).json({ error: "Username wajib diisi." });
    }
    if (!password) {
      return res.status(400).json({ error: "Password wajib diisi." });
    }
    if (!role || !roleOptions.includes(role)) {
      return res.status(400).json({ error: "Role tidak valid." });
    }

    const akun = await registerAkun({ nama, username, role }, password);

    return res.status(201).json({
      user: { id: akun.id, nama: akun.nama, username: akun.username, role: akun.role },
    });
  } catch (error) {
    if (error.message === "Username sudah digunakan.") {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: "Terjadi kesalahan pada server. Silakan coba lagi." });
  }
});

export default router;
