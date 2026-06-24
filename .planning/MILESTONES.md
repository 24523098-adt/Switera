# Milestones

## v1.0 Completion & Polish (Shipped: 2026-06-24)

**Phases completed:** 5 phases, 9 plans, 25 tasks

**Key accomplishments:**

- Admin-only "Manajemen Kota" page with reactive city table and TBS stock card, registered across all three navigation registries
- Add-city/edit-capacity form with inline validation and a TBS stock editor, both wired to existing store mutators (`tambahKota`, `updateKota`, `setStokTbs`)
- Cascade-rename across three collections and block-delete-if-referenced, closing the phase's "no silent data-integrity gaps" goal
- Laporan.jsx now branches on `roleAktif` to render two structurally different reports: Manajer Distribusi keeps the Riwayat Keputusan table + Tren Permintaan line chart (unchanged), while Tim Logistik gets a new Distribusi Aktif table with Armada/ETA column plus a Status Pengiriman doughnut chart, both reading from `snapshot.keputusan` instead of `snapshot.riwayatKeputusan`/`snapshot.permintaan`.
- Login.jsx now renders three independently-clearing field-level inline errors (username/password/role) instead of one generic string, and Register.jsx mints account IDs via a new store.getNextAkunId() wrapper instead of Date.now().
- StatusDistribusi's update-status modal now requires armada/ETA under "dalam-pengiriman" via a new validateModalForm() guard, and InputData replaces its empty kota dropdown with an explanatory message plus a submission-blocking toast.
- Login and Register submit buttons now render through the shared `Tombol` component instead of a bespoke `.auth-submit-btn`, with all auth logic, validation, and copy preserved exactly.
- Landing.jsx now renders through the shared `Tombol`, `Card`, and `IkonDaun` components instead of hand-rolled equivalents, with all 9 sections, layout, and Indonesian copy preserved exactly.
- Audited all 12 pages against the 9-dimension completeness checklist; found and fixed 4 concrete validation/consistency gaps where the same user action behaved differently depending on which page triggered it.

---
