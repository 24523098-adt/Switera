# Stack Research

**Domain:** Client-only React 18 + Vite SPA, completion/polish milestone (admin CRUD UI, role-differentiated reports, page rebuilds onto existing component library, inline form validation)
**Researched:** 2026-06-21
**Confidence:** MEDIUM-HIGH (grounded directly in this repo's existing code; general ecosystem claims about React 18 form-handling and localStorage pub/sub patterns are well-established, slow-moving facts, but could not be cross-verified against live sources in this session — Bash and WebSearch tool access were denied at execution time, see Sources)

## Recommended Stack

**Bottom line: add zero new dependencies.** Everything this milestone needs — inline validation, a consistent admin CRUD UI, and new store mutations — is already solvable with what's in `package.json` (`react` ^18.3.1, `react-dom` ^18.3.1, `chart.js` ^4.5.1, `react-chartjs-2` ^5.3.0, `leaflet` ^1.9.4) plus patterns the codebase has already proven out in `InputData.jsx`, `ManajemenData.jsx`, and `src/store.js`. This is not a "stay minimal for minimalism's sake" call — it's that the codebase already contains working, idiomatic solutions to all three sub-questions, and the project constraint explicitly forbids new dependencies unless clearly justified.

### Core Technologies (unchanged — no new core tech needed)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^18.3.1 (existing) | UI runtime, hooks-based components | Already in use throughout; `useState`/`useEffect` are sufficient for this milestone's scope — no concurrent-rendering or server-component features are needed |
| Vite | ^7.0.0 (existing) | Dev server / bundler | No build-tooling changes required for this milestone |
| Plain CSS + `tokens.css` custom properties | existing | Design tokens (color, spacing, radius, type scale) | Already comprehensive (colors, spacing, radii, shadows, font scale, easing curves) — this is a real lightweight design-token system, not ad-hoc magic numbers, and just needs to be *used consistently* (the actual gap) rather than replaced |

### Supporting Libraries — none to add

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none)* | — | — | There is no supporting library this milestone needs. Validation, CRUD modals, and store extension are all solved with existing React primitives and existing code patterns (see "How to implement" below) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| *(none added)* | — | No linter/formatter/test runner exists today (confirmed in `.planning/codebase/STACK.md` and `CONVENTIONS.md`) and adding one is out of scope for a stack decision on this milestone — flag this as a separate, optional improvement, not a blocker. If the team wants guardrails for the new CRUD code specifically, ESLint with the React Hooks plugin is the standard low-risk addition, but it is not required to ship this milestone |

## Installation

```bash
# No installation needed — this milestone uses 0 new dependencies.
# package.json stays exactly as-is:
#   react ^18.3.1, react-dom ^18.3.1, chart.js ^4.5.1, react-chartjs-2 ^5.3.0, leaflet ^1.9.4
```

## How to Implement Each Part With What's Already There

### 1. Lightweight inline form validation — reuse the `InputData.jsx` pattern, don't introduce react-hook-form/Formik/Zod

The codebase already has a clean, idiomatic "no library" validation pattern in `src/pages/InputData.jsx` (lines 51-91):

