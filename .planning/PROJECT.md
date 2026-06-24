# Switera

## What This Is

Switera is a client-only React SPA for managing the distribution of TBS (kelapa sawit / palm fruit) stock across cities — covering requests, ranking-based distribution decisions, status tracking, reporting, and activity history, with three distinct roles (Admin, Manajer Distribusi, Tim Logistik). It's a school project meant to demo at production quality: complete features, proper validation, consistent UI, and clean code, while deliberately staying client-only (no real backend) for this milestone.

## Core Value

The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

## Requirements

### Validated

- ✓ Core navigation/routing (manual router in `src/App.jsx`) correctly resolves route + role + auth state — existing
- ✓ Reactive store (`src/store.js`) — every mutation persists to `localStorage` and triggers re-render via subscription, no page requires a manual refresh — existing
- ✓ CRUD for permintaan (requests) — add/edit/delete/duplicate-check all route through the store correctly (`InputData.jsx`, `ManajemenData.jsx`) — existing
- ✓ Distribution decision flow — recommendation engine, approve/manual-pick, cancel-with-undo all work end-to-end (`KeputusanDistribusi.jsx`) — existing
- ✓ Status tracking with metrics and updates (`StatusDistribusi.jsx`) — existing
- ✓ Ranking/analysis with live computation and chart rendering (`AnalisisRanking.jsx`) — existing
- ✓ Reporting with CSV export and trend charts (`Laporan.jsx`) — existing
- ✓ Activity history with filtering and CSV export (`RiwayatAktivitas.jsx`) — existing
- ✓ Per-role dashboard branching with distinct widgets per role (`Dashboard.jsx`) — existing
- ✓ Empty states via shared `EmptyState` component — used consistently across nearly all pages — existing
- ✓ Auth flow (login/register/logout) against the in-app account store — existing, intentionally kept client-only for this milestone
- ✓ Admin can add, edit, and delete cities, and set TBS stock, through a dedicated "Manajemen Kota" page — Phase 1, including cascade-rename across `permintaan`/`keputusan`/`riwayatKeputusan` and block-delete-if-referenced (no silent data-integrity gaps)
- ✓ `Laporan.jsx` shows role-differentiated content for Manajer Distribusi (decision/ranking-focused: Riwayat Keputusan + Tren Permintaan) vs Tim Logistik (status/delivery-focused: Distribusi Aktif + Status Pengiriman chart) — Phase 2, distinct data sources and CSV exports per role, not just a relabeled heading
- ✓ Login has field-level inline validation (independent username/password/role errors, replacing one generic message) — Phase 3
- ✓ `StatusDistribusi.jsx`'s armada/ETA fields require a value before saving "Dalam Pengiriman", with inline error messages — Phase 3
- ✓ `InputData.jsx` shows an explanatory message instead of an empty dropdown when no cities are configured — Phase 3
- ✓ `Register.jsx` generates account IDs via `store.getNextAkunId()` (same `getNextId` convention as the rest of `store.js`), instead of `Date.now()` — Phase 3
- ✓ Landing, Login, and Register pages are rebuilt to use the existing shared component library (`Tombol`, `Card`, `IkonDaun`, design tokens) instead of ad-hoc inline styles — Phase 4, with zero edits to the shared component source files and no visual/layout regression on other Tombol/Card-consuming pages (structurally verified; see 04-VERIFICATION.md's Pixel-Confirmation Advisory for the one disclosed tooling limitation)
- ✓ Full pass across every existing page confirming: complete UI, correct CRUD via store, correct role-based data, working navigation, inline validation, empty states, loading states, consistent design system, and no-reload data flow — Phase 5, audited all 12 pages, fixed 4 additional gaps found (Dashboard armada/ETA validation parity with StatusDistribusi, KeputusanDistribusi duplicate-decision guard parity with Dashboard, Register per-field error clearing parity with Login, store.js updateKota duplicate-name guard parity with tambahKota); 2 non-functional Login.jsx controls ("Lupa Password?", "Ingat saya") explicitly reviewed and accepted as-is (deferred to a planned future backend milestone / harmless placeholder, respectively — not silently dropped)

### Active

*(none — all v1.0 requirements complete)*

### Out of Scope

- Real backend/database/API — staying client-only (localStorage) for this milestone; revisit only if this becomes more than a school demo
- Real authentication (hashed passwords, server-side authorization) — current plaintext/localStorage auth is acceptable for a single-browser demo
- Multi-user / concurrent-session support — inherent to the client-only architecture; out of scope until a backend exists
- New features beyond completing what's already scoped (no new pages, no new roles, no new domains of functionality)

## Context

- Existing codebase fully mapped in `.planning/codebase/` (STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md) — read these before planning any phase.
- A full page-by-page audit against the completeness checklist was performed before this PROJECT.md was written; results are folded into Active requirements above. Routing is functionally correct but architecturally fragile (4 interlocking `useEffect`s in `App.jsx`) — flagged in CONCERNS.md, not in scope to refactor unless it blocks a requirement above.
- No automated tests exist anywhere in the repo. Given "clean code structure" is part of the production-quality bar, phases touching `src/utils/distribusi.js` / `forecast.js` should consider adding tests, but this wasn't requested as an explicit requirement — raise it during roadmap/phase planning if it fits.
- Indonesian domain terminology is used throughout (`permintaan` = request, `keputusan` = decision, `kota` = city, `distribusi` = distribution) — match this convention in any new code.

## Constraints

- **Tech stack**: React 18 + Vite 7, no new frameworks/libraries beyond what's already in `package.json` unless a requirement clearly needs one — keeps the app simple and consistent with its current footprint
- **Persistence**: `window.localStorage` via the existing `src/store.js` singleton — no real backend this milestone
- **Design system**: Reuse existing shared components (`src/components/*`) and tokens (`src/tokens.css`) rather than introducing new styling approaches — required to fix the design-consistency gap, not optional
- **Scope**: Completion and polish of existing functionality only — no new pages, roles, or business domains

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay client-only (localStorage), no real backend | School project; "production-ready" means polish and completeness, not infrastructure | — Pending |
| Build Admin city/stock management UI | Store methods already exist but have zero UI — a real functional gap, not just polish | ✓ Good — Phase 1 complete, all 6 ADMIN-* requirements verified |
| Rebuild Landing/Login/Register on the shared component library | Directly fixes the design-consistency gap found in the page audit | ✓ Good — Phase 4 complete, all 4 DESIGN-* requirements verified |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-24 after Phase 5 completion (v1.0 milestone complete)*
