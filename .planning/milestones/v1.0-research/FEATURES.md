# Feature Research

**Domain:** Role-based admin / operations decision-support dashboard (logistics & distribution allocation)
**Researched:** 2026-06-21
**Confidence:** MEDIUM-HIGH (codebase precedent = HIGH confidence anchor; general admin-UX conventions = MEDIUM confidence, standard industry practice not freshly re-verified this session — see Sources)

## Context Note

This research is scoped tightly to the four open gaps in `.planning/PROJECT.md`: **Admin city/stock CRUD UI**, **role-differentiated `Laporan.jsx`**, **design-system consistency on auth/landing pages**, and **inline validation / empty-state polish**. Switera already has a mature, internally-consistent admin pattern (`ManajemenData.jsx` for permintaan CRUD, `Tabel.jsx`, `EmptyState.jsx`, `Modal.jsx`, `Toast.jsx`). The strongest, highest-confidence source for "what table stakes look like here" is **the app's own existing CRUD screen**, not an external product. External admin-dashboard conventions (Refine/React-Admin/Ant Design Pro patterns, Nielsen Norman Group forms/validation guidance) are used to confirm Switera's existing pattern already clears the bar, and to flag the handful of things the *new* city/stock screen must not skip relative to it.

## Feature Landscape

### Table Stakes (Users Expect These)

