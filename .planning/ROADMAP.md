# Roadmap: Switera

## Overview

Switera is a functioning client-only React SPA; this milestone closes the gap between "works" and "feels complete and trustworthy end-to-end for every role." The journey starts with the one purely-additive functional gap (Admin city/stock CRUD has store methods but no UI), then fixes the cosmetic-but-real reporting gap (Laporan ignores the active role), then sweeps up the smaller validation/convention gaps, then unifies the auth/landing pages onto the shared design system, and finally closes with a full completeness audit across every page to catch anything the four targeted phases didn't.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Admin City & Stock Management** - Admin can manage cities and TBS stock through a real UI backed by existing store mutators (completed 2026-06-21)
- [ ] **Phase 2: Role-Differentiated Reporting** - Laporan shows genuinely different data for Manajer Distribusi vs Tim Logistik
- [ ] **Phase 3: Validation & Edge-Case Completion** - Login, StatusDistribusi, InputData, and Register close their remaining validation/convention gaps
- [ ] **Phase 4: Auth & Landing Design-System Unification** - Landing, Login, and Register run on the shared component library with no regressions elsewhere
- [ ] **Phase 5: Full Completeness Pass** - Every page is re-verified against the full completeness checklist and any residual gap is fixed

## Phase Details

### Phase 1: Admin City & Stock Management

**Goal**: Admin can fully manage the city list and TBS stock level through a dedicated page, with no silent data-integrity gaps
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06
**Success Criteria** (what must be TRUE):

  1. Admin can view a list of all cities with their current TBS capacity
  2. Admin can add a new city (name + capacity) via a form with inline validation, and a duplicate name shows an inline error instead of failing silently or crashing
  3. Admin can edit an existing city's name and capacity, and the change is reflected immediately everywhere that city is referenced
  4. Admin can delete a city, and if that city is already referenced by existing requests/decisions, the app takes an explicit, deliberate action (block, warn, or cascade) rather than leaving a silent dangling reference
  5. Admin can view and update the current TBS stock value, and the change is immediately visible to the recommendation engine and other pages that read it

**Plans**: 3/3 plans complete
**Wave 1**

- [x] 01-01-PLAN.md — Reachable Admin-only Manajemen Kota page: route/nav/icon registration, city list table (ADMIN-01), TBS stock summary card (ADMIN-05 read)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Add city with inline validation + duplicate-name inline error (ADMIN-02, ADMIN-06), capacity edit, TBS stock editor (ADMIN-05 write)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Store cascade-rename (D-02) + block-delete (D-01) and delete/rename UI (ADMIN-03 rename, ADMIN-04)

### Phase 2: Role-Differentiated Reporting

**Goal**: Laporan shows materially different, role-appropriate data instead of an identical report with a relabeled heading
**Mode:** mvp
**Depends on**: Nothing (independent of Phase 1)
**Requirements**: REPORT-01, REPORT-02, REPORT-03
**Success Criteria** (what must be TRUE):

  1. Manajer Distribusi sees decision/ranking-focused data on the Laporan page
  2. Tim Logistik sees status/delivery-focused data on the Laporan page
  3. Switching the active role changes the underlying data shown on Laporan, not just a heading or label

**Plans**: TBD

### Phase 3: Validation & Edge-Case Completion

**Goal**: Remaining form-validation and convention gaps are closed so no page accepts invalid input silently or diverges from the store's ID conventions
**Mode:** mvp
**Depends on**: Nothing (independent of Phases 1, 2, 4)
**Requirements**: VALID-01, VALID-02, VALID-03, VALID-04
**Success Criteria** (what must be TRUE):

  1. Login shows field-level inline errors for username and password instead of one generic error message
  2. StatusDistribusi's armada and ETA fields require a value before saving and show inline error messages when left blank
  3. InputData shows a clear explanatory message when no cities are configured, instead of presenting an empty, unexplained dropdown
  4. New accounts created via Register receive IDs using the same `getNextId` convention as the rest of `store.js`, instead of `Date.now()`

**Plans**: TBD

### Phase 4: Auth & Landing Design-System Unification

**Goal**: Landing, Login, and Register feel like the same product as the rest of the app, built on the shared component library instead of one-off inline styles
**Mode:** mvp
**Depends on**: Nothing (independent of Phases 1-3; sequenced here for perception-critical priority, not technical necessity)
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04
**Success Criteria** (what must be TRUE):

  1. Landing page renders using `Tombol`, `Card`, `IkonDaun`, and design tokens, with the same content and layout intent as before
  2. Login page renders using the shared component library instead of inline styles
  3. Register page renders using the shared component library instead of inline styles
  4. Every other page that consumes a shared component touched during this work renders with no visual or layout regression

**Plans**: TBD
**UI hint**: yes

### Phase 5: Full Completeness Pass

**Goal**: Every existing page in the app holds up against the full completeness checklist, with any gap beyond what Phases 1-4 already fixed identified and closed
**Mode:** mvp
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: AUDIT-01
**Success Criteria** (what must be TRUE):

  1. Every page has been re-checked against: complete UI, correct CRUD via store, correct role-based data, working navigation, inline validation, empty states, loading states, consistent design system, and no-reload data flow
  2. Any additional gap found during this pass (beyond ADMIN/REPORT/VALID/DESIGN) is fixed, not just logged
  3. No page in the app exhibits a stale-after-mutation or manual-refresh-required data flow

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
(Phases 1-4 have no cross-dependencies and could be parallelized if execution mode allows; Phase 5 depends on all four.)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Admin City & Stock Management | 3/3 | Complete   | 2026-06-21 |
| 2. Role-Differentiated Reporting | 0/TBD | Not started | - |
| 3. Validation & Edge-Case Completion | 0/TBD | Not started | - |
| 4. Auth & Landing Design-System Unification | 0/TBD | Not started | - |
| 5. Full Completeness Pass | 0/TBD | Not started | - |
