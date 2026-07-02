---
phase: 260702-p1v
plan: 01
subsystem: backend+frontend
tags: [landing, public-endpoint, dummy-data-removal]
dependency-graph:
  requires: []
  provides:
    - "GET /public/landing-stats (endpoint publik tanpa auth)"
  affects:
    - src/pages/Landing.jsx
tech-stack:
  added: []
  patterns:
    - "Endpoint publik tanpa requireAuth/requireRole, dipasang di atas errorHandler"
    - "Fetch token-less via apiFetch(path, { auth: false })"
key-files:
  created:
    - server/src/services/publicService.js
    - server/src/routes/publicRoutes.js
  modified:
    - server/src/services/distribusiService.js
    - server/src/index.js
    - src/pages/Landing.jsx
decisions:
  - "aggregatePermintaanRanking diekspor (bukan diduplikasi) dari distribusiService.js agar publicService reuse logika ranking yang sama persis dengan /rekomendasi-distribusi dan /kpi."
  - "Payload publik dibatasi ke { ranking, daftarKota: {nama, kapasitas} } — tidak mengembalikan baris permintaan mentah (keterangan, tanggal detail) ke jalur tanpa auth (T-p1v-02)."
  - "Komentar header publicRoutes.js sengaja tidak menyebut literal 'requireAuth' agar gate grep -c requireAuth == 0 tetap bersih (disiplin gate, bukan sekadar penjelasan naratif)."
metrics:
  duration: ~20min
  completed: 2026-07-02
status: complete
---

# Quick Task 260702-p1v: Hapus Dummy/Static Data dari Frontend Switera Summary

Landing.jsx kini menampilkan ranking kota dan peta distribusi dari data nyata di PostgreSQL (via endpoint publik baru `GET /public/landing-stats`), menggantikan seed statis (`kotaDemoSeed` inline + `src/data/permintaan.json`) yang sebelumnya di-hardcode di halaman marketing.

## Yang Dikerjakan

### Task 1 — Endpoint publik backend `GET /public/landing-stats`

1. `server/src/services/distribusiService.js`: `aggregatePermintaanRanking` diekspor (`export const`) tanpa mengubah body-nya — logika ranking (bobot 0.65 permintaan / 0.35 kapasitas dst.) tetap identik, hanya ditambahkan `export` agar bisa dipakai ulang.
2. `server/src/services/publicService.js` (baru): `getLandingStats()` memanggil `getPermintaan()` + `getDaftarKota()` via `Promise.all`, menghitung `ranking = aggregatePermintaanRanking(permintaan)`, dan memetakan `daftarKota` ke bentuk minimal `{ nama, kapasitas }` saja — tidak mengekspos baris permintaan mentah ke jalur publik.
3. `server/src/routes/publicRoutes.js` (baru): `GET /landing-stats` tanpa middleware otentikasi/otorisasi apa pun. Komentar header menjelaskan alasannya (Landing tampil pra-login, tanpa JWT) tanpa menyebut nama identifier middleware secara literal, agar gate `grep -c requireAuth == 0` tetap bersih.
4. `server/src/index.js`: `publicRouter` diimpor dan dipasang via `app.use("/public", publicRouter)` bersama mount domain lain, di atas `app.use(errorHandler)`.

### Task 2 — `Landing.jsx` ambil data dari endpoint publik

1. Import `permintaanSeed` (dari `../data/permintaan.json`) dan `aggregatePermintaanRanking` (dari `../utils/distribusi`) dihapus — sudah dikonfirmasi keduanya hanya dipakai di titik yang diganti sebelum dihapus.
2. Konstanta inline `kotaDemoSeed` (8 kota + kapasitas) dihapus. Komentar header di atas widget peta diperbarui agar mencerminkan sumber data baru (endpoint publik), tanpa menyebut nama identifier yang dihapus secara literal.
3. `apiFetch` diimpor dari `../api/apiClient`.
4. `rankingDemo`/`daftarKotaDemo` diubah dari `useMemo` (menghitung dari seed) menjadi `useState([])` — fallback aman default array kosong.
5. Satu `useEffect` (mount-only) memanggil `apiFetch("/public/landing-stats", { auth: false })`. Sukses → `setRankingDemo(data.ranking ?? [])` + `setDaftarKotaDemo(data.daftarKota ?? [])`. Gagal (catch) → state dibiarkan array kosong, tanpa crash/blank. Guard `let aktif = true` dipakai untuk mencegah `setState` setelah unmount.
6. `<PetaGeografis ranking={rankingDemo} daftarKota={daftarKotaDemo} />` dibiarkan apa adanya — bentuk data (`{kota,totalPermintaan}` dan `{nama,kapasitas}`) identik dengan sebelumnya sehingga tidak ada perubahan props/tampilan.