Features a real admin reference-data screen and a real role-scoped report are expected to have at minimum. Missing any of these makes the screen feel like a prototype, not "production-quality."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full CRUD (create, read, update, delete) on cities, not just create | Reference data (locations, capacity) always drifts — names get typo-fixed, capacity gets renegotiated, obsolete cities get retired. A view/add-only screen is incomplete by definition. | LOW (store methods `tambahKota`/`updateKota`/`hapusKota` already exist) | Mirror `ManajemenData.jsx`: table + "Edit" opens a `Modal` with a form, "Hapus" opens a confirm `Modal`, not a bare `window.confirm`. |
| List view in a sortable, paginated table | Any list of named entities beyond ~10 rows needs sort/scan; this is exactly what `Tabel.jsx` already provides. | LOW (reuse `Tabel`) | Columns: nama kota, kapasitas, stok TBS (if surfaced per-city), aksi. Don't build a bespoke list — `Tabel` is the established convention. |
| Inline field-level validation, not a single generic error | The codebase already proves this pattern in `InputData.jsx`/`ManajemenData.jsx` (`validate()` returning a per-field error map, rendered directly under each field). A single toast/banner error for a multi-field form is a known regression in this app (Login is explicitly called out for this in PROJECT.md). | LOW (copy the existing `validateEditForm` pattern) | Validate on every keystroke/change like `handleEditChange`, not only on submit — this is the existing convention and users will notice if a new form behaves differently. |
| Duplicate / uniqueness prevention surfaced as a field error | `tambahKota` already throws `"Kota dengan nama tersebut sudah ada."` server-side (store-side); the UI must catch this and put it under the `nama` field, not let it bubble as an unhandled error or a generic toast. | LOW | Same shape as the existing `hasPermintaanDuplikat` pre-check in `InputData.jsx` — check before submit so the field shows red before the user even clicks "Simpan." |
| Numeric capacity/stock validation (non-negative, numeric, not blank) | `kapasitas` and `stokTbs` feed downstream allocation math (`distribusi.js`/`forecast.js`); a blank or negative capacity silently breaks ranking/recommendation calculations elsewhere in the app. | LOW | Same pattern as `jumlahPermintaan` validation already in `InputData.jsx` (`<= 0` rejected). |
| Delete confirmation with consequence-aware messaging | Deleting a city that has active `permintaan`/`keputusan` referencing it is destructive in a way deleting an isolated row isn't — silently orphaning records is a real bug class for reference-data CRUD. | MEDIUM | At minimum: confirm modal naming what's at stake ("X permintaan aktif menggunakan kota ini"); decide explicitly whether delete is blocked, cascades, or just warns — don't leave this undefined. |
| Undo-via-toast on delete (matching existing UX) | `ManajemenData.jsx`'s `confirmDelete` already gives the established UX contract: delete now, "Urungkan" action in the toast restores it. Users of this app will expect identical behavior on the new screen. | LOW (already proven, just reuse `showToast({ action: ... })`) | If skipped here, the new screen feels inconsistent with the one CRUD screen the user already knows. |
| Empty state with actionable next step, not a bare blank table | `EmptyState.jsx` already exists and is used "consistently across nearly all pages" per PROJECT.md. A list of cities with zero rows (fresh install / all deleted) must render `EmptyState`, ideally with a CTA into the add-city form (`aksi` prop already supports this). | LOW | This directly closes the related Active requirement: `InputData.jsx` also needs this same empty-state-when-no-cities treatment — these two requirements share one root cause and one fix shape. |
| Search/filter on the list when rows exceed a handful | `ManajemenData.jsx` already has a keyword search bar in its `PageHeader`. Cities list will likely stay small, but if it's expected to scale past ~15-20, a filter is a one-line addition reusing the existing search-bar pattern. | LOW | Optional if city count realistically stays under ~15-20; still cheap to include for consistency. |
| Role-scoped data on a shared report screen reflects role, not just role-flavored copy | The requirement explicitly says Manajer Distribusi and Tim Logistik currently see an *identical* report despite each having a distinct operational concern (Manajer = decisions/allocation outcomes; Tim Logistik = execution/status/fleet). Showing the same tables/charts with a different page title is not role-differentiation — it's table stakes that the *data itself* changes. | MEDIUM | `Laporan.jsx` already computes `roleAktif` and ignores it — the gap is wiring existing data slices, not building new ones. |
| Each role's report surfaces metrics that role already owns elsewhere in the app | Manajer Distribusi's other screens (`AnalisisRanking.jsx`, `KeputusanDistribusi.jsx`) center on ranking/allocation outcomes; Tim Logistik's other screen (`StatusDistribusi.jsx`) centers on delivery/fleet/ETA status. The report for each role should be a *summary/trend view of metrics that role already works with*, not a new invented dataset. | MEDIUM | Cheapest correct shape: Manajer's Laporan emphasizes `riwayatKeputusan` (decision outcomes, approval/cancellation trends, volume by city); Tim Logistik's emphasizes delivery/status-derived metrics (on-time vs delayed, armada utilization) — both already exist in `StatusDistribusi.jsx`'s data, just not surfaced here. |
| CSV export still works per-role | `Laporan.jsx` already has `handleExportCsv`; once content forks by role, the exported columns must match what's on screen for that role — an export that ignores the role split would be a regression, not a fix. | LOW | Make the CSV column set a function of `roleAktif`, same as the table content. |
| Empty state per role-specific section | If a role's new slice of data happens to be empty (e.g., Tim Logistik has no status updates yet this period), that section needs its own `EmptyState`, not a blank chart — same convention already used elsewhere in `Laporan.jsx` (`noData` check). | LOW | Extend the existing `noData` pattern per-section rather than one global flag once there are two different data shapes. |
| Loading state during persisted-store reads that aren't instant (CSV import, chart render) | The codebase already does this for chart rendering in `Laporan.jsx` (`SkeletonChart` while Chart.js lazy-loads) and for form submission (`isSaving` in `InputData.jsx`). Any new screen reading/writing data with a perceptible delay should follow the same skeleton/disabled-button convention. | LOW | City/stock CRUD against `localStorage` is synchronous and near-instant — a loading state isn't strictly needed there, but the *pattern* must not regress on pages that do have a delay (CSV import, chart render). |
| Consistent design tokens/components on Login/Register/Landing | Already an explicit Active requirement — flagged here because it's adjacent: once Admin's new city/stock screen and the role-aware Laporan exist, an inconsistent auth/landing experience undercuts the same "feels complete and trustworthy" Core Value bar. | MEDIUM | Use `Tombol`, `Card`, `IkonDaun`, and `tokens.css` — not new ad-hoc inline style objects — per the existing Active requirement and Constraints in PROJECT.md. |

