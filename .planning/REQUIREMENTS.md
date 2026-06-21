# Requirements: Switera

**Defined:** 2026-06-21
**Core Value:** The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

## v1 Requirements

Requirements for this completion/polish milestone. Each maps to roadmap phases.

### Admin City & Stock Management

- [ ] **ADMIN-01**: Admin can view a list of all cities with their TBS capacity
- [ ] **ADMIN-02**: Admin can add a new city with a name and capacity, via a form with inline validation
- [ ] **ADMIN-03**: Admin can edit an existing city's name and capacity
- [ ] **ADMIN-04**: Admin can delete a city, with an explicit, deliberate behavior (block/warn/cascade) for cities already referenced by existing requests or decisions — not a silent gap
- [ ] **ADMIN-05**: Admin can view and update the current TBS stock value
- [ ] **ADMIN-06**: Adding a duplicate city name shows an inline error instead of failing silently or crashing

### Role-Differentiated Reporting

- [ ] **REPORT-01**: Manajer Distribusi sees decision/ranking-focused data on the Laporan page
- [ ] **REPORT-02**: Tim Logistik sees status/delivery-focused data on the Laporan page
- [ ] **REPORT-03**: The two role views are materially different in underlying data shown, not just a relabeled heading

### Form Validation & Completeness

- [ ] **VALID-01**: Login shows field-level inline errors (username/password) instead of one generic error message
- [ ] **VALID-02**: StatusDistribusi's armada and ETA fields require a value before saving, with inline error messages
- [ ] **VALID-03**: InputData shows a clear message when no cities are configured, instead of an empty dropdown with no explanation
- [ ] **VALID-04**: New accounts created via Register get IDs following the same `getNextId` convention used elsewhere in the store, instead of `Date.now()`

### Design System Consistency

- [ ] **DESIGN-01**: Landing page is rebuilt on the shared component library (`Tombol`, `Card`, `IkonDaun`, design tokens) instead of one-off inline styles
- [ ] **DESIGN-02**: Login page is rebuilt on the shared component library instead of one-off inline styles
- [ ] **DESIGN-03**: Register page is rebuilt on the shared component library instead of one-off inline styles
- [ ] **DESIGN-04**: No visual or layout regression on any other page that consumes a shared component touched during this work

### Full Completeness Pass

- [ ] **AUDIT-01**: Every existing page is re-verified against the full completeness checklist (CRUD via store, role-correct data, working navigation, inline validation, empty states, loading states, design consistency, no-reload data flow), and any additional gap found beyond ADMIN/REPORT/VALID/DESIGN above is fixed

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Quality Infrastructure

- **TEST-01**: Automated tests for `src/utils/distribusi.js` and `src/utils/forecast.js` (core decision-support calculations) — raised during research as worth doing given "clean code structure" is part of the production-quality bar, but not committed as a v1 requirement
- **SEC-01**: CSV injection sanitization review for city names, now that they become user-entered for the first time (previously fixed seed data) — flagged as a decision point during research, deferred unless ADMIN-04 work surfaces it as urgent

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real backend/database/API | School project staying client-only (localStorage) for this milestone |
| Real authentication (hashed passwords, server-side authorization) | Current plaintext/localStorage auth is acceptable for a single-browser demo |
| Multi-user / concurrent-session support | Inherent to the client-only architecture; requires a backend to be meaningful |
| Bulk CSV import for cities | Anti-feature — cities are a small, manually-managed reference list, not bulk data |
| Soft-delete / archive for cities | Anti-feature — adds a data-modeling concept not needed at this scale |
| Generic configurable report builder | Anti-feature — Laporan needs two fixed role-based views, not a builder |
| New pages, roles, or business domains | This milestone is completion/polish of existing scope, not expansion |
| Router migration (e.g. to react-router) | Architecturally unrelated to any v1 requirement; existing manual router works, just don't destabilize it |
| Store rewrite (e.g. Immer, Zustand) | No v1 requirement needs it; existing store already has the mutators required |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ADMIN-01 | Phase 1 | Pending |
| ADMIN-02 | Phase 1 | Pending |
| ADMIN-03 | Phase 1 | Pending |
| ADMIN-04 | Phase 1 | Pending |
| ADMIN-05 | Phase 1 | Pending |
| ADMIN-06 | Phase 1 | Pending |
| REPORT-01 | Phase 2 | Pending |
| REPORT-02 | Phase 2 | Pending |
| REPORT-03 | Phase 2 | Pending |
| VALID-01 | Phase 3 | Pending |
| VALID-02 | Phase 3 | Pending |
| VALID-03 | Phase 3 | Pending |
| VALID-04 | Phase 3 | Pending |
| DESIGN-01 | Phase 4 | Pending |
| DESIGN-02 | Phase 4 | Pending |
| DESIGN-03 | Phase 4 | Pending |
| DESIGN-04 | Phase 4 | Pending |
| AUDIT-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18/18
- Unmapped: 0

---
*Requirements defined: 2026-06-21*
*Last updated: 2026-06-21 after roadmap creation (18/18 requirements mapped across 5 phases)*
