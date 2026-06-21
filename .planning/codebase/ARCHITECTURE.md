# Architecture

**Analysis Date:** 2026-06-21

## Pattern Overview

**Overall:** Client-only React SPA with a hand-rolled "fake backend" singleton store

**Key Characteristics:**
- No server, no API, no database — everything runs in the browser
- A single in-memory + `localStorage`-backed store (`src/store.js`) plays the role of backend/database/auth provider
- Manual URL routing via `window.history.pushState` instead of React Router
- Role-based menu/page gating is UI-only (cosmetic), not a real authorization layer
- One large page component per route, each importing the shared `store` directly

## Layers

**Page Layer:**
- Purpose: Render a full route's UI and own its local interaction state
- Contains: `src/pages/*.jsx` (e.g. `Dashboard.jsx` 1534 lines, `Landing.jsx` 1619 lines, `KeputusanDistribusi.jsx`, `AnalisisRanking.jsx`, `StatusDistribusi.jsx`)
- Depends on: `store` (direct import), shared components, `src/utils/*`
- Used by: `pageRegistry` in `src/App.jsx`

**Shared Component Layer:**
- Purpose: Reusable UI primitives and chrome
- Contains: `src/components/*.jsx` (`Layout.jsx` app shell, `Card.jsx`, `Modal.jsx`, `Tabel.jsx`, `Toast.jsx`, `Tombol.jsx`, `PetaGeografis.jsx` map, etc.)
- Depends on: `store` (some components, e.g. `Layout.jsx`, read store directly for notifications/user), design tokens in `src/tokens.css`
- Used by: Page layer

**Store Layer ("fake backend"):**
- Purpose: Single source of truth for all application data; substitutes for a real backend/database
- Contains: `src/store.js` — a pub/sub singleton with getters/mutators (`addPermintaan`, `addKeputusan`, `cariAkun`, etc.)
- Depends on: `window.localStorage`, seed data in `src/data/*.json`
- Used by: Every page and several components, via `import store from "../store"`

**Utility Layer:**
- Purpose: Pure-ish business logic and formatting helpers, decoupled from React
- Contains: `src/utils/distribusi.js` (ranking/recommendation calculations), `src/utils/forecast.js` (per-city forecasting), `src/utils/csv.js`, `src/utils/format.js`, `src/utils/waktu.js`, `src/utils/navigation.js` (role→menu maps), `src/utils/chartDefaults.js`
- Depends on: Plain JS, no React/store imports (these are the most testable units in the codebase)
- Used by: Pages, for computing KPIs/rankings/charts

## Data Flow

**App Boot:**

1. `src/main.jsx` mounts `<App />` into `#root`
2. `src/store.js` module evaluates at import time: reads `localStorage["switera_state_v1"]`, falls back to seed JSON in `src/data/`, builds in-memory `state` object
3. `App.jsx` calls `store.getState()` for initial `snapshot`, subscribes to future updates via `store.subscribe()`

**User Interaction (e.g. submitting a form):**

1. Page component (e.g. `InputData.jsx`) calls a store mutator, e.g. `store.addPermintaan(entry)`
2. Mutator clones current state, applies the change, reassigns `state[key]`
3. Mutator calls `notify()` → `persistState()` writes the *entire* state object back to `localStorage`, then all subscribed listeners are called with a fresh `clone(state)`
4. `App.jsx`'s subscription callback calls `setSnapshot(nextSnapshot)`, triggering a React re-render with the new data
5. Side effects (toast notifications, activity log entries) are queued synchronously inside the same mutator via `pushNotifikasi` / `recordActivity`

**Routing (no React Router):**

1. `App.jsx` tracks `route` state, initialized from `window.location.pathname`
2. `navigateTo`/`navigatePage` call `window.history.pushState` then update React state, wrapped in `document.startViewTransition` when available (`withViewTransition`, `src/App.jsx:46-55`)
3. A `popstate` listener (`src/App.jsx:95-102`) re-syncs `route` state on browser back/forward
4. A chain of `useEffect`s (`src/App.jsx:90-134`) resolves `route` + `roleAktif` + `userAktif` into the page actually rendered — this is the most fragile part of the app (see CONCERNS.md)

**State Management:**
- No React Context, Redux, Zustand, etc. — a single module-scoped object in `src/store.js` is the entire app's state
- Persisted synchronously and fully (not incrementally) to `localStorage` on every mutation
- `store.getState()` and most getters return a deep clone (`JSON.parse(JSON.stringify(...))`) to prevent external mutation of internal state

## Key Abstractions

**Store (singleton):**
- Purpose: Acts as the entire backend — auth, persistence, business mutations, notifications, activity logging
- Examples: `src/store.js` exports a single `store` object with ~30 methods (`addPermintaan`, `updateKeputusan`, `cariAkun`, `setStokTbs`, ...)
- Pattern: Module-level singleton + observer/pub-sub (`subscribe`/`listeners`/`notify`)

**Page Registry:**
- Purpose: Maps a logical page key (string) to both a React component and a URL path
- Examples: `pageRegistry`, `pathByPage`, `pageByPath` in `src/App.jsx:18-42`
- Pattern: Plain object lookup tables, no router library

**Role-based Menu Config:**
- Purpose: Declares which pages each of the three roles (`Admin`, `Manajer Distribusi`, `Tim Logistik`) can see/access
- Examples: `menuByRole`, `getDefaultMenuByRole` in `src/utils/navigation.js`
- Pattern: Static config object; enforcement happens only in `App.jsx`'s `allowedPages` check (UI-level, not a security boundary)

## Entry Points

**App Bootstrap:**
- Location: `src/main.jsx`
- Triggers: Page load (Vite serves `index.html` → loads this module)
- Responsibilities: Mount `<App />` into the DOM root

**Router/Shell:**
- Location: `src/App.jsx`
- Triggers: Every navigation (pushState or popstate)
- Responsibilities: Resolve current route + auth/role state into the page to render; gate access to authenticated pages; render `Layout` wrapper for authenticated views

## Error Handling

**Strategy:** Defensive `try/catch` around browser-API calls only (localStorage, matchMedia); no app-wide error boundary

**Patterns:**
- `try/catch` swallowing in `src/store.js` for `localStorage` read/write (`loadPersisted`, `persistState`) — failures degrade silently to in-memory-only state
- Validation errors thrown as plain `Error` from store mutators (e.g. `tambahKota` throws `"Kota dengan nama tersebut sudah ada."`) — calling pages are expected to catch these themselves
- No React error boundary component found — an unhandled render error would produce a blank/broken page

## Cross-Cutting Concerns

**Logging:**
- Application-level activity logging is a first-class feature: `recordActivity`/`pushActivity` in `src/store.js:157-174` write to `state.activityLog`, surfaced on `src/pages/RiwayatAktivitas.jsx`
- No developer-facing logging framework (no Winston/Pino); relies on default browser console

**Validation:**
- Ad-hoc, inline in store mutators (e.g. duplicate-city check in `tambahKota`, duplicate-request check in `hasPermintaanDuplikat`)
- No schema validation library (no Zod/Yup)

**Authentication:**
- `store.cariAkun(username, password, role)` does a plaintext string match against `state.daftarAkun` (`src/store.js:213-223`)
- "Session" is just `state.userAktif`, persisted to `localStorage` in plaintext alongside everything else
- No real authorization: page/menu gating in `App.jsx` and `navigation.js` only hides UI, it does not prevent calling store mutators directly

---

*Architecture analysis: 2026-06-21*
*Update when major patterns change*