### Differentiators (Competitive Advantage)

These aren't required to close the stated gaps, but they're natural, low-cost extensions of the table-stakes work above that would make Switera feel more polished than a typical school CRUD demo. Only pursue if there's room after the Active requirements are done — they are explicitly **not required** by PROJECT.md's "no new features beyond completing what's already scoped."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Inline quick-edit on capacity/stock cells (like the existing `jumlah_permintaan` inline edit in `ManajemenData.jsx`) | Lets Admin nudge a number without opening a modal — already proven UX in this exact codebase. | LOW | Pure reuse of the existing `inlineEditingId`/`inlineValue` pattern; cheap to add once the modal-based CRUD exists. |
| Per-city stock/capacity utilization bar in the cities table (e.g., reuse `ProgressBar.jsx`) | Turns a flat number into an at-a-glance signal ("this city is near capacity") consistent with `MetricCard`/`ProgressBar` already used on `Dashboard.jsx`. | LOW | Cosmetic enhancement on top of table-stakes CRUD; not required for completeness. |
| Role-aware report period comparison (this period vs last period delta) | Both roles already see period pills (`minggu-ini`/`bulan-ini`); a "+12% vs last week" style delta is a natural next step once the data is already being sliced per role. | MEDIUM | Would touch chart/metric logic meaningfully — bigger lift than the table-stakes fork, defer unless time allows. |
| Cross-link from a Laporan row to its source decision/status record | E.g. clicking a row in Manajer's report jumps to `KeputusanDistribusi.jsx` filtered to that decision. | MEDIUM | Nice traceability touch, not expected for a report screen to be considered "complete." |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Bulk CSV import for cities (mirroring `InputData.jsx`'s permintaan CSV import) | "Symmetry" with the existing import feature, looks like more complete admin tooling | Cities are a small, slow-changing reference list (a handful of named locations), not a high-volume transactional dataset like permintaan. Bulk import adds parsing/validation/duplicate-merge complexity for a screen that will realistically see single-row edits. Out of scope per PROJECT.md ("no new features beyond completing what's already scoped"). | Single-row add/edit modal, same shape as `ManajemenData.jsx`'s edit modal. |
| Soft-delete / archive instead of hard delete for cities | Feels "safer," avoids data loss anxiety | Adds a new state dimension (`archived: true/false`) to every downstream consumer of `daftarKota` (`InputData.jsx` dropdown, ranking, recommendation engine) that doesn't currently filter for it — a new cross-cutting concern, not a UI polish task, and explicitly out of scope ("no new features beyond completing what's already scoped"). | Hard delete with a clear confirm modal stating consequences, plus the existing undo-toast pattern as the safety net (consistent with how `removePermintaan` already works). |
| A fully generic, configurable "report builder" (pick any metric/dimension) for Laporan | Looks like a "real" BI tool, maximally flexible | Massive scope increase for a 3-role, 2-section report; turns a one-phase fix into a mini-feature. Explicitly the kind of scope creep PROJECT.md's Out of Scope section warns against ("no new pages, no new roles, no new domains of functionality"). | Two fixed, role-specific views (Manajer's decision/ranking-centric slice, Tim Logistik's status/delivery-centric slice) — exactly what the requirement asks for. |
| Real-time multi-user editing / conflict resolution on the cities list | Feels like a "real admin panel" should support concurrent editors | The app is explicitly client-only/localStorage with no concurrent-session support (Out of Scope in PROJECT.md) — building conflict-handling UI for a single-browser app is solving a problem that cannot occur here. | None needed — single in-browser session, last-write-wins is already the implicit (and correct) model. |
| New schema validation library (Zod/Yup) introduced just for this screen | The store currently has zero schema validation, and adding a robust library "feels" like the right way to validate capacity/stock numbers | Constraints in PROJECT.md are explicit: no new libraries unless a requirement clearly needs one. The existing hand-rolled `validate()` function pattern (already proven on two screens) is sufficient for 2-3 fields and keeps the codebase's footprint consistent. | Reuse the existing inline `validate(nextForm)` → error-map pattern already used in `InputData.jsx`/`ManajemenData.jsx`. |
| A generic "manage all reference data" mega-screen (cities + future entities) | Looks more "enterprise," anticipates future entities | There is exactly one reference-data entity in scope (cities/stock). Building generic infrastructure for entities that don't exist yet is speculative complexity with no current payoff, and conflicts with "no new pages... no new domains" in Out of Scope. | A single, purpose-built `ManajemenKota.jsx` (or similarly named) page, structurally mirroring `ManajemenData.jsx`. |