- A pure `validate(formState)` function returns an error object shaped `{ fieldName: "message" }` (Indonesian messages, matching `CONVENTIONS.md`'s documented pattern: "Form-level validation returns an error object rather than throwing").
- `errors` is separate `useState` next to `form` state.
- `handleChange(field, value)` updates form state, then immediately re-runs `validate()` so errors clear/appear live as the user types (true inline validation, not just on-submit).
- `handleSubmit` re-validates on submit and blocks if `Object.keys(nextErrors).length > 0`.
- Errors render under each field reading from the `errors` object (cross-field validation, like the duplicate-date check via `store.hasPermintaanDuplikat`, is just another branch inside the same `validate` function).

This is the exact shape of what `Login.jsx` (currently one generic `error` string) and `StatusDistribusi.jsx`'s armada/ETA fields need — **lift the same four-part pattern (form state, errors state, validate function, per-field error render) into those components.** This is a copy-the-pattern job, not a new-library job.

**Why not react-hook-form (or Formik, or a schema library like Zod/Yup) here:**
- The forms in scope (Login: 2-3 fields; StatusDistribusi armada/ETA: 2 fields; new city/stock CRUD: 2-3 fields) are small. react-hook-form's value proposition (uncontrolled inputs to minimize re-renders, large/dynamic field arrays, complex cross-field schemas at scale) doesn't apply at this scale — the perf problem it solves doesn't exist in a 3-field login form.
- It would be the only form library in the project, introducing a second validation idiom (`register()`/`Controller` + resolver) alongside the existing hand-rolled one already used in `InputData.jsx` and `ManajemenData.jsx` edit forms — inconsistency is exactly the kind of thing this milestone is trying to *remove*, not add.
- A schema validator (Zod/Yup) adds real value when validation rules are shared across client+server or reused across many forms with overlapping shape. This app has no server, and each form here has its own small, distinct rule set — a shared schema layer is solving a problem this codebase doesn't have.
- The project constraint is explicit: no new dependencies unless a requirement clearly needs one. None of these forms exceed what `useState` + a `validate()` function already handles correctly elsewhere in this exact codebase.

**Confidence: HIGH** — this isn't a debatable ecosystem trend, it's a direct read of working code already in this repo (`src/pages/InputData.jsx:51-91`) plus the documented convention in `.planning/codebase/CONVENTIONS.md` ("Form-level validation returns an error object... rather than throwing").

### 2. Keeping the shared component library consistent — extend, don't replace

The component library is more mature than the "ad-hoc inline styles on 3 pages" framing suggests — it's only Landing/Login/Register that bypass it. The library itself is solid:

- `Card`, `Tombol` (button, with ripple effect via `useRipple`), `Modal` (full focus-trap + Escape handling, accessible dialog), `Tabel`, `PageHeader`, `SectionHeader`, `EmptyState`, `Badge`, `MetricCard`, `ProgressBar`, `Skeleton`, `Tooltip`, `IkonDaun`, `Sparkline`, `Toast` (+ `showToast` helper) — 18 components in `src/components/`, all consuming the same `tokens.css` custom properties (`var(--color-primary)`, `var(--space-6)`, `var(--radius-lg)`, etc.).
- There's already a shared-extraction precedent for auth-style pages: `src/components/auth/AuthShared.jsx` exports `ErrorText`, `FieldIcon`, `RolePills`, `fieldLabelStyle`, `inputBaseStyle` — i.e., Login.jsx already pulls its field styling from a shared module rather than repeating it. **Follow this exact precedent for Register.jsx (it should already be doing this — verify) and reuse the same `AuthShared` exports rather than inventing new field styles.**
- For Landing.jsx specifically (currently 100% inline, no shared imports per PROJECT.md), the fix is mechanical: replace raw `<div style={{...}}>` blocks with `Card`/`Tombol`/`IkonDaun` and replace hardcoded hex/px values with the `tokens.css` variables already used everywhere else (`var(--color-surface)`, `var(--space-*)`, `var(--text-*)`, `var(--radius-*)`).

**Why not introduce a component library (shadcn/ui, Radix, MUI, Chakra, etc.) or a CSS framework (Tailwind):**
- The existing library already covers every primitive Landing/Login/Register need (buttons, cards, inputs via `AuthShared`, icons via `IkonDaun`). Bringing in an external library would mean visually re-skinning the *entire app* to match a new system, or running two design systems side-by-side — both far more expensive than finishing what's 80% done.
- Tailwind would require a build-pipeline change (PostCSS config, content-scanning setup) and a wholesale rewrite of every component's styling approach (`style={{}}` objects → utility classes) — that is a framework-level swap, explicitly excluded by the "no new frameworks/libraries" constraint, and orders of magnitude bigger than "rebuild 3 pages to use existing components."
- The actual documented problem (PROJECT.md) is "these 3 pages don't use the library that already exists," not "the library is insufficient." Adding a new system would not fix the stated problem; it would create a fourth styling approach.

**Confidence: HIGH** — verified directly by reading `Card.jsx`, `Tombol.jsx`, `Modal.jsx`, `EmptyState.jsx`, `AuthShared.jsx`, and `tokens.css`; the library's coverage and consistency are evident from the source, not inferred.

### 3. Safely extending the hand-rolled localStorage pub/sub store with new CRUD — follow the existing mutator contract exactly

`src/store.js` already has a clear, consistent contract for every mutator (confirmed by reading `tambahKota`/`updateKota`/`hapusKota`/`setStokTbs`, which **already exist in the store with zero UI** — per PROJECT.md, this is the actual gap to fill, not a store design problem):

1. Validate input against current `state` (e.g. `tambahKota` throws `Error("Kota dengan nama tersebut sudah ada.")` on duplicate name) — UI catches this and shows it inline/as a toast, it does not need new error-handling infrastructure.
2. Mutate the in-memory `state` object directly (object spread for arrays: `state.daftarKota = [...state.daftarKota, newItem]`).
3. Call `recordActivity(...)` to log the action to `activityLog` (using the actor's name/role from `state.userAktif`) — **every existing mutator does this; new CRUD code must too, to keep `RiwayatAktivitas.jsx` accurate.**
4. Call `notify()`, which internally calls `persistState()` (writes the whole `state` object to `localStorage` under `switera_state_v1`) and then broadcasts a cloned snapshot to all `listeners`.
5. Return `clone(state[key])` — **never return a live reference to internal state.** This is consistent everywhere (`clone()` is `JSON.parse(JSON.stringify(value))`) and is what lets pages safely hold snapshots in component state without risk of外部 mutation.

**The admin city/stock CRUD UI does not need new store methods** — `tambahKota`, `updateKota`, `hapusKota`, and `setStokTbs` already exist and already follow this contract correctly (verified by reading `store.js:247-284`). The actual task is building the page (form + `Tabel` + `Modal`, following the exact same shape as `ManajemenData.jsx`, which already implements "list + edit-in-modal + delete with confirmation" for `permintaan" — same UI pattern, different store methods).

**If any genuinely new store method is needed later** (e.g., a CRUD operation not yet covered), the safe-extension checklist derived from the existing contract is:
- Add validation that throws `Error("...")` with an Indonesian, user-facing message for invariant violations (matches every existing validator).
- Mutate via spread/`map`/`filter`, never direct index mutation, and never mutate a value pulled from `clone()` in place and reassign it back without going through `state.key = ...`.
- Call `recordActivity(...)` before or after the mutation (existing methods do both orders depending on whether they need the "before" snapshot — e.g. `removePermintaan` looks up the item before filtering it out so the activity log message can include its name).
- Always end with `notify()` (or use the existing `updateValue`/`updateCollection` helpers, which already call it).
- Return a `clone()` of the relevant slice of `state`, never the live object.
- New seed data (if needed) belongs in `src/data/*.json` loaded at module scope, following the existing `permintaanSeed`/`kotaSeed` pattern — not hardcoded directly into `state`.

**Why not introduce a state-management library (Zustand, Jotai, Redux Toolkit) or an IndexedDB/Dexie wrapper for persistence:**
- The current store is ~500 lines, already reactive (Set-based pub/sub + `subscribe()`), already debounce-free and synchronous, and every page already knows how to consume it (`useEffect(() => store.subscribe(setSnapshot), [])`). Swapping it for Zustand would mean rewriting every one of the ~10 pages' subscription boilerplate for a result that's behaviorally identical — pure churn with no functional benefit for a single-browser demo.
- `localStorage` (synchronous, ~5-10MB limit, string-only) is correctly sized for this app's data volume (a handful of cities, requests, decisions, notifications, activity log entries — not megabytes of data). IndexedDB's async API and complexity (transactions, object stores, versioned schema migrations) is solving a scale/concurrency problem this single-tab demo doesn't have. The existing `try/catch` around `localStorage` access (already in `store.js`, with the explanatory comment about private-mode/quota failures) is the right amount of defensive coding for this constraint.
- The project's explicit constraint says no new frameworks unless a requirement clearly needs one — no requirement in this milestone needs a new persistence or state-management layer; the requirement is "store methods already exist but have no UI."

**Confidence: HIGH** — derived directly from reading the full `store.js` source and cross-checking every existing mutator (`tambahAkun`, `tambahKota`, `updateKota`, `hapusKota`, `setStokTbs`, `addPermintaan`, `updatePermintaan`, `removePermintaan`, `addKeputusan`, `updateKeputusan`, `removeKeputusan`) for contract consistency — all ~11 mutators follow the same 5-step shape without exception.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Hand-rolled `validate()` + `useState` (existing pattern) | react-hook-form (~9kB gzipped core) | If this app later grows many large, dynamic forms (10+ fields, field arrays, wizard flows) where re-render cost and registration boilerplate start to matter — not the case here |
| Hand-rolled `validate()` + `useState` | Zod/Yup schema validation | If validation rules need to be shared between a future backend and the client (this app explicitly has no backend this milestone) or reused identically across many forms |
| Existing `src/components/*` + `tokens.css` | shadcn/ui, Radix Primitives, MUI, Chakra | If the team were starting a *new* app, or if the existing library were missing primitives needed (it isn't — Modal already has focus-trap + ARIA correctly implemented) |
| Existing `src/components/*` + `tokens.css` | Tailwind CSS | If the team wanted to migrate the entire app's styling approach — a large, out-of-scope change orthogonal to "use the components that already exist" |
| Existing `store.js` pub/sub + `localStorage` | Zustand / Jotai | If the app needed selector-based fine-grained subscriptions to avoid re-rendering every subscriber on every state change — at this app's size (a few dozen subscribers, infrequent mutations) this is not a measurable problem |
| Existing `store.js` pub/sub + `localStorage` | IndexedDB (Dexie.js) | If data volume grew into the megabytes, needed structured querying, or needed to survive across many more entities — not the case for a school-demo dataset of cities/requests/decisions |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| react-hook-form / Formik for the Login, StatusDistribusi, and new city/stock forms | Solves a re-render/scale problem these 2-3-field forms don't have; introduces a second validation idiom alongside the one already used in `InputData.jsx`, undermining the consistency goal of this milestone | The existing `validate(form) -> { field: message }` pattern from `InputData.jsx`, copied into the other forms |
| Zod / Yup / any schema-validation library | No shared client/server schema exists or is planned (explicitly client-only, out of scope); each form's rules are small and distinct | Plain JS `if` checks inside a `validate()` function, as already done |
| Tailwind CSS or any CSS-in-JS library (styled-components, Emotion) | Would require a parallel styling system alongside the existing `style={{}}` + `tokens.css` approach used in all 18 existing components; a framework-level change explicitly excluded by the project's "no new frameworks" constraint | `tokens.css` custom properties, consumed via inline `style` objects, exactly as `Card.jsx`/`Modal.jsx`/`Tombol.jsx` already do |
| A new component/design-system library (MUI, Chakra, Radix, shadcn/ui, Ant Design) | The existing 18-component library already covers every primitive needed (buttons, cards, modals, tables, badges, empty states); adding a second system means dual-maintaining two visual languages | Existing `src/components/*` |
| Zustand / Redux Toolkit / Jotai / Recoil | Store is already reactive and every page already integrates with its `subscribe()` API; swapping introduces app-wide churn for no behavioral gain at this scale | Extend `src/store.js` directly, following its existing mutator contract |
| IndexedDB / Dexie.js / localForage | Solves async/scale/schema-migration problems this single-tab, small-dataset demo doesn't have; adds async complexity to every store read that today is synchronous | `window.localStorage` via the existing `persistState()`/`loadPersisted()` functions in `store.js` |
| Any new HTTP client (axios, ky, TanStack Query) | There is no backend this milestone; nothing to fetch | N/A — store reads/writes are synchronous and local |

## Stack Patterns by Variant

**If a future milestone reintroduces a real backend:**
- Re-evaluate `store.js` at that point — its mutator contract (validate → mutate → log → notify → return clone) maps cleanly onto an API client layer, but a true backend would likely warrant TanStack Query or SWR for server-state caching, and the `localStorage` persistence layer would become a cache rather than the source of truth. Not relevant to this milestone.

**If the new Admin city/stock CRUD UI turns out to need more than 3-4 fields per form or nested data entry:**
- Still prefer the hand-rolled pattern first; only reconsider react-hook-form if the form grows to dynamic field arrays (e.g., bulk-editing many cities at once in one form). Based on the existing store methods (`nama`, `kapasitas` for kota; a single numeric value for `stokTbs`), this threshold will not be reached in this milestone.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| react ^18.3.1 | react-dom ^18.3.1 | Already matched in `package.json`; no action needed |
| vite ^7.0.0 | @vitejs/plugin-react ^4.7.0 | Already matched; no action needed |
| chart.js ^4.5.1 | react-chartjs-2 ^5.3.0 | Already matched and in active use (`Dashboard.jsx`, `Laporan.jsx`, `AnalisisRanking.jsx`) — no version changes needed or recommended for this milestone |

No new packages are being introduced, so no new compatibility surface is created by this milestone.

## Sources

- Direct source reads (HIGH confidence, primary evidence): `C:\Users\acer\Switera\src\store.js` (full file, all ~11 mutators), `src\pages\InputData.jsx` (validation pattern, lines 1-179), `src\pages\Login.jsx` (current auth form + `AuthShared` usage), `src\pages\ManajemenData.jsx` (existing CRUD-with-modal precedent), `src\components\Card.jsx`, `Tombol.jsx`, `Modal.jsx`, `EmptyState.jsx`, `src\tokens.css`, `package.json`
- `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md` — project constraints and documented existing patterns (HIGH confidence, internal project documents)
- General ecosystem claims about React 18 native form-handling patterns and react-hook-form's value proposition/footprint are well-established, slow-moving facts as of this agent's training; **live web verification was attempted but both the Bash tool (for the `gsd-tools` research-plan seam) and the WebSearch tool were denied by the sandbox in this session**, so these specific claims carry MEDIUM confidence rather than HIGH and should be spot-checked if a planner wants certainty on exact current bundle-size numbers — the architectural reasoning (form size/complexity threshold) does not depend on exact figures and holds regardless

---
*Stack research for: client-only React 18 + Vite SPA completion/polish milestone (Switera)*
*Researched: 2026-06-21*
