# Switera

## What This Is

Switera is a React SPA for managing the distribution of TBS (kelapa sawit / palm fruit) stock across cities — covering requests, ranking-based distribution decisions, status tracking, reporting, and activity history, with three distinct roles (Admin, Manajer Distribusi, Tim Logistik). It's a school project that demos at production quality: complete features, proper validation, consistent UI, and clean code. v1.0 shipped as a client-only (`localStorage`-backed) demo; v2.0 is migrating it onto a real Node.js/Express/PostgreSQL backend with server-side auth and genuine multi-user support.

## Core Value

The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

## Current Milestone: v2.0 Backend & Multi-User Migration

**Goal:** Migrate Switera off `localStorage` onto a real backend (Node.js + Express + PostgreSQL via Prisma) with server-side authentication, enabling genuine multi-user concurrent access while preserving the existing "instant reflect, no refresh" UX and the v1.0 design system unchanged.

**Target features:**
- REST API covering every data domain currently in `store.js` (akun, daftarKota, permintaan, keputusan, riwayatKeputusan/activityLog)
- Server-side auth: bcrypt password hashing, JWT-based sessions, replacing plaintext `localStorage` auth
- Real multi-user concurrent support — multiple users across all 3 roles logged in simultaneously see consistent, synchronized data
- Frontend (React) adapted to call the new API instead of reading/writing local store state directly
- Data-sync mechanism decision (polling vs WebSocket) to preserve the no-manual-refresh UX across multiple clients — to be resolved during roadmap/phase planning

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

- [ ] All data domains (akun, daftarKota, permintaan, keputusan, riwayatKeputusan) migrated from `localStorage` to a real backend (Node.js + Express + PostgreSQL + Prisma)
- [ ] Server-side authentication replacing plaintext `localStorage` auth (bcrypt password hashing, JWT-based sessions)
- [ ] True multi-user concurrent support — multiple users across all 3 roles can log in simultaneously and see consistent, synchronized data
- [ ] Frontend (React) adapted to call the new REST API instead of reading/writing `store.js`'s local state directly, preserving the existing "instant reflect, no refresh" UX

### Out of Scope

- New UI/visual design or design-system changes — the v1.0 design system carries over unchanged; this milestone is backend/data-layer only
- New pages, roles, or business domains beyond what already exists
- CI/CD pipeline or production deployment infrastructure — school project scope; local run (`npm run dev` + backend dev server) is sufficient
- Horizontal scaling, caching layers, microservices — unnecessary complexity at this scale
- Mobile app / native clients

## Context

- Existing codebase fully mapped in `.planning/codebase/` (STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md) — read these before planning any phase.
- v1.0 shipped 2026-06-24: 5 phases, 9 plans, 25 tasks, ~11,300 LOC (JS/JSX). Full accomplishment list in `.planning/MILESTONES.md`.
- Routing is functionally correct but architecturally fragile (4 interlocking `useEffect`s in `App.jsx`) — flagged in CONCERNS.md, not yet addressed; revisit if it blocks a v2.0 requirement.
- No automated tests exist anywhere in the repo (TEST-01, deferred to v2 — see REQUIREMENTS.md history in `.planning/milestones/v1.0-REQUIREMENTS.md`).
- Known, deliberately-accepted gaps carried out of v1.0 (none are bugs — all explicitly reviewed and decided):
  - `Login.jsx`'s "Lupa Password?" link and "Ingat saya" checkbox remain non-functional — the former defers intentionally to a real backend (genuine password reset needs server-side infra); the latter is an accepted cosmetic placeholder.
  - DESIGN-04/Phase 5 visual-regression claims were verified structurally (build passes, byte-unchanged shared components) but never pixel-confirmed in a real browser — no `chromium-cli`/Playwright was available in the execution environment.
  - `store.setRoleAktif` is dead code (never called).
- Indonesian domain terminology is used throughout (`permintaan` = request, `keputusan` = decision, `kota` = city, `distribusi` = distribution) — match this convention in any new code.

## Constraints

- **Frontend tech stack**: React 18 + Vite 7 stay as-is; no rewrite of existing pages/components beyond what's needed to call the new API instead of `store.js` directly
- **Backend tech stack**: Node.js + Express + PostgreSQL via Prisma; JWT + bcrypt for auth — chosen for language consistency with the existing JS/JSX frontend and because the data model (kota/permintaan/keputusan/akun) is clearly relational
- **Design system**: No changes to `src/components/*` or `src/tokens.css` — the v1.0 design-system unification work is final; this milestone is backend/data-layer only
- **Scope**: Backend migration and multi-user support only — no new pages, roles, or business domains beyond what already exists

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay client-only (localStorage), no real backend for v1.0 | School project; "production-ready" means polish and completeness, not infrastructure | ✓ Good — shipped as scoped; real backend explicitly planned as next milestone |
| Build Admin city/stock management UI | Store methods already exist but have zero UI — a real functional gap, not just polish | ✓ Good — Phase 1 complete, all 6 ADMIN-* requirements verified |
| Rebuild Landing/Login/Register on the shared component library | Directly fixes the design-consistency gap found in the page audit | ✓ Good — Phase 4 complete, all 4 DESIGN-* requirements verified |
| Run code review/security audit/UI review inline (no subagent spawning) for Phases 4-5 | Token-efficiency preference — full multi-agent GSD pipeline is expensive for a well-scoped polish milestone | ✓ Good — all quality gates passed, no defects found post-ship |
| Accept structural (not pixel-level) verification for DESIGN-04/Phase 5 visual claims | No browser automation tooling (`chromium-cli`/Playwright) available in execution environment | ⚠️ Revisit — do one real manual browser pass before treating UI as fully signed off |
| Migrate to Node.js + Express + PostgreSQL + Prisma for v2.0 backend | Language consistency with existing JS frontend; relational data model fits SQL; simple enough for a school project timeline; user-recommended after considering BaaS (Supabase/Firebase) and other stacks (Django/Laravel) | — Pending |

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
*Last updated: 2026-06-24 after starting Milestone v2.0 (Backend & Multi-User Migration)*
