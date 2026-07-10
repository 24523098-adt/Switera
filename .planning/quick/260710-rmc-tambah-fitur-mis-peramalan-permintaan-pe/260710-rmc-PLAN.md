---
quick_id: 260710-rmc
description: Tambah fitur MIS Peramalan Permintaan per Kota di AnalisisRanking (forecast.js + Sparkline)
created: 2026-07-10
mode: quick
execution: inline (sesuai preferensi user — tanpa spawning subagent)
---

# Quick Task 260710-rmc: Peramalan Permintaan per Kota

## Objective

Menutup celah MIS terakhir yang teridentifikasi dari pembacaan seluruh proyek: `src/utils/forecast.js`
(`computeForecastPerKota` — rata-rata bergerak window 3 + deteksi arah tren) sudah ada sejak v1.0 tetapi
tidak dipakai halaman mana pun. Informasi berorientasi masa depan (peramalan kebutuhan) adalah ciri khas
MIS yang belum terwakili di sisi analisis per kota. Fitur ini murni frontend, tidak menyentuh backend.

## Tasks

### Task 1: Section "Peramalan Permintaan per Kota" di AnalisisRanking.jsx

**Files:** `src/pages/AnalisisRanking.jsx`

**Action:**
- Import `computeForecastPerKota` dari `../utils/forecast` dan `Sparkline` dari `../components/Sparkline`.
- Hitung `forecastList` via `useMemo` dari `snapshot.permintaan`; hitung total estimasi kebutuhan periode
  berikutnya (jumlah `rataRata` semua kota) dan bandingkan dengan `snapshot.stokTbs` → indikator
  cukup/defisit.
- Tambahkan `Card` baru (antara Grafik Ranking dan Simulasi Distribusi) berisi:
  - 3 kotak ringkasan: Estimasi Kebutuhan Berikutnya (total), Stok TBS Saat Ini, Selisih (cukup/defisit,
    latar `--color-danger-bg` bila defisit — pola sama dengan kotak Sisa Stok di Simulasi Distribusi).
  - `Tabel` per kota: Kota, Riwayat (Sparkline; "—" bila < 2 titik data), Nilai Terakhir, Estimasi
    Berikutnya (rata-rata bergerak window 3), Tren (chip Neo-Brutalism border hitam 2px radius penuh +
    ikon Material Symbols `trending_up`/`trending_down`/`trending_flat`).
- Gaya konsisten Neo-Brutalism: border `2px solid #000000`, token dari `tokens.css`, tanpa pendekatan
  styling baru.

**Verify:** `npm run build` sukses; section muncul dengan data forecast terurut dari estimasi terbesar.

**Done:** `computeForecastPerKota` terpakai di halaman nyata; AnalisisRanking menampilkan informasi
peramalan (bukan sekadar data historis), melengkapi tema MIS.

## Catatan

Working tree sudah berisi batch perubahan MIS besar yang belum di-commit dari sesi sebelumnya —
`AnalisisRanking.jsx` termasuk di dalamnya (Simulasi Distribusi + Penjelasan Skor). Commit task ini atas
file tersebut otomatis ikut membawa perubahan sesi sebelumnya pada file yang sama; dicatat transparan di
SUMMARY dan pesan commit.
