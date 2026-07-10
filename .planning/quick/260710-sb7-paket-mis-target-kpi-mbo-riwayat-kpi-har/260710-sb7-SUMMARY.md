---
quick_id: 260710-sb7
description: Paket MIS - Target KPI (MBO) + Riwayat KPI harian & tren + Drill-down KPI di Dashboard Manajer
date: 2026-07-10
status: complete
commits: [8ed2b35, 4c7ddd7]
---

# Summary — Quick Task 260710-sb7

## Konteks

Menjawab teguran dosen "arah MIS kurang jelas, lebih condong TPS" dengan tiga ciri struktural MIS yang
sebelumnya tidak ada: target manajemen, sejarah kinerja, dan penelusuran angka.

## Apa yang dibangun

**Backend (8ed2b35):**
- Model `TargetKpi` singleton (management by objectives) + `KpiSnapshot` (satu baris per tanggal),
  migrasi `20260710132447_add_target_kpi_dan_kpi_snapshot`.
- `targetKpiService.js` (get/set + activity log), `misSchemas.js` (zod PUT).
- Ambang MIS tidak lagi hardcoded: status stok memakai `minHariPasokan` (kritis = setengahnya),
  eskalasi keputusan (tindakan mendesak + notifikasi cerdas) memakai `maxHariEskalasi`.
- `GET /mis/kpi` → `{ realisasi, target, status tercapai/meleset }`; `GET/PUT /mis/target-kpi`;
  `GET /mis/riwayat-kpi?hari=N`; `sinkron-notifikasi` kini juga merekam snapshot harian (upsert by
  tanggal, fail-soft).
- Seed: TargetKpi default + backfill 14 hari KpiSnapshot (tren demo); backfill idempoten juga sudah
  dijalankan ke DB dev hidup tanpa reset data.

**Frontend (4c7ddd7):**
- Dashboard Manajer bertambah dua bagian: **Kinerja vs Target** (4 kartu KPI dengan chip
  Tercapai/Meleset + tombol Atur Target → modal form) dan **Tren Kinerja** (line chart riwayat KPI +
  garis target putus-putus).
- Drill-down: klik kartu KPI membuka modal rincian — pemenuhan per kota (`computePemenuhanPerKota`),
  siklus pengiriman (`computeSiklusDetail`) — dua util `utils/mis.js` yang sebelumnya belum terpakai —
  plus utilisasi per kota.
- `apiClient`: `getTargetKpi`/`setTargetKpi`/`getRiwayatKpi`.

## Verifikasi

- Live test dengan JWT manajer: GET/PUT target (PUT invalid 150% → 400), KPI membawa target+status,
  sinkron merekam snapshot hari ini (`snapshotDirekam: true`), riwayat 15 baris (14 backfill + 1 nyata),
  RBAC Tim Logistik → 403.
- `node --check` semua file backend; `npm run build` frontend sukses.

## Deviasi / Catatan

- Wrapper `setTargetKpi` awalnya men-double-stringify body (apiFetch sudah stringify sendiri) —
  diperbaiki sebelum commit.
- `Tombol` tidak punya prop `ikon` — pemakaian disesuaikan.
- Snapshot backfill di seed bersifat sintetis untuk demo; hari berjalan terisi otomatis dari kondisi
  nyata via sinkron-notifikasi.
