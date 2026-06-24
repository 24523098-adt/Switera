# Architecture Research

**Domain:** Extending a hand-rolled client-only React SPA (singleton pub/sub store + manual pushState router) with new CRUD surface and role-differentiated rendering
**Researched:** 2026-06-21
**Confidence:** HIGH (all findings verified directly against `src/App.jsx`, `src/store.js`, `src/pages/*.jsx` in this repo — no external library research needed; this is a "fit the existing system" question, not a "what does the ecosystem offer" question)

## Standard Architecture

### System Overview

This is **not** a greenfield architecture decision — the system already exists and the constraint is explicit: no new state library, no new router. The "standard architecture" here is *the architecture Switera already has*, and the job is to extend it without breaking its invariants.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Page Layer (src/pages/*.jsx)                  │
│  One big component per route. Owns local UI state (forms, modals,     │
│  filters). Subscribes to store directly. No props drilled from App.   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │ Dashboard  │ │ManajemenData│ │  Laporan   │ │  ManajemenKota(NEW) │ │
│  │(role-split)│ │  (CRUD)    │ │(needs split)│ │       (CRUD)        │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────────┬───────────┘ │
├────────┴──────────────┴──────────────┴────────────────────┴───────────┤
│                  Shared Component Layer (src/components/*.jsx)        │
│  Card, Modal, Tabel, PageHeader, SectionHeader, Tombol, EmptyState,    │
│  Toast, Layout (app chrome) — all style-token driven, store-agnostic   │
│  except Layout/Toast which read store for chrome-level state           │
├─────────────────────────────────────────────────────────────────────────┤
│                    Store Layer (src/store.js — singleton)             │
│  Module-scope `state` object + `notify()` pub/sub + deep-clone getters │
│  Mutators: tambahKota/updateKota/hapusKota/setStokTbs (EXIST, unused)  │
│  Persists entire state to localStorage synchronously on every mutation │
├─────────────────────────────────────────────────────────────────────────┤
│              Router/Shell Layer (src/App.jsx — 4 useEffects)          │
│  pageRegistry / pathByPage / pageByPath lookup tables (plain objects)  │
│  route ←→ activePage ←→ roleAktif ←→ userAktif reconciliation          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation (in this repo) |
|-----------|----------------|------------------------|
| `App.jsx` | Resolves `route` + `roleAktif` + `userAktif` into one rendered page; owns navigation functions (`navigateTo`, `navigatePage`) | Plain object lookup tables + 4 chained `useEffect`s, no router library |
| `pageRegistry` / `pathByPage` / `pageByPath` | Declarative map: page key ↔ component ↔ URL path | 3 parallel plain objects defined at module scope in `App.jsx` |
| `menuByRole` / `getDefaultMenuByRole` (`navigation.js`) | Declares which page keys each role may see; supplies the "default page" fallback | Static config object, consumed by `App.jsx`'s `allowedPages` memo |
| Page component (e.g. `ManajemenData.jsx`) | Renders one full route; owns local form/modal/filter state; calls store mutators directly; subscribes to store for live data | `useState(store.getState())` + `store.subscribe()` in a `useEffect`, mirrored in nearly every page |
| Store (`store.js`) | Single source of truth, fake backend: CRUD mutators, auth, notifications, activity log, localStorage persistence | Singleton object literal, module-scope `state`, `notify()` broadcasts to `listeners` Set |
| Shared components (`Card`, `Modal`, `Tabel`, `PageHeader`, `Tombol`, `EmptyState`, etc.) | Visual/structural primitives, consistent design system | Plain React components, mostly store-agnostic, styled via CSS custom properties (`var(--color-*)`, `var(--space-*)`) |

## Recommended Project Structure

No new top-level structure is needed or wanted. The correct move is to **add files that match the existing shape exactly**:

```
src/
├── pages/
│   ├── ManajemenData.jsx       # existing CRUD precedent to copy structurally
│   ├── ManajemenKota.jsx       # NEW — cities/stock CRUD page, same shape as ManajemenData.jsx
│   └── Laporan.jsx             # MODIFY — split into role-dispatcher + two sub-renderers
├── components/
│   └── (unchanged)             # reuse Card/Modal/Tabel/PageHeader/Tombol/EmptyState as-is
├── utils/
│   └── navigation.js           # MODIFY — add new page key to relevant role(s) menuByRole entry
├── store.js                    # NO CHANGE NEEDED — tambahKota/updateKota/hapusKota/setStokTbs already exist
└── App.jsx                     # MODIFY — register new page in pageRegistry + pathByPage only
```

### Structure Rationale

- **No new folders.** A "feature folder" or "module" pattern would be idiomatic in a fresh app, but here it's actively wrong — it would be the only feature organized differently from every other page, increasing review friction with zero benefit at this scale (8 pages total).
- **One new page file, not several.** Following `ManajemenData.jsx`'s precedent (single file: table + edit modal + delete modal + inline-edit affordance), `ManajemenKota.jsx` should be a single file containing the city list/table, an add/edit modal, a delete-confirm modal, and the stock (`stokTbs`) editor — not split into sub-components prematurely. Split later only if it organically grows past ~500-600 lines the way `Dashboard.jsx`/`Landing.jsx` did.
- **Role-split pages follow the `Dashboard.jsx` precedent, not a new pattern.** `Dashboard.jsx` already solves "render different content per role on the same route" by being a thin dispatcher (`contentByRole[roleAktif]`) over locally-defined sub-components (`DashboardAdmin`, `DashboardManajer`, `DashboardLogistik`) in the same file. `Laporan.jsx` should adopt the identical shape rather than inventing a new one (e.g. a `<RoleGate>` wrapper component, which doesn't exist anywhere else in the codebase and would be a new abstraction for a one-off need).

## Architectural Patterns

### Pattern 1: Store-First CRUD Page (the `ManajemenData.jsx` shape)

**What:** A page component that (a) subscribes to the store snapshot, (b) derives a filtered/sorted view with `useMemo`, (c) renders a `Tabel` with an `aksi` (actions) render-prop for edit/delete buttons, (d) manages two pieces of local state for modals (`editForm`/`isEditOpen`, `deleteTarget`), and (e) validates inline before calling the store mutator, catching/displaying errors from thrown `Error`s.

**When to use:** Any new entity with full CRUD — this is exactly the cities/stock requirement.

**Trade-offs:**
- Pro: Zero new concepts; matches `ManajemenData.jsx` line for line in skeleton, so a reviewer who knows that file already knows this one.
- Pro: Validation pattern (`validateEditForm` returning an errors object, checked both on field change and on submit) is already proven and matches the "field-level inline validation" requirement style elsewhere in PROJECT.md.
- Con: No abstraction reuse across pages (each page reimplements its own modal/validation wiring) — accepted cost of this codebase's style; do not "fix" this by extracting a generic `useCrudPage` hook in this milestone, since that would be exactly the kind of unrequested refactor the constraints exclude.

**Example (skeleton to follow for `ManajemenKota.jsx`):**
```jsx
import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";

function ManajemenKota({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [formState, setFormState] = useState({ nama: "", kapasitas: "" });
  const [formErrors, setFormErrors] = useState({});
  const [editTarget, setEditTarget] = useState(null); // null = "add" mode, object = "edit" mode
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

  const submitKota = () => {
    try {
      if (editTarget) {
        store.updateKota(editTarget.nama, formState);
      } else {
        store.tambahKota(formState);
      }
      showToast({ type: "success", message: "Data kota berhasil disimpan." });
      setEditTarget(null);
    } catch (error) {
      // store mutators throw plain Error — page is responsible for catching (existing convention)
      setFormErrors({ nama: error.message });
    }
  };

  // ...render Tabel + Modal, same shape as ManajemenData.jsx
}

export default ManajemenKota;
```

### Pattern 2: Thin Role Dispatcher on a Single Route (the `Dashboard.jsx` shape)

**What:** The route-level component reads `roleAktif` from the snapshot, builds a `contentByRole` lookup object mapping each role string to a JSX element (a differently-named sub-component defined in the same file, receiving only the props it needs), and renders `contentByRole[roleAktif] ?? <EmptyState .../>`.

**When to use:** Any existing single-route page that must show meaningfully different content per role without becoming two routes — exactly the `Laporan.jsx` requirement (Manajer Distribusi vs Tim Logistik).

**Trade-offs:**
- Pro: Zero changes to `App.jsx`, `pageRegistry`, `pathByPage`, or `navigation.js` — the route/menu system is completely untouched, which is the single highest-value property here given how fragile that reconciliation chain already is (see CONCERNS.md).
- Pro: `roleAktif` is already read into `Laporan.jsx` today (`const roleAktif = roleOptions.includes(...) ? ... : "Manajer Distribusi"`) — the computed value exists, it's just never branched on. This is a pure "finish what's there" change, not new wiring.
- Con: Both role-variants still mount under the one `Laporan` export, so any data-fetching/memoization shared by both variants must be lifted to the parent and passed down as props (mirroring how `Dashboard.jsx` passes `permintaan`/`keputusan`/`userAktif` down to each role's sub-component) — don't let each sub-component re-subscribe to the store independently.

**Example (apply directly to `Laporan.jsx`):**
```jsx
function LaporanManajer({ filteredRiwayat, chartConfig, periode, onExport }) {
  // existing Laporan.jsx body — full history table + trend chart — unchanged
}

function LaporanLogistik({ filteredRiwayat, periode, onExport }) {
  // logistik-relevant subset only, e.g. status/ETA-focused columns, no trend chart
  // or a narrower KPI card — whatever the actual differentiation requirement specifies
}

function Laporan({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  useEffect(() => store.subscribe(setSnapshot), []);

  const roleAktif = roleOptions.includes(snapshot.roleAktif)
    ? snapshot.roleAktif
    : "Manajer Distribusi";

  // shared computation (range, filteredRiwayat, chartConfig) stays here, computed once

  const contentByRole = {
    "Manajer Distribusi": <LaporanManajer {...sharedProps} />,
    "Tim Logistik": <LaporanLogistik {...sharedProps} />,
  };

  return (
    <>
      <PageHeader judul="Laporan Distribusi" ... />
      {contentByRole[roleAktif] ?? <EmptyState pesan="Role aktif belum dikenali." />}
    </>
  );
}
```

**Why not a generic `<RoleGate role={...}>` wrapper component instead?** It doesn't exist anywhere in the codebase today (`Dashboard.jsx` solves the identical problem with a plain lookup object, no wrapper abstraction), and introducing one here would be a one-off pattern fork for a single page — exactly the kind of "idealized rewrite" this question explicitly asks to avoid. Match precedent over inventing a cleaner abstraction.

### Pattern 3: Additive Route Registration (extending `App.jsx` without touching the `useEffect` chain)

**What:** Adding a new page to the router consists of exactly three additive edits, none of which touch the four `useEffect`s in `App.jsx:90-134`:
1. Add the new component to `pageRegistry` (object literal, `App.jsx:18-27`)
2. Add its path to `pathByPage` (object literal, `App.jsx:29-38`) — `pageByPath` derives automatically via `Object.fromEntries`
3. Add its page key to the relevant role(s) in `menuByRole` (`navigation.js`)

**When to use:** Adding the cities/stock management page as a new route (e.g. `manajemen-kota` / `/manajemen-kota`) for the Admin role.

**Trade-offs:**
- Pro: This is genuinely safe — the four `useEffect`s key off `allowedPages` (derived from `menuByRole[roleAktif]`) and `pageByPath`/`pathByPage` lookups generically; they have no hardcoded page names, so a new entry in the three lookup tables flows through existing logic without modification.
- Pro: Matches CONCERNS.md's own prescribed safe-modification procedure verbatim ("consider adding the new page to `pageRegistry`/`pathByPage`/`navigation.js` first, then test login as each of the three roles").
- Con / risk to verify: If the new page key is added to `menuByRole.Admin` but *not* added to `pageRegistry`, `App.jsx`'s fallback (`pageRegistry[activePage] ?? Dashboard`) will silently render `Dashboard` instead of erroring — silent-wrong-page is the realistic failure mode, not a crash. Always add to `pageRegistry` and `pathByPage` together, in the same commit, before touching `menuByRole`.

**Example:**
```jsx
// App.jsx — additive only, no existing line changes
import ManajemenKota from "./pages/ManajemenKota";

const pageRegistry = {
  dashboard: Dashboard,
  "input-data": InputData,
  "manajemen-data": ManajemenData,
  "manajemen-kota": ManajemenKota,   // NEW
  // ...unchanged
};

const pathByPage = {
  dashboard: "/dashboard",
  "manajemen-data": "/manajemen-data",
  "manajemen-kota": "/manajemen-kota",   // NEW
  // ...unchanged
};
```
```js
// navigation.js — additive only
export const menuByRole = {
  Admin: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "input-data", label: "Input Data", icon: "input" },
    { key: "manajemen-data", label: "Manajemen Data", icon: "database" },
    { key: "manajemen-kota", label: "Manajemen Kota", icon: "city" },   // NEW
    { key: "riwayat-aktivitas", label: "Riwayat Aktivitas", icon: "report" },
  ],
  // Manajer Distribusi / Tim Logistik unchanged — new page is Admin-only
};
```

## Data Flow

### Request Flow (CRUD mutation — applies identically to new cities/stock feature)

```
[User submits add/edit/delete city form in ManajemenKota.jsx]
    ↓
[Page-local validation (validateForm-style function, mirrors ManajemenData.jsx)]
    ↓ (if valid)
[store.tambahKota(...) / store.updateKota(...) / store.hapusKota(...)]
    ↓
[Mutator clones state.daftarKota, applies change, recordActivity(...), notify()]
    ↓
[notify() → persistState() writes full state to localStorage, then broadcasts clone(state) to all listeners]
    ↓
[Every subscribed page's setSnapshot(nextSnapshot) fires → React re-renders with new daftarKota]
    ↓
[ManajemenKota.jsx's own table re-renders; InputData.jsx's kota dropdown also updates automatically — no extra wiring needed]
```

This is the single most important property to preserve: **because every page subscribes to the *whole* store snapshot**, a new mutator's effects propagate to *every other page that reads that slice* for free. `InputData.jsx` already reads `snapshot.daftarKota` — once `tambahKota`/`hapusKota` are wired into a real UI, `InputData.jsx`'s dropdown and empty-state requirement get the new data with zero additional plumbing.

### State Management (unchanged — do not introduce anything new here)

```
[store.js module-scope `state` object]
    ↓ (subscribe, on mount, in every page component)
[Page components: useState(store.getState()) + store.subscribe(setSnapshot) in useEffect]
    ↓ (user action)
[Page calls store.<mutator>(...) directly — no dispatch/action-creator layer]
    ↓
[Mutator mutates `state`, calls notify()]
    ↓ (back to top)
[All subscribers re-render synchronously]
```

No Context, no Redux/Zustand, no event bus — confirmed by `ARCHITECTURE.md` codebase audit and re-verified by reading `store.js` directly. The cities/stock feature introduces **zero new state-management surface**: `tambahKota`, `updateKota`, `hapusKota`, and `setStokTbs` already exist on the store object (`store.js:247-284`) and already call `recordActivity` + `notify()` correctly. This phase is **UI-only** — the backend-equivalent layer is already done.

### Key Data Flows

1. **City CRUD → cross-page propagation:** Adding/editing/removing a city in the new `ManajemenKota.jsx` page updates `state.daftarKota`, which is read by at least `InputData.jsx` (dropdown population + the new empty-state requirement) and any ranking/distribution page that resolves `getKapasitasKota`. No explicit "refresh" call is needed anywhere — this is the store's core value proposition and the new feature should lean on it, not work around it.
2. **Stock (`stokTbs`) update → dashboard/decision flow:** `setStokTbs` already feeds `DashboardManajer` (passed as a prop in `Dashboard.jsx:1521`) and presumably the distribution recommendation engine in `utils/distribusi.js`. Confirm at planning time whether `distribusi.js` reads `getStokTbs()` directly or receives it as an argument from a page, so the new admin-facing stock editor doesn't accidentally bypass whatever read path the recommendation engine uses.
3. **Role switch → menu/route reconciliation:** Switching `roleAktif` (via `Layout.jsx`'s role switcher, used for demo purposes since there's no real per-account session restriction beyond login) re-triggers the `allowedPages` memo in `App.jsx`, which re-triggers the "redirect to default page if current page isn't allowed" `useEffect`. Any new page added to `menuByRole.Admin` only must be tested by logging in as each of the three roles and confirming no redirect loop — this is the chain CONCERNS.md flags as fragile, and it is touched (read, not modified) by this milestone's role-differentiation work on `Laporan.jsx` only insofar as `roleAktif` is read, not written.

## Scaling Considerations

Not relevant in the conventional sense — this is a single-browser school-project demo with no concurrent users (see PROJECT.md Out of Scope, CONCERNS.md Scaling Limits). The "scaling" axis that matters here is **codebase scaling**, not load scaling:

| Concern | At current size (8 pages, ~30 store methods) | If 5 more CRUD entities were added later | If this became a real multi-user app |
|---------|--------------------------------------------|-------------------------------------------|----------------------------------------|
| Store mutator count | Fine — flat object with ~30 methods is still scannable | Would start to want grouping (e.g. `store.kota.add` namespacing) but not urgent yet | Would need a real backend; the deep-clone-everything model breaks down entirely |
| `App.jsx` lookup tables | Fine — 3 parallel objects, 8 entries each | Still fine up to maybe 15-20 routes; beyond that, generate `pathByPage`/`pageByPath` from a single source-of-truth array instead of hand-maintaining 2-3 parallel objects | Would justify migrating to `react-router-dom` per CONCERNS.md's own fix-approach note |
| Full-state localStorage write per mutation | Fine — seed datasets are small | Starts to matter once `permintaan`/`activityLog` arrays grow into the hundreds+ | Becomes a hard blocker; needs a real database |

### Scaling Priorities

1. **First bottleneck (already flagged in CONCERNS.md, not in scope this milestone):** Full-state deep-clone-on-every-read/write in `store.js`. The new cities/stock CRUD adds a handful of small mutations (`daftarKota` is ~8 entries) — negligible marginal cost. Do not "fix" this as part of this milestone; it's explicitly out of scope per PROJECT.md ("no new pages, roles, or business domains" and the constraint to avoid new state libraries).
2. **Second bottleneck (relevant to *this* milestone, but only as a thing to avoid making worse):** The four-`useEffect` route/role/auth chain in `App.jsx`. Every new page added to the lookup tables is a small additive risk to this chain's correctness, not its performance. Mitigate by testing all three roles after the new route is added, per CONCERNS.md's own prescribed procedure — do not attempt to refactor the chain itself as a side effect of adding one page.

## Anti-Patterns

### Anti-Pattern 1: Introducing a second state-management mechanism for the new feature

**What people do:** Reach for `useContext` + `useReducer`, or a small new "local store" file just for cities/stock, reasoning "it's a new domain, it deserves its own slice."

**Why it's wrong:** Violates the explicit constraint ("no new state-management library... keep the existing footprint") and — more importantly — breaks the cross-page propagation property described above. If city data lived in a separate context, `InputData.jsx`'s dropdown wouldn't automatically see new cities added via the admin page; you'd have to manually wire two systems together. The existing singleton store already has `daftarKota` as a top-level state key with working mutators — there is no integration gap to fill, only a missing UI.

**Do this instead:** Use `store.tambahKota` / `store.updateKota` / `store.hapusKota` / `store.setStokTbs` exactly as they exist. If a method is missing some increment of validation logic (e.g. case-insensitive duplicate-name check), add it to the existing mutator in `store.js`, do not shadow it with page-local duplicate logic.

### Anti-Pattern 2: Splitting `Laporan.jsx` into two separate route/page components

**What people do:** Create `LaporanManajer.jsx` and `LaporanLogistik.jsx` as two distinct page files, each registered as its own entry in `pageRegistry`/`pathByPage`, with `menuByRole` pointing each role at its own route.

**Why it's wrong:** This doubles the surface area touching the fragile `App.jsx` route/role chain for a requirement that doesn't need new routes — both roles are explicitly described as viewing "Laporan" at the same conceptual destination, just with different content. It also duplicates the shared computation (`range`, `filteredRiwayat`, `chartConfig` derivation) across two files instead of once. CONCERNS.md is explicit that adding pages is the highest-risk kind of change to this router; avoid it when a same-route role-split (Pattern 2 above) fully satisfies the requirement.

**Do this instead:** Single `Laporan.jsx` route, role-dispatcher pattern matching `Dashboard.jsx`, as shown in Pattern 2.

### Anti-Pattern 3: Bypassing the store's validation/activity-logging convention for the new CRUD UI

**What people do:** Call `store.daftarKota` mutation logic by reaching into store internals, or perform city-name uniqueness checks in the page component instead of relying on/extending the store's own thrown-`Error` validation (`tambahKota` already throws `"Kota dengan nama tersebut sudah ada."`).

**Why it's wrong:** Breaks the established convention (seen in `ManajemenData.jsx`'s `hasPermintaanDuplikat` check delegated to the store, not reimplemented in the page) where business-rule validation lives in `store.js` and the page's job is only to catch and display it. It also risks activity-log entries (`recordActivity`) being skipped if a page works around the mutator instead of calling it.

**Do this instead:** Always call the existing `tambahKota`/`updateKota`/`hapusKota`/`setStokTbs` mutators, wrap calls in `try/catch`, and surface `error.message` as a field-level error — exactly the shape already used implicitly by `ManajemenData.jsx`'s validation pattern, just routed through a thrown error instead of a pre-check (both are acceptable; thrown-error catching is slightly preferred here since the duplicate-check logic already exists store-side and shouldn't be duplicated in the page).

## Integration Points

### External Services

None. This is a fully client-only app (confirmed in PROJECT.md Out of Scope and codebase ARCHITECTURE.md) — there are no external services to integrate for this milestone.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| New `ManajemenKota.jsx` page ↔ `store.js` | Direct import (`import store from "../store"`), synchronous method calls + subscription | Identical to every other page; no new boundary type introduced |
| New `ManajemenKota.jsx` page ↔ `App.jsx` | Registered via `pageRegistry`/`pathByPage`, receives `onNavigate` prop like every other page | Additive registration only, per Pattern 3 above |
| New `ManajemenKota.jsx` page ↔ `navigation.js` | `menuByRole.Admin` gains one entry; no other role gains access (cities/stock is an Admin-only concern per PROJECT.md's "Admin can add, edit, and delete cities" requirement) | Confirms `allowedPages` in `App.jsx` will correctly gate this page to Admin only, since it derives from `menuByRole[roleAktif]` |
| `Laporan.jsx` internal role-split ↔ `App.jsx`/router | None — the route/role-gating system is untouched; only the *render output* of the existing `laporan` page key changes internally | This is the safest possible way to satisfy the requirement, by design |
| New CRUD mutators ↔ existing pages reading `daftarKota`/`stokTbs` | Implicit, via store subscription | `InputData.jsx` (dropdown + empty-state requirement) and `Dashboard.jsx`'s `DashboardManajer` (stock display) automatically receive updates — verify these downstream consumers still render correctly once cities can actually be added/removed/zero-capacity, especially `InputData.jsx`'s new "no cities configured" empty state, which is a related Active requirement in PROJECT.md |

## Sources

- `src/App.jsx` (full file, read directly) — router/shell, page registry, 4-effect reconciliation chain — HIGH confidence (primary source, current repo state)
- `src/store.js` (full file, read directly) — singleton pub/sub store, existing `tambahKota`/`updateKota`/`hapusKota`/`setStokTbs` mutators — HIGH confidence (primary source, current repo state)
- `src/utils/navigation.js` (full file, read directly) — `menuByRole`/`getDefaultMenuByRole` — HIGH confidence (primary source, current repo state)
- `src/pages/ManajemenData.jsx` (full file, read directly) — CRUD page precedent (form/modal/validation/inline-edit shape) — HIGH confidence (primary source, current repo state)
- `src/pages/Laporan.jsx` (full file, read directly) — page needing role-differentiation, already computes unused `roleAktif` — HIGH confidence (primary source, current repo state)
- `src/pages/Dashboard.jsx` lines 1480-1535 (read directly) — existing role-dispatcher precedent (`contentByRole` lookup pattern) — HIGH confidence (primary source, current repo state)
- `.planning/PROJECT.md` — Active requirements, constraints (no new state lib/router), Indonesian domain terminology convention — HIGH confidence (primary source)
- `.planning/codebase/ARCHITECTURE.md` — prior full-codebase architecture analysis — HIGH confidence (primary source, internally generated from this same repo)
- `.planning/codebase/CONCERNS.md` — fragility of the 4-`useEffect` chain, prescribed safe-modification procedure — HIGH confidence (primary source, internally generated from this same repo)

No external/web research was performed for this question: it is purely about fitting new work into an already-fully-read, already-fully-understood local codebase, not about evaluating ecosystem options. All claims above are traceable to specific files/line ranges in this repository as of 2026-06-21.

---
*Architecture research for: extending Switera's hand-rolled store + manual router with new CRUD + role-differentiated rendering*
*Researched: 2026-06-21*
