# Project Research Summary

**Project:** Switera
**Domain:** Client-only React SPA completion/polish (role-based logistics/distribution decision-support admin tool)
**Researched:** 2026-06-21
**Confidence:** HIGH

## Executive Summary

This is a completion/polish milestone on an already-functional app, not a new build — and every research dimension converged on the same conclusion: the codebase already contains a working, idiomatic precedent for every gap identified in the page audit. The store's CRUD mutators for cities/stock (`tambahKota`, `updateKota`, `hapusKota`, `setStokTbs`) already exist and follow a consistent contract; `ManajemenData.jsx` is the exact UI shape to copy for the new Admin screen; `Dashboard.jsx`'s `contentByRole` dispatcher is the exact pattern to copy for fixing `Laporan.jsx`'s unused `roleAktif`; and `InputData.jsx`'s `validate()` pattern is the exact convention to extend into `Login.jsx` and `StatusDistribusi.jsx`.

The recommended approach is therefore "compose existing primitives, add zero new dependencies, zero new store methods, zero new architectural patterns." All four researchers independently flagged the same risk: this milestone's language ("production-ready," "feels complete") creates real pressure to scope-creep into things explicitly marked Out of Scope in PROJECT.md — a router migration, a new design-system library, real backend/auth, or a generic report builder. The single technical decision research could not resolve and flags for phase planning: what happens when an Admin renames or deletes a city that's already referenced by existing `permintaan`/`keputusan` records (block, cascade, or warn).

## Key Findings

### Recommended Stack

No new dependencies are recommended anywhere. `react`, `react-dom`, `chart.js`/`react-chartjs-2`, and `leaflet` already in `package.json` are sufficient for every requirement in this milestone.

**Core technologies (unchanged):**
- React 18 + Vite 7 — already in place, no version changes needed
- Existing component library (`src/components/*`, `src/tokens.css`) — already mature (18 components), sufficient for the Landing/Login/Register rebuild
- Existing store (`src/store.js`) — already has the mutators needed for cities/stock CRUD

**Explicitly rejected additions:** react-hook-form, Zod/Yup, any CSS-in-JS or Tailwind, any component library (MUI/Chakra/shadcn), Zustand/Redux — all would introduce a second idiom for problems the existing code already solves at this scale (2-5 field forms, ~10-page app).

### Expected Features

**Must have (table stakes) — all already scoped as Active requirements:**
- Admin CRUD for cities/stock, composed from existing `ManajemenData.jsx` pattern + existing store methods
- Role-differentiated `Laporan.jsx` content (Manajer Distribusi sees decisions/ranking data, Tim Logistik sees status/delivery data) — a wiring fix, not new data modeling
- Inline field-level validation on Login and StatusDistribusi armada/ETA, matching the `validate()` pattern already used twice in the codebase
- Landing/Login/Register rebuilt onto existing shared components instead of inline styles

**Differentiator (not required but raised by research):**
- Referential-integrity handling when deleting/renaming a city already in use — flagged as needing an explicit product decision, not solved by copying the existing CRUD pattern verbatim

**Anti-features (explicitly out of scope per PROJECT.md, confirmed by research):**
- Bulk CSV import for cities, soft-delete/archive for cities, a generic configurable report builder, any schema-validation library, real backend/auth, router migration

### Architecture Approach

No new architectural patterns are needed. The new Admin CRUD page is a new page file + 3 additive registrations in `App.jsx` (pageRegistry, pathByPage, menuByRole.Admin) — none of which touch the four fragile route/role `useEffect`s already flagged in CONCERNS.md, since those key off the registries generically rather than hardcoded page names. The real risk during this addition is a silent wrong-page fallback (if a page key is added to `menuByRole` but not `pageRegistry`, `App.jsx` silently renders Dashboard instead of erroring) — not a crash.

**Major components (all existing, being extended not replaced):**
1. `src/store.js` — already has the mutators; no changes needed beyond consuming them from a new page
2. New `ManajemenKota.jsx` (or similar) page — copies `ManajemenData.jsx`'s snapshot-subscribe + table + modal shape
3. `Laporan.jsx` — gets a `contentByRole` dispatcher copied from `Dashboard.jsx`'s existing pattern

### Critical Pitfalls

1. **Scope drift on the auth/landing rebuild** — "use the shared component library" silently becoming a visual redesign, or shared-component edits regressing other pages that already consume `Tombol`/`Card`/`Modal`. Prevention: treat this as swap-in-place (same content/layout, different implementation), and explicitly regression-check every other page that imports any shared component touched during this work.
2. **"Production-ready" language nudging toward out-of-scope architectural refactors** (router migration, Immer/structural-sharing rewrite of the store, splitting monolithic files) — none of these are required by any Active requirement. Prevention: every phase plan should cite the specific PROJECT.md Active-requirement bullet it addresses.
3. **New CRUD UI not matching the store's real conventions** — cities are keyed by `nama` (string), not a generated ID via `getNextId`; duplicate-name validation is a thrown `Error` the UI must catch; `recordActivity` is already called inside the mutators (don't double-log from the new page).
4. **Laporan role-differentiation being cosmetic only** (a relabeled heading) rather than materially different data per role — the fix must mirror `Dashboard.jsx`'s real per-role content branching, not just change a title string.
5. **City deletion/rename with existing references** — `permintaan`/`keputusan` records reference cities by name with no cascade logic today; this needs an explicit block/cascade/warn decision during phase planning, not a silent gap left in the shipped feature.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Admin City & Stock Management
**Rationale:** Purely additive (new page + 3-line router registration), no dependency on other phases, and unblocks the `InputData.jsx` empty-state requirement (which needs `daftarKota` to actually be editable to meaningfully test the empty case)
**Delivers:** New Admin-only page for city/stock CRUD, composed from existing `ManajemenData.jsx` pattern and existing store mutators
**Addresses:** Active requirement — "Admin can add, edit, and delete cities, and set TBS stock"
**Avoids:** Pitfall #3 (store-convention mismatch) and #5 (referential integrity) — both must be resolved explicitly in this phase

