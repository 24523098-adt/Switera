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

### Active

- [ ] Admin can add, edit, and delete cities, and set TBS stock, through a real UI (store methods `tambahKota`/`updateKota`/`hapusKota`/`setStokTbs` already exist but have no page)
- [ ] `Laporan.jsx` shows role-differentiated content for Manajer Distribusi vs Tim Logistik instead of an identical report (currently computes `roleAktif` but never uses it)
- [ ] Landing, Login, and Register pages are rebuilt to use the existing shared component library (`Tombol`, `Card`, `IkonDaun`, design tokens) instead of 100% ad-hoc inline styles
- [ ] Login has field-level inline validation (currently a single generic error message)
- [ ] `StatusDistribusi.jsx`'s armada/ETA fields have inline validation (currently accept blank values silently)
- [ ] `InputData.jsx` shows a warning/empty-state when no cities are configured, instead of an empty dropdown
- [ ] `Register.jsx` generates account IDs using the same `getNextId` convention as the rest of `store.js`, instead of `Date.now()`
- [ ] Full pass across every existing page confirming: complete UI, correct CRUD via store, correct role-based data, working navigation, inline validation, empty states, loading states, consistent design system, and no-reload data flow — fixing any additional gaps found beyond the ones already identified

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
| Build Admin city/stock management UI | Store methods already exist but have zero UI — a real functional gap, not just polish | — Pending |
| Rebuild Landing/Login/Register on the shared component library | Directly fixes the design-consistency gap found in the page audit | — Pending |

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
*Last updated: 2026-06-21 after initialization*
