---
quick_id: 260710-rmc
description: Tambah fitur MIS Peramalan Permintaan per Kota di AnalisisRanking (forecast.js + Sparkline)
date: 2026-07-10
status: complete
commit: b89a3b3
---

# Summary — Quick Task 260710-rmc

## Apa yang dibangun

Section **"Peramalan Permintaan per Kota"** di `src/pages/AnalisisRanking.jsx`, ditempatkan antara
Grafik Ranking (data historis) dan Simulasi Distribusi — alur MIS: historis → peramalan → simulasi.

- Memakai `computeForecastPerKota` dari `src/utils/forecast.js` — util yang sudah ada sejak v1.0 tetapi
  **belum pernah dipakai** halaman mana pun (celah MIS terakhir dari pembacaan seluruh proyek).
- Komponen baru di file yang sama: `PeramalanPermintaan` (section) + `ChipTren` (chip Neo-Brutalism
  border hitam 2px, pill, ikon Material Symbols `trending_up/down/flat`).
- Isi section: 3 kotak ringkasan (Estimasi Kebutuhan Berikutnya = jumlah rata-rata bergerak window 3
  semua kota; Stok TBS Saat Ini; Selisih dengan latar merah bila defisit), banner peringatan bila
  defisit, dan `Tabel` per kota (Sparkline riwayat, nilai terakhir, estimasi berikutnya, chip tren).
- Murni frontend; nol perubahan backend; nol dependensi baru; gaya konsisten token `tokens.css`.

## Verifikasi

- `npm run build` sukses (Vite 7, 80 modul).
- Logika data diverifikasi live via Vite `ssrLoadModule` terhadap seed nyata
  (`server/prisma/data/permintaan.json`): 8 kota, total estimasi berikutnya 136,3 ton, semua kota punya
  ≥ 2 titik riwayat sehingga Sparkline tampil.

## Deviasi / Catatan

- Working tree berisi batch MIS besar yang belum di-commit dari sesi sebelumnya. `AnalisisRanking.jsx`
  termasuk di dalamnya, sehingga commit `b89a3b3` juga membawa rework MIS halaman itu dari sesi
  sebelumnya (Simulasi Distribusi + Penjelasan Skor + rombakan tabel). Dicatat transparan di pesan
  commit. File-file MIS lain (Dashboard, Laporan, misService/misRoutes, dll.) tetap belum di-commit —
  menunggu keputusan user.