### Phase 2: Role-Differentiated Reporting
**Rationale:** Isolated to one file (`Laporan.jsx`), zero router/store risk, can run independently of Phase 1
**Delivers:** `Laporan.jsx` showing genuinely different content for Manajer Distribusi vs Tim Logistik via a `contentByRole` dispatcher
**Implements:** The same role-dispatcher pattern already proven in `Dashboard.jsx`
**Avoids:** Pitfall #4 (cosmetic-only differentiation)

### Phase 3: Validation & Edge-Case Completion
**Rationale:** Small, independent fixes that don't depend on Phase 1 or 2
**Delivers:** Field-level validation on Login and StatusDistribusi (armada/ETA), empty-state warning in InputData when no cities exist, ID-generation fix in Register.jsx
**Uses:** The existing `validate()` per-field-error-map convention from `InputData.jsx`/`ManajemenData.jsx`

### Phase 4: Auth & Landing Design-System Unification
**Rationale:** Architecturally unrelated to Phases 1-3 (component-library adoption, not store/router) — no ordering dependency, but research flags it as a perception-critical phase since an inconsistent auth/landing experience undercuts the Core Value even if everything else is fixed. Worth not leaving last in execution priority even though it has no technical dependency.
**Delivers:** Landing, Login, Register rebuilt on `Tombol`/`Card`/`IkonDaun`/tokens instead of inline styles, with regression verification across every other page that consumes the touched shared components
**Avoids:** Pitfall #1 (scope drift into redesign) and #2 (shared-component regression)

### Phase Ordering Rationale

- Phase 1 first because it's the only phase that unblocks another requirement (InputData's empty state needs editable cities to test against)
- Phases 1-3 have no cross-dependencies and could be parallelized if execution mode allows
- Phase 4 is sequenced last in this list only for narrative clarity — it has no technical blocker and could run in parallel with any other phase; flag this explicitly during roadmap creation rather than defaulting to strict sequential order

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** The city rename/delete-with-references decision (block/cascade/warn) is a product decision, not resolved by this research — needs explicit discussion during `/gsd-discuss-phase` for this phase.

Phases with standard patterns (skip research-phase, proceed directly to planning):
- **Phase 2:** Direct precedent already fully read and verified (`Dashboard.jsx`'s dispatcher)
- **Phase 3:** Direct precedent already fully read and verified (`InputData.jsx`'s validate pattern)
- **Phase 4:** Direct precedent already exists (`AuthShared.jsx`, though it needs to move from inline-style-with-tokens to actual shared-component usage)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified directly against working code in this repo; general ecosystem claims (e.g. exact bundle sizes) are MEDIUM since WebSearch/Bash were unavailable to the research agents this session, but the recommendation rests on architectural fit, not those numbers |
| Features | MEDIUM-HIGH | Table-stakes findings grounded directly in existing working code; exact per-role Laporan field selection is a judgment call for phase planning |
| Architecture | HIGH | Every finding traced to specific files/lines in this exact repo; no external research was needed since the question was about conforming to an already-mapped local codebase |
| Pitfalls | HIGH | Grounded directly in `store.js`, `AuthShared.jsx`, PROJECT.md, and CONCERNS.md — not generic web-dev advice |

**Overall confidence:** HIGH

### Gaps to Address

- City rename/delete referential-integrity behavior (block/cascade/warn) — resolve explicitly during Phase 1 discussion, not left implicit
- Exact field/metric selection for each role's Laporan fork — resolve during Phase 2 discussion against `StatusDistribusi.jsx`'s and `KeputusanDistribusi.jsx`'s actual data shapes
- Whether the recommendation engine in `utils/distribusi.js` reads `getStokTbs()` directly or via a passed argument — confirm during Phase 1 so the new stock editor doesn't bypass whatever read path it uses
- Whether CSV injection sanitization is needed for city names now that they become user-entered for the first time (previously fixed seed data) — flagged as a decision point for Phase 1, not a confirmed vulnerability

## Sources

### Primary (HIGH confidence)
- Direct source reads: `src/store.js`, `src/App.jsx`, `src/pages/Dashboard.jsx`, `src/pages/ManajemenData.jsx`, `src/pages/InputData.jsx`, `src/pages/Laporan.jsx`, `src/components/auth/AuthShared.jsx`, `src/utils/navigation.js`
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `CONVENTIONS.md` (this project's own codebase map)
- `.planning/PROJECT.md` (Active requirements, Out of Scope, Constraints)

### Secondary (MEDIUM confidence)
- General ecosystem conventions for lightweight form validation and admin-dashboard table-stakes features — used only as corroboration, not as the sole basis for any recommendation, since live WebSearch was unavailable to the research agents this session

### Tertiary (LOW confidence)
- None — no claims rest solely on unverifiable or single-source input

---
*Research completed: 2026-06-21*
*Ready for roadmap: yes*