## Feature Dependencies

```
Admin city/stock CRUD UI (table + modal + validation + empty state)
    └──requires──> existing store methods (tambahKota/updateKota/hapusKota/setStokTbs) [already exist]
    └──requires──> existing shared components (Tabel, Modal, EmptyState, Tombol, Toast) [already exist]
    └──enables──> InputData.jsx empty-state-when-no-cities fix (same root cause: daftarKota can be empty)

Role-differentiated Laporan.jsx
    └──requires──> roleAktif already computed in Laporan.jsx [already exists]
    └──requires──> existing data already present in store (riwayatKeputusan for Manajer slice, status/delivery data for Tim Logistik slice — both already exist, just not surfaced here)
    └──conflicts with──> building a "generic report builder" anti-feature (would replace, not complement, the two fixed views)

Inline validation on Login / StatusDistribusi armada-ETA fields
    └──requires──> no new dependency — directly reuses the validate()-returns-error-map pattern already proven in InputData.jsx / ManajemenData.jsx

Landing/Login/Register rebuilt on shared component library
    └──requires──> existing components/tokens (Tombol, Card, IkonDaun, tokens.css) [already exist]
    └──enhances──> perceived consistency of the Admin CRUD UI and role-differentiated Laporan (all four gaps read as one coherent "production-quality pass" only if done together)

Register.jsx ID generation fix (getNextId vs Date.now())
    └──requires──> no new dependency — getNextId convention already exists in store.js, used by addPermintaan
```

### Dependency Notes

