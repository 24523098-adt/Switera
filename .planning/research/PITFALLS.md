# Pitfalls Research

**Domain:** Completion/polish milestone on an existing brownfield React SPA (client-only, hand-rolled store, manual router, shared component library)
**Researched:** 2026-06-21
**Confidence:** HIGH (grounded directly in this repo's source — `src/store.js`, `src/App.jsx`, `src/components/auth/AuthShared.jsx`, `.planning/codebase/CONCERNS.md` — not generic web-dev folklore)

## Critical Pitfalls

### Pitfall 1: "Rebuild on the component library" turns into a redesign

**What goes wrong:**
The brief says rebuild Landing/Login/Register onto `Tombol`, `Card`, `IkonDaun`, and `tokens.css`. While doing this, it's extremely easy to also change copy, layout, spacing rhythm, add new sections, or change the visual hierarchy "while I'm in there" — because the old auth pages are 100% inline styles and genuinely look dated next to the rest of the app. The result is a new, different-looking auth/landing experience rather than the *same* experience expressed through shared components.

**Why it happens:**
`AuthShared.jsx` already imports CSS variables in its inline `style` objects (`var(--color-border-mid)`, `var(--text-sm)`, etc.) — it is not using *arbitrary* hardcoded values, it's using tokens via the wrong mechanism (inline `style=` instead of `Tombol`/`Card` components and token-based CSS classes). This nuance is easy to miss: a developer who only checks "does it reference `tokens.css` values" will think the page already complies, then proceeds to redesign it because it "still looks different" from the rest of the app — when the real, narrower task is mechanical substitution (swap inline style objects for the actual shared components), not a visual refresh.

**How to avoid:**
- Before touching Login/Register/Landing, write down (in the phase plan) the *current* visual output as the spec to preserve: exact copy, exact field order, exact layout breakpoints, exact button placement.
- Treat the task as "swap the implementation, not the design": every inline `<button style={...}>` becomes `<Tombol>`, every panel `<div style={{...}}>` becomes `<Card>`, every icon becomes the matching shared icon component if one exists. If `Tombol`/`Card` can't express the existing look, that's a signal to *extend* the component (rare, with justification) — not to redesign the page around what the component currently supports.
- Diff before/after with a side-by-side screenshot per breakpoint (mobile/tablet/desktop) before calling the page done. If it doesn't pass for "same design, new code," it's failed regardless of how internally clean it is.

**Warning signs:**
- Commit diff for Login/Register/Landing touches copy text, adds new visual sections, or changes spacing values that weren't forced by token substitution.
- Phase notes start using words like "improved," "modernized," or "cleaner" rather than "matched to design system."
- New CSS class names appear that aren't reused from existing pages (a sign of inventing new patterns instead of reusing existing ones).

**Phase to address:**
Phase covering Landing/Login/Register rebuild — scope the plan explicitly as "swap implementation, preserve design," and gate phase completion on a visual diff check, not just "uses `Tombol`/`Card` somewhere."

---

### Pitfall 2: Rebuilding shared-component consumers breaks the *other* pages that already use those components

**What goes wrong:**
`Tombol`, `Card`, `IkonDaun`, `Modal`, `Tabel`, etc. are shared across nearly every page (`Dashboard.jsx`, `InputData.jsx`, `ManajemenData.jsx`, `KeputusanDistribusi.jsx`, and more). If the Login/Register/Landing rebuild needs a variant of `Tombol` or `Card` that doesn't exist yet (e.g., a full-bleed hero card, a borderless button), the natural shortcut is to add a new prop or conditional branch to the *existing* shared component. Done carelessly, this can shift default styling, spacing, or behavior for every other page that already consumes that component — a regression with a blast radius far outside the three pages actually in scope.

**Why it happens:**
Shared components in this codebase (per `CONVENTIONS.md`) have no tests and no Storybook/isolated preview — the only way to "see" a component is to render it in a real page. A change made and visually verified only on the Login page can silently alter how `Tombol` renders on `KeputusanDistribusi.jsx` or `Dashboard.jsx`, and nobody will notice until that page is opened.

**How to avoid:**
- New visual variants must be *additive*: new optional props with explicit defaults that preserve current behavior when omitted (e.g., `variant="ghost"` opt-in, never change the unnamed default rendering path).
- After any edit to a shared component (`Tombol.jsx`, `Card.jsx`, `IkonDaun.jsx`, `Modal.jsx`, `Tabel.jsx`, `Layout.jsx`), manually click through every page that imports it before considering the change done — there is no automated test safety net here.
- Prefer wrapping/composing over modifying: if Login needs a button that looks 90% like `Tombol` but not quite, consider whether `Tombol` already supports it via existing props before adding new ones.

**Warning signs:**
- A shared component file (`src/components/*.jsx`) shows up in the diff for a phase scoped to "auth pages" or "city CRUD" — that's a cross-cutting change that needs explicit regression-checking, not an incidental one.
- New props added to a shared component without a corresponding "what happens to existing callers" note in the plan.
- Any change to default values/styling in a shared component (vs. only adding new optional variants).

**Phase to address:**
Both the Landing/Login/Register phase and the Admin CRUD UI phase (if it reuses `Modal`/`Tabel`/`Tombol` in new ways) — add an explicit "regression-check all consumers of any modified shared component" step to plan verification criteria.

---

### Pitfall 3: New Admin CRUD UI doesn't actually follow the store's existing conventions

**What goes wrong:**
The store methods `tambahKota`/`updateKota`/`hapusKota`/`setStokTbs` already exist and already follow specific conventions: they call `recordActivity(...)` for the activity log, they call `notify()` once at the end (not mid-function), `tambahKota` throws a `new Error(...)` with an Indonesian message for the duplicate-name case, and `getNextId` is *not* used for kota (cities are keyed by `nama`, not by a generated ID) — unlike `permintaan`/`keputusan`/`notifikasi`/`activityLog`, which all use `getNextId(items, "PREFIX")`. A new CRUD UI built by analogy to `InputData.jsx`/`ManajemenData.jsx` without re-reading `store.js` line by line risks: wrapping store calls in try/catch that swallows the thrown duplicate-name error instead of surfacing it as inline validation, inventing a new ID scheme for cities that doesn't match how `tambahKota` actually keys records (by `nama`), or calling `notify()`/persisting from the UI layer when the store already owns that responsibility.

**Why it happens:**
The codebase has two different ID conventions already coexisting (`getNextId` with `PREFIX-NNN` for transactional records; bare `nama` as the natural key for cities) plus an established error-via-throw pattern for one validation case (duplicate city name) and an error-via-return-object pattern for form-level validation elsewhere (`InputData.jsx`'s `validate()` returns `{ field: message }`). A developer pattern-matching only on the *closest* existing CRUD page (`ManajemenData.jsx` for `permintaan`) without checking how `tambahKota`/`updateKota`/`hapusKota` actually behave will build a UI that's *internally consistent* with itself but *inconsistent* with the actual store contract it's calling.

**How to avoid:**
- Before writing the Admin CRUD page, re-read `tambahKota`, `updateKota`, `hapusKota`, `setStokTbs` in `src/store.js` in full (lines ~247-284) — note: no `getNextId` involved, `nama` is the natural key, duplicate-name check throws synchronously and must be caught in the UI's submit handler, `recordActivity` is already called by the store (don't double-log from the page).
- Match the existing CRUD UI pattern (`InputData.jsx`'s validate-then-call-store-then-toast flow) for consistency of *user experience*, but match `store.js`'s actual method signatures and error-throwing behavior for *correctness*. These are two different things to verify against two different files.
- Confirm the new UI handles `updateKota`'s rename case correctly — renaming changes the natural key (`namaLama` -> `nama`), so any other state in the app that references a city by name (e.g., `permintaan[].kota`, `keputusan[].kota_tujuan`) is **not** updated by `updateKota` and will silently orphan/break references after a rename. This is a real data-integrity gap in the existing store, not just a UI concern — decide explicitly (in the phase plan) whether the new UI should block renames, cascade-update, or warn, rather than discovering it during manual testing.

**Warning signs:**
- New code calls `getNextId(..., "KOTA")` or invents any ID field for cities — cities don't have one.
- New code wraps `tambahKota`/`updateKota` calls in a try/catch that logs to console or shows a generic error instead of surfacing the thrown `Error.message` as inline validation text (this is the one place in the store that uses throw-based validation, and the UI needs to handle it explicitly — every other store mutator either silently no-ops or always succeeds).
- No test/manual-check of "rename a city that has existing `permintaan` records pointing at it by name" before calling the Admin CRUD UI phase done.

**Phase to address:**
Admin city/stock management UI phase — plan should explicitly require re-reading `store.js`'s kota methods before implementation, and verification criteria should include the rename-with-existing-references case as a UAT scenario.

---

### Pitfall 4: "Production-ready" gets quietly reinterpreted as "refactor the architecture"

**What goes wrong:**
`CONCERNS.md` documents real, legitimate architectural weaknesses: 4 interlocking `useEffect`s for route/role/auth reconciliation in `App.jsx`, full-state deep-cloning on every store read/write, manual routing instead of `react-router-dom`, monolithic page files (1600+ lines). All of these are flagged explicitly as **not in scope** unless they block a requirement. But "make it feel complete and production-ready" is exactly the kind of brief that invites a well-intentioned developer to read `CONCERNS.md` and think "well, *production*-ready really should mean fixing the router" or "let's add Immer while I'm touching the store for the new CRUD methods." Each individual refactor seems justified in isolation; together they turn a polish pass into an undeclared rewrite with much higher regression risk and no corresponding increase in user-visible scope.

**Why it happens:**
"Production-ready" is a vague, aspirational phrase, and engineers are trained to associate it with engineering quality (tests, architecture, performance) rather than the narrower thing actually meant here: *no rough edges, nothing half-built, consistent UI, working validation*. The PROJECT.md is explicit that this is a school project demoing client-only "production quality" as **completeness and polish**, not infrastructure — but that distinction is easy to lose once mid-implementation.

**How to avoid:**
- Anchor every phase plan to a specific bullet in PROJECT.md's "Active" requirements list. If a piece of work doesn't map to one of those 8 bullets, it's out of scope by default — even if it would objectively improve the codebase.
- Treat `CONCERNS.md` as a *read-only reference for context*, not a backlog. The PROJECT.md explicitly says the `App.jsx` routing fragility is "not in scope to refactor unless it blocks a requirement" — that sentence is the scope boundary; don't relitigate it per-phase.
- If a requirement's implementation *genuinely* requires touching a concern-flagged area (e.g., adding the Admin CRUD page touches `store.js`, which is one of the fragile areas), the rule is: make the **minimum-diff** change needed to add the new functionality, following existing conventions exactly (see Pitfall 3) — do not use the opportunity to also fix the deep-clone performance issue or switch to Immer.
- Any urge to refactor for "clean code" should be redirected to: does the new code I'm adding follow existing conventions and stay small? Not: should I improve what's already there?

**Warning signs:**
- A phase plan or commit touches `src/store.js`'s `clone()` helper, `persistState()`, or the deep-clone pattern itself, when the actual requirement only needed new mutator *methods* added alongside the existing ones.
- A phase plan or commit touches `App.jsx`'s routing `useEffect`s, switches to `react-router-dom`, or restructures `pageRegistry` beyond adding one new route entry for a page that's actually in scope.
- Diff size for a requirement is much larger than the requirement's apparent complexity suggests (e.g., "add inline validation to two fields" producing changes across 10 files).
- Conversation/commit messages start using words like "refactor," "migrate," "modernize architecture," or "while I'm here" — these are the linguistic tells of scope creep in this specific milestone.
- New dependencies appear in `package.json` (explicitly disallowed by the Constraints section unless a requirement clearly needs one — and none of the Active requirements need one).

**Phase to address:**
Cross-cutting — every phase plan, not just one. Add "maps to PROJECT.md Active requirement #N" as a required field per phase plan, and reject/flag any task that doesn't have one. The final "full pass across every existing page" requirement (bullet 8) is the highest-risk one for this pitfall specifically, because it's open-ended by design ("fixing any additional gaps found") — scope it to UI/UX completeness gaps only (empty states, validation, loading states, consistency), explicitly excluding architecture/performance/testing infra changes discovered along the way (log those as backlog items instead, don't fix them inline).

---

### Pitfall 5: Inline validation added inconsistently with the rest of the app's validation pattern

**What goes wrong:**
The brief asks for inline validation on Login fields and `StatusDistribusi.jsx`'s armada/ETA fields. `InputData.jsx` already has a working inline validation pattern: a `validate()` function returning `{ field: message }`, rendered per-field. If the new validation on Login/StatusDistribusi is implemented differently (e.g., a different error-display component, different timing — on-blur vs on-submit vs on-change, different visual treatment for the error state), the app ends up with two different "inline validation" UX patterns that look and behave differently depending on which page you're on — which directly undermines the "consistent UI" goal this whole milestone exists to serve.

**Why it happens:**
Each of these pages was likely touched by different people/sessions and the validation requirement reads as a per-page task, making it easy to solve each one locally and idiomatically for that page rather than checking how the *existing, working* pattern does it first.

**How to avoid:**
- Before implementing Login's or StatusDistribusi's inline validation, read `InputData.jsx`'s `validate`/`handleChange`/error-rendering pattern (and `AuthShared.jsx`'s `IkonAlertCircle` if it's already used for inline errors anywhere in auth) and replicate the same shape, trigger timing, and visual treatment.
- If `AuthShared.jsx` doesn't yet have a per-field error pattern, this is the moment to introduce one *matching* `InputData.jsx`'s approach — not inventing a third pattern.

**Warning signs:**
- Two different validation-error visual treatments appear in the diff (e.g., red border + text under field on one page, toast-only on another).
- Validation triggers at different times across pages (on blur vs on submit vs on every keystroke) without a stated reason.

**Phase to address:**
Whichever phase implements Login inline validation and the StatusDistribusi armada/ETA validation — cross-reference both against `InputData.jsx`'s existing validation implementation as the canonical pattern before writing new code.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems — evaluated specifically against this milestone's "polish, don't rewrite" mandate.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding the new Admin city CRUD UI's validation messages/strings inline rather than centralizing | Faster to ship one page | Diverges further from any future i18n/centralized-copy effort | Acceptable here — matches existing per-page inline-message convention (`InputData.jsx`), don't invent centralization that doesn't exist elsewhere |
| Reusing `Modal` for city add/edit instead of building a dedicated form page | Faster, consistent with `Tabel`+`Modal` CRUD pattern likely already used elsewhere | None significant — this *is* the existing convention, not a debt | Always acceptable — confirm `ManajemenData.jsx` uses this pattern and mirror it |
| Not adding tests for the new `tambahKota`/`updateKota` UI flows | Faster delivery, matches "no tests exist anywhere" status quo | Distribution-adjacent logic (kota capacity feeds `distribusi.js` calculations) ships unverified | Acceptable for the UI layer; CONCERNS.md already flags `distribusi.js`/`forecast.js` as high-priority test targets — if a phase touches those *calculation* files specifically, reconsider, but the Admin CRUD UI itself doesn't change calculation logic |
| Leaving the city-rename-breaks-references gap unfixed (Pitfall 3) | Stays within "no new business logic" scope | A user renaming a city silently orphans historical `permintaan`/`keputusan` records referencing the old name | Acceptable **only if explicitly decided and documented** (e.g., block rename in the UI, or only allow add/delete not rename) — not acceptable to leave silently undecided |
| Copy-pasting `AuthShared.jsx`'s inline `style` objects into the rebuilt Login/Register rather than fully migrating to token-based CSS classes | Faster rebuild, "good enough" since tokens are still referenced | Doesn't actually close the design-consistency gap that's the explicit reason for this requirement; leaves the codebase in the same "two ways to do styling" state | Never acceptable for this specific requirement — the whole point of the requirement is to eliminate this pattern, not preserve it under a different name |

## Integration Gotchas

This app has no external service integrations (client-only by design), so this section is intentionally scoped to *internal* integration points — places where new code must integrate correctly with existing internal systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| New Admin CRUD page <-> `store.js` | Calling store mutators and assuming a return value triggers re-render automatically without subscribing via the `useEffect` + `useState` + `store.subscribe()` pattern used elsewhere | Mirror the exact subscribe/unsubscribe pattern from `InputData.jsx`/`App.jsx`; the store's `notify()` only reaches components that have subscribed |
| New Admin CRUD page <-> activity log | Manually calling `store.catatAktivitas(...)` after `tambahKota`/`updateKota`/`hapusKota` | Don't — those three methods already call `recordActivity` internally; double-logging will produce duplicate activity-log entries |
| Role-differentiated `Laporan.jsx` <-> `roleAktif` | Branching on `store.getRoleAktif()` fresh inside the render instead of using the already-computed `roleAktif` the component destructures from its subscribed snapshot | Use the existing `roleAktif` variable already computed in `Laporan.jsx` (per PROJECT.md: "currently computes `roleAktif` but never uses it") — it's already there, just unused; wire content branching to it rather than re-deriving |
| Rebuilt Login/Register <-> `cariAkun`/`tambahAkun` | Changing the auth call signature or validation order while rebuilding the page visually | Keep the exact same store calls (`cariAkun(username, password, role)`, `tambahAkun(akun)`) and the same `getNextId` convention for new account IDs (per PROJECT.md bullet: Register should use `getNextId`, not `Date.now()`) — this is a visual rebuild, not a logic change, except for that one explicitly-named ID-generation fix |

## Performance Traps

This app's known performance ceiling (full-state clone on every read/write, synchronous full `localStorage` write on every mutation) is explicitly out of scope to fix per PROJECT.md/CONCERNS.md. The trap here is different: making it *worse* incidentally while adding the new CRUD UI.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| New Admin CRUD UI re-fetching/re-cloning store state on every keystroke instead of only on store-notify | Sluggish typing in city name/capacity fields as `daftarKota` grows | Keep local form state in component `useState`, only read from `store.getDaftarKota()` on mount/after a successful mutation — same pattern as `InputData.jsx` | Noticeable once `daftarKota` plus all other state grows past current seed size (currently 8 cities — low risk for a school demo, but don't introduce a *new* read-heavy pattern that didn't exist before) |
| Adding a new `useEffect` that calls a store getter on every render of a rebuilt Login/Register page | Unnecessary re-renders on every keystroke of password/username fields | Auth pages don't need store subscriptions for their own form state — only call store methods on submit, exactly as the current implementation does | Low risk here since auth pages are not data-heavy, but worth checking if the rebuild accidentally adds an unneeded `useEffect`/`subscribe` pair |

## Security Mistakes

Out-of-scope items (real auth, hashed passwords, multi-user) are explicitly not this milestone's job per PROJECT.md. The risk here is narrower: accidentally extending the trust assumptions of the placeholder auth scheme while "polishing" it.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Adding password strength/complexity messaging on Register that implies real security | Misleads a reader of the demo into thinking this is real auth | Keep Register's validation framed as data-entry validation (required fields, matching confirm-password, uniqueness) — don't add language or UI implying cryptographic security guarantees that don't exist |
| "Improving" `cariAkun`'s plain-string password comparison while touching `store.js` for the new CRUD methods | Scope creep into security work explicitly marked out-of-scope; also risks breaking existing login for the 3 seed accounts if done carelessly | Leave `cariAkun`/password storage untouched; CONCERNS.md and PROJECT.md are explicit this is acceptable for now |
| CSV export of newly-added city names without injection sanitization (flagged generally in CONCERNS.md, now relevant because Admin can add arbitrary new city names) | A city name starting with `=`, `+`, `-`, or `@` entered via the new Admin UI could trigger CSV formula injection when later exported via `Laporan.jsx`/`RiwayatAktivitas.jsx`'s CSV export | If the Admin CRUD UI phase is the first to let a user freely type a "kota" name (previously only seeded, fixed values), consider whether minimal sanitization in `csv.js` belongs in this milestone — flag explicitly as a decision rather than silently skipping it, since this milestone is the one that turns city names from fixed seed data into freely user-entered data |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| New Admin CRUD UI lets a city be deleted (`hapusKota`) while it still has open `permintaan`/`keputusan` referencing it by name | Orphaned records silently reference a city that no longer exists in `daftarKota`; downstream pages (dropdowns, charts) may show blank/broken entries | Before allowing delete, check for references in `permintaan`/`keputusan` and either block deletion with an inline message or warn-and-confirm — decide and implement explicitly, don't leave it as an accidental gap |
| Role-differentiated `Laporan.jsx` ships with one role's view clearly more polished/complete than the other | One role's "production-ready" experience is worse than the other's, undermining the milestone's core value ("must feel complete and trustworthy for every role") | Treat both role variants as equally first-class in the same phase/plan — verify both during UAT, not just the default role |
| Login/Register visual rebuild looks great on desktop but regresses on mobile because the old inline-style version had ad-hoc mobile-specific overrides that don't have an equivalent in `Tombol`/`Card` | Mobile users (or demo on a smaller screen) see a broken/misaligned auth flow | Explicitly test the rebuilt pages at the same breakpoints the original inline styles handled — check `AuthShared.jsx` and `Login.jsx`/`Register.jsx` for any media-query or width-conditional logic before assuming the shared components handle it automatically |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces — specific to this milestone's scope.

- [ ] **Admin city CRUD UI:** Often missing the delete-with-references guard (Pitfall 3/UX table) — verify deleting a city that's referenced by existing `permintaan`/`keputusan` doesn't silently orphan data.
- [ ] **Admin city CRUD UI:** Often missing the rename-cascades-or-blocks decision (Pitfall 3) — verify renaming a city updates or explicitly blocks/warns about existing references rather than silently diverging.
- [ ] **Role-differentiated `Laporan.jsx`:** Often "differentiated" by only changing a heading/label while the underlying data/charts stay identical — verify the actual *content* (not just a title) differs meaningfully per role per PROJECT.md's intent.
- [ ] **Rebuilt Login/Register/Landing:** Often "uses the component library" only in the happy path, while error states, loading states, or edge-case layouts (long error messages, empty fields) still fall back to old inline styles — verify every visual state, not just the default render.
- [ ] **Inline validation (Login, StatusDistribusi armada/ETA):** Often validates on submit only, missing the "inline" expectation of per-field, real-time or on-blur feedback that matches `InputData.jsx`'s existing pattern — verify trigger timing matches, not just that an error can appear somewhere.
- [ ] **`InputData.jsx` empty-cities warning:** Often implemented as a console warning or a disabled dropdown with no visible explanation — verify there's a user-visible message (ideally reusing the existing shared `EmptyState` component) telling the user *why* the dropdown is empty and what to do (go to Admin CRUD UI).
- [ ] **Register's `getNextId` fix:** Often "fixed" by just renaming the ID format without verifying no other code path (e.g., `cariAkun`, activity log attribution) depended on the old `Date.now()`-based ID's properties (always increasing, unique across sessions) in a way the new sequential ID doesn't preserve.
- [ ] **The final full-page-audit requirement:** Often interpreted as "fix what's listed," when the requirement explicitly says "fixing any additional gaps found beyond the ones already identified" — verify the audit actually re-checks all 8 listed criteria (CRUD via store, role-based data, navigation, inline validation, empty states, loading states, design consistency, no-reload data flow) per page, not just the pages with already-known gaps.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|------------------|
| Auth/landing rebuild drifted into a redesign (Pitfall 1) | MEDIUM | Diff against the pre-rebuild screenshots/copy; revert non-essential copy/layout changes while keeping the component-library swap; re-verify against the "same design, new code" bar before merging |
| Shared component change broke another page (Pitfall 2) | MEDIUM-HIGH | Identify all consumers of the changed component (`grep` for the import), manually click through each; if the new variant can't be made additive cleanly, extract a separate new component instead of continuing to modify the shared one |
| Admin CRUD UI doesn't match store conventions (Pitfall 3) | LOW-MEDIUM | Since `tambahKota`/`updateKota`/`hapusKota` already exist and are presumably correct, the fix is almost always on the UI side — rewrite the submit handler to match the store's actual contract (catch the thrown Error, use `nama` as the key, don't double-log activity) |
| Polish milestone ballooned into architecture refactor (Pitfall 4) | HIGH | Stop, diff the branch against `main`/last milestone tag, identify changes that don't map to a PROJECT.md Active requirement, and either revert them or explicitly move them to a new "Out of Scope / future milestone" backlog item — do not try to finish the unplanned refactor under time pressure |
| Inconsistent inline-validation UX across pages (Pitfall 5) | LOW | Retrofit the later-implemented pages to match `InputData.jsx`'s pattern (or vice versa, whichever is more broadly used) — this is a small, mechanical fix once identified |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Rebuild drifts into redesign | Landing/Login/Register rebuild phase | Side-by-side before/after screenshots per breakpoint; copy text diff shows zero unintended changes |
| Shared component change breaks other pages | Landing/Login/Register rebuild phase + Admin CRUD UI phase (any phase touching `src/components/*.jsx`) | Manual click-through of every page importing any modified shared component, listed explicitly in the plan's verification checklist |
| Admin CRUD UI violates store conventions | Admin city/stock management UI phase | UAT scenario: add city, edit city (including rename with existing references), delete city (including one with existing references), set stock — confirm activity log has exactly one entry per action, no duplicates, no `getNextId`-style ID invented for cities |
| Polish milestone becomes a rewrite | Every phase (cross-cutting); especially the final "full pass across every page" phase | Each phase plan cites the specific PROJECT.md Active requirement bullet it addresses; diff review explicitly flags any change to `App.jsx` routing, `store.js`'s clone/persist internals, or new dependencies as requiring justification before merge |
| Inconsistent inline validation patterns | Login validation phase + StatusDistribusi validation phase | Both implementations reviewed side-by-side against `InputData.jsx`'s existing `validate()`/error-rendering pattern before being marked done |
| City rename/delete breaks references elsewhere | Admin city/stock management UI phase | Explicit UAT case: rename a city that has existing `permintaan` entries, then check `InputData.jsx`/`KeputusanDistribusi.jsx`/reports still function and show a sane (not silently broken) result |
| Role-differentiated report is superficial | `Laporan.jsx` role-differentiation phase | UAT performed as both Manajer Distribusi and Tim Logistik in the same session, confirming materially different content (not just a relabeled heading) |

## Sources

- `.planning/PROJECT.md` — Active requirements, Out of Scope, Constraints, Key Decisions (primary source for what counts as scope creep in this milestone)
- `.planning/codebase/CONCERNS.md` — Tech debt, fragile areas, security considerations, scaling limits (primary source for what's explicitly *not* this milestone's job)
- `.planning/codebase/CONVENTIONS.md` — Naming, error-handling, and module-design conventions the new code must match
- `src/store.js` (read directly) — exact mutator conventions (`recordActivity`, `notify`, `getNextId`, throw-based validation for `tambahKota`) that the new Admin CRUD UI must replicate exactly
- `src/components/auth/AuthShared.jsx` (read directly) — confirms auth pages already reference design tokens via inline `style` objects, the specific anti-pattern the rebuild must eliminate (not just "uses tokens somewhere")
- General software-engineering pattern knowledge on brownfield "polish milestone" scope creep (cross-checked against this repo's specific structure rather than asserted generically)

---
*Pitfalls research for: completion/polish milestone on existing client-only React SPA (Switera)*
*Researched: 2026-06-21*