### Task 3 — Verifikasi tidak ada dummy/static domain data lain

- `grep -rEc` untuk pola `from "../data/*.json"` / `from "./data/*.json"` di `src/pages` dan `src/components` → 0 hasil. Bersih.
- Pemakaian `src/data/*.json` tersisa hanya di luar `src/`: `server/prisma/seed.js` (untuk seeding DB) — di luar scope, tidak diubah. (Catatan: `server/prisma/seed.js` sebenarnya membaca dari `server/prisma/data/*.json`, bukan `src/data/*.json` — copy terpisah untuk seeding DB, sama sekali tidak menyentuh `src/`.)
- Pindai tambahan untuk konstanta seed inline lain (`grep "Seed\s*=\s*\["` di seluruh `src/`) → tidak ditemukan konstanta domain-seed lain.
- Ilustrasi marketing dekoratif di `FiturVisual` (mis. "287 ton" di mockup ranking section fitur) sengaja TIDAK disentuh — itu grafis mockup UI statis, bukan pembacaan domain-data dari DB, dan di luar scope constraint (tidak boleh mengubah desain visual Landing).

## Verifikasi yang Dijalankan (Live)

Backend dijalankan langsung (`npm run dev` di `server/`, terhubung ke container `switera-db-1` yang sudah berjalan) dan diverifikasi via curl:

```
$ curl -s http://localhost:4000/public/landing-stats
{"ranking":[{"kota":"Medan","totalPermintaan":41,...}, ...],
 "daftarKota":[{"nama":"Pekanbaru","kapasitas":320}, ...]}
```

- Status 200, tanpa header `Authorization`, mengembalikan data agregat NYATA dari DB (bukan angka seed) — kunci `ranking` (array `{kota,totalPermintaan,earliestTanggalInput}`) dan `daftarKota` (array `{nama,kapasitas}`) sesuai bentuk yang dibutuhkan `PetaGeografis`.
- Sebagai pembanding, `GET /kota` (route ber-auth yang sudah ada) tanpa token → 401, membuktikan `/public/landing-stats` memang menembus batas auth secara sengaja dan terisolasi, bukan karena semua route jadi publik.
- Backend dev server dihentikan kembali setelah verifikasi (PID pada port 4000 di-taskkill), tidak dibiarkan berjalan di latar belakang.

Semua gate `grep` otomatis di plan telah dijalankan dan lolos:
- `grep -c "requireAuth" server/src/routes/publicRoutes.js` → 0
- `node --input-type=module -e "import(...).then(...)"` → `OK export` (getLandingStats terekspor dengan benar)
- `grep -c "kotaDemoSeed" src/pages/Landing.jsx` → 0
- `grep -c "data/permintaan.json" src/pages/Landing.jsx` → 0
- `grep -c "auth: false" src/pages/Landing.jsx` → 2 (1 baris kode fetch, 1 komentar penjelas)
- `grep -rEc` import `data/*.json` di `src/pages` + `src/components` → 0 (CLEAN)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Komentar header `publicRoutes.js` menyebut nama middleware secara literal, membuat gate `grep -c requireAuth` gagal (hasil 1, bukan 0)**
- **Found during:** Task 1, setelah menulis draf pertama `publicRoutes.js` dan menjalankan verify otomatis.
- **Issue:** Komentar header awal menulis "tidak memakai requireAuth/requireRole sama sekali" — literal string `requireAuth` di komentar ikut ter-grep, membuat gate keamanan (yang dirancang untuk memastikan tidak ada route ber-auth diselundupkan ke router publik) gagal walau secara fungsional route memang sudah tanpa middleware auth.
- **Fix:** Komentar diubah menjadi "middleware otentikasi/otorisasi apa pun" (deskriptif, bukan literal nama identifier).
- **Files modified:** `server/src/routes/publicRoutes.js`
- **Commit:** `051c45b`

Tidak ada deviation lain — sisanya dieksekusi persis sesuai plan.

## Threat Flags

Tidak ada temuan baru di luar `<threat_model>` plan. Ketiga item (T-p1v-01 s/d T-p1v-04) di PLAN.md sudah menutupi permukaan endpoint publik baru ini; T-p1v-02 (batasi payload) dan T-p1v-04 (isolasi router publik dari middleware auth) sudah diverifikasi langsung lewat curl + gate grep di atas.

## Self-Check: PASSED

Semua file yang diklaim dibuat/diubah ditemukan di disk (`server/src/services/publicService.js`, `server/src/routes/publicRoutes.js`, `server/src/services/distribusiService.js`, `server/src/index.js`, `src/pages/Landing.jsx`, SUMMARY.md ini sendiri). Kedua commit hash (`051c45b`, `f26fe8e`) ditemukan di `git log`.