- **Admin city/stock CRUD UI requires existing store methods/components, no new infrastructure:** This is the cheapest of the four major gaps to close correctly because every primitive it needs (`tambahKota`/`updateKota`/`hapusKota`/`setStokTbs`, `Tabel`, `Modal`, `EmptyState`, `Toast`) already exists and has a proven usage pattern in `ManajemenData.jsx`. The work is composition, not invention.
- **Admin CRUD UI enables the InputData empty-state fix:** Both gaps trace to the same root condition (`daftarKota` can be empty — on fresh install, or after an Admin deletes all cities). Sequencing the Admin CRUD screen first (or at least concurrently) means the InputData empty-state copy can correctly say "ask an Admin to add a city" with confidence that path now exists.
- **Role-differentiated Laporan requires no new data, only correct routing of existing data:** `roleAktif` is already computed and ignored — this is a wiring fix, not a new data-modeling problem. Resist the urge to invent new metrics; reuse what `KeputusanDistribusi.jsx`/`AnalisisRanking.jsx` (Manajer) and `StatusDistribusi.jsx` (Tim Logistik) already compute or store.
- **Role-differentiated Laporan conflicts with a generic report builder:** A configurable/generic approach would be solving a different (harder, broader) problem than what's asked. Two fixed, hand-built views per role is both the correct scope and the cheaper build.
- **Inline validation requires no new pattern:** Both the Login fix and the StatusDistribusi armada/ETA fix should copy the exact `validate(nextForm)` → per-field error object → render-under-field shape already used twice in the codebase. Inventing a different validation approach for these two screens would create inconsistency, not just extra work.
- **Design-system rebuild (Landing/Login/Register) enhances perceived completeness of everything else:** Because Core Value is about the whole app feeling consistent and trustworthy, an Admin who builds a beautiful new city/stock screen but lands on an ad-hoc-styled Login page first will still perceive the product as unfinished. This isn't a hard technical dependency, but it's a perception dependency worth sequencing thoughtfully (the PROJECT.md's own Key Decisions table already prioritizes this).

## MVP Definition

Note: This project does not have a traditional "launch" — it's a completion/polish milestone against an explicit, fixed Active-requirements list in PROJECT.md. The "MVP" framing below maps to "minimum to close each stated gap correctly" vs. "defer as a stretch."

### Launch With (v1) — i.e., required to close the stated Active requirements

- [ ] City CRUD: add, edit, delete cities through a real page, using `Tabel` + `Modal` + existing store methods — why essential: explicitly named gap, store methods already exist with zero UI
- [ ] City CRUD: inline field-level validation (name required + uniqueness, capacity numeric/non-negative) — why essential: required for the screen to be "real," and matches the existing two-screen validation convention
- [ ] City CRUD: delete confirmation that names consequences (or at minimum doesn't silently orphan data) — why essential: this is reference data other records depend on; this is the one place this screen must not just copy-paste `ManajemenData.jsx` blindly
- [ ] City CRUD: empty state when no cities exist yet — why essential: directly enables and parallels the InputData empty-state fix already in scope
- [ ] Stock (TBS) management surfaced on the same screen (`setStokTbs`) — why essential: explicitly named in the same requirement bullet as city CRUD
- [ ] Laporan: role-aware content fork using existing `roleAktif`, with each role seeing data drawn from metrics it already owns elsewhere (Manajer → decisions/ranking; Tim Logistik → status/delivery) — why essential: explicitly named gap, `roleAktif` already computed and unused
- [ ] Laporan: CSV export columns follow the active role's content — why essential: an export mismatched to on-screen data would be a regression introduced by this very fix
- [ ] Login inline field-level validation — why essential: explicitly named gap
- [ ] StatusDistribusi armada/ETA inline validation — why essential: explicitly named gap
- [ ] InputData empty-state-when-no-cities — why essential: explicitly named gap
- [ ] Register.jsx ID generation via `getNextId` — why essential: explicitly named gap, convention consistency
- [ ] Landing/Login/Register rebuilt on shared components/tokens — why essential: explicitly named gap, and the perception dependency noted above

### Add After Validation (v1.x)

- [ ] Inline quick-edit on city capacity/stock cells — trigger for adding: only after the modal-based CRUD is confirmed correct; this is a UX nicety layered on top, not a substitute
- [ ] Per-city capacity/stock utilization visual (progress bar) — trigger for adding: only if there's time left in the milestone after the four named gaps are closed

### Future Consideration (v2+)

- [ ] Period-over-period delta metrics on Laporan — why defer: meaningfully larger scope than wiring existing role-scoped data; not requested
- [ ] Cross-linking report rows to source records — why defer: nice traceability, not part of "role-differentiated," genuinely a v2 feature
- [ ] Any soft-delete/archive model for cities — why defer: out of scope per PROJECT.md, would require auditing every `daftarKota` consumer

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| City CRUD UI (add/edit/delete + stock) | HIGH | LOW (store + components already exist) | P1 |
| City CRUD delete-consequence handling | HIGH | MEDIUM (needs explicit decision: block/cascade/warn) | P1 |
| City CRUD empty state | MEDIUM | LOW | P1 |
| Role-differentiated Laporan content fork | HIGH | MEDIUM (needs care choosing the right existing metrics per role) | P1 |
| Laporan CSV export following role fork | MEDIUM | LOW | P1 |
| Login inline validation | MEDIUM | LOW | P1 |
| StatusDistribusi armada/ETA inline validation | MEDIUM | LOW | P1 |
| InputData empty-state-when-no-cities | MEDIUM | LOW | P1 |
| Register getNextId fix | LOW (invisible to user, visible in code quality) | LOW | P1 |
| Landing/Login/Register design-system rebuild | HIGH (perceived polish) | MEDIUM-HIGH (most pages, most surface area) | P1 |
| Inline quick-edit on city cells | LOW-MEDIUM | LOW | P2 |
| City capacity/stock utilization bar | LOW | LOW | P2 |
| Laporan period-over-period delta | MEDIUM | MEDIUM | P3 |
| Cross-link Laporan rows to source records | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Required — directly named in PROJECT.md Active requirements
- P2: Should have if time allows, layered on top of P1 without altering its shape
- P3: Explicitly future/out of current milestone scope

## Competitor / Reference-Pattern Analysis

Rather than external competitor products (this is an internal school-project admin tool, not a market-facing app), the most relevant comparison is against **established admin-dashboard conventions** (Refine, React-Admin, Ant Design Pro-style CRUD screens; standard RBAC reporting patterns) versus **what Switera already does on its one mature CRUD screen.**

| Convention | Standard admin-tool convention | Switera's existing pattern (`ManajemenData.jsx`) | Our plan for new screens |
|------------|--------------------------------|---------------------------------------------------|---------------------------|
| List + CRUD | Sortable/paginated table, modal or drawer for edit, confirm dialog for delete | Already matches: `Tabel` (sortable/paginated) + `Modal` for edit + `Modal` for delete confirm | Copy this exact shape for city/stock CRUD — no deviation needed |
| Field validation | Validate per-field on change, show error inline under the field, disable submit (or re-validate on submit) until valid | Already matches: `validateEditForm`/`validate` returns an error map, rendered as `<p>` under each field | Copy this exact shape for the new city form, Login, and StatusDistribusi fields |
| Delete safety | Confirm dialog; for entities other records depend on, warn about referential impact or block the delete | Existing pattern (`removePermintaan`) is safe because permintaan isn't a foreign-key target of anything else. Cities ARE referenced elsewhere (permintaan.kota, capacity used in ranking calc) | Must go one step further than the existing pattern: confirm modal should state what depends on the city being deleted, not just "are you sure" |
| Empty states | Friendly empty state with a clear next action, not a blank table/list | Already matches: `EmptyState` component, used "consistently across nearly all pages" | Apply identically to cities list and InputData's city dropdown |
| Role-scoped views | Same screen renders different data/sections per role, typically via a single switch on role drawing from already-existing role-owned data, not a parallel new dataset | Currently broken: `Laporan.jsx` computes `roleAktif` and ignores it — identical content for both roles | Fork content by `roleAktif`, sourcing each fork from metrics that role's other screens already compute/store (decisions for Manajer, status/delivery for Tim Logistik) |
| Loading states | Skeleton or spinner during any operation with perceptible latency; instant operations need no loading state | Already matches selectively: `SkeletonChart` for lazy-loaded Chart.js, `isSaving` button-disable for the 800ms simulated save in `InputData.jsx` | No new pattern needed; city/stock CRUD against localStorage is synchronous, so a loading state isn't required there — just don't regress the existing chart/save loading states while touching adjacent code |

## Sources

- **Switera codebase (HIGH confidence, primary source for this research):** `src/pages/ManajemenData.jsx`, `src/pages/InputData.jsx`, `src/pages/Laporan.jsx`, `src/pages/Login.jsx`, `src/components/Tabel.jsx`, `src/components/EmptyState.jsx`, `src/components/Modal.jsx`, `src/store.js` (lines ~239-313 for `daftarKota`/`tambahKota`/`updateKota`/`hapusKota`/`setStokTbs`), `src/utils/navigation.js` (role/menu config) — read directly during this research session.
- `.planning/PROJECT.md` and `.planning/codebase/ARCHITECTURE.md` — milestone requirements and architecture context (read per required_reading).
- **General admin-dashboard / CRUD-UX conventions (MEDIUM confidence — standard, widely-documented industry practice; not freshly fetched from a live external source this session because web research tools were unavailable in this environment):** patterns consistent with what's documented across mainstream admin-framework references (e.g. Refine, React-Admin, Ant Design Pro conventions for list+CRUD, inline validation, and empty/loading states) and standard forms/validation usability guidance (e.g. Nielsen Norman Group-style inline-error-on-field guidance). These were used only to corroborate that Switera's existing pattern already meets the bar — no claim in this document depends solely on this tier; every table-stakes item is cross-checked against actual code already in this repo.

---
*Feature research for: role-based logistics/distribution admin dashboard (Switera)*
*Researched: 2026-06-21*
