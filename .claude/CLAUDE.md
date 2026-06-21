<!-- GSD:project-start source:PROJECT.md -->

## Project

**Switera**

Switera is a client-only React SPA for managing the distribution of TBS (kelapa sawit / palm fruit) stock across cities — covering requests, ranking-based distribution decisions, status tracking, reporting, and activity history, with three distinct roles (Admin, Manajer Distribusi, Tim Logistik). It's a school project meant to demo at production quality: complete features, proper validation, consistent UI, and clean code, while deliberately staying client-only (no real backend) for this milestone.

**Core Value:** The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

### Constraints

- **Tech stack**: React 18 + Vite 7, no new frameworks/libraries beyond what's already in `package.json` unless a requirement clearly needs one — keeps the app simple and consistent with its current footprint
- **Persistence**: `window.localStorage` via the existing `src/store.js` singleton — no real backend this milestone
- **Design system**: Reuse existing shared components (`src/components/*`) and tokens (`src/tokens.css`) rather than introducing new styling approaches — required to fix the design-consistency gap, not optional
- **Scope**: Completion and polish of existing functionality only — no new pages, roles, or business domains

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (JSX) - React components and application logic, `src/**/*.jsx`
- CSS - Styling and design tokens, `src/index.css`, `src/tokens.css`, `src/styles/animations.css`
- HTML - Single page shell, `index.html`
- JSON - Static seed data, `src/data/*.json`

## Runtime

- Node.js (version not pinned — no `.nvmrc` or `engines` field in `package.json`)
- Browser runtime: modern evergreen browsers (ES modules used directly via Vite)
- npm (lockfile present: `package-lock.json`)
- `package.json` declares `"type": "module"` (ESM project)

## Frameworks

- React 18.3.1 - UI framework, function components + hooks throughout `src/pages/` and `src/components/`
- React DOM 18.3.1 - DOM rendering, mounted in `src/main.jsx`
- None detected. No test runner, test config, or `*.test.*`/`*.spec.*` files found in the repo.
- Vite 7.0.0 - Dev server and bundler, configured in `vite.config.js`
- @vitejs/plugin-react 4.7.0 - React Fast Refresh / JSX transform plugin for Vite

## Key Dependencies

- `react` ^18.3.1 - Application UI runtime
- `react-dom` ^18.3.1 - DOM renderer
- `leaflet` ^1.9.4 - Interactive map rendering, used in `src/components/PetaGeografis.jsx` (geographic distribution map)
- `chart.js` ^4.5.1 + `react-chartjs-2` ^5.3.0 - Charting library used for dashboard analytics in `src/pages/Dashboard.jsx`, `src/pages/Laporan.jsx`, `src/pages/AnalisisRanking.jsx`, and configured centrally in `src/utils/chartDefaults.js`
- None — no ORM, no HTTP client library (no axios/fetch wrapper), no state-management library beyond a hand-rolled store (`src/store.js`)

## Configuration

- No `.env` files present in the repository.
- No environment variables are read anywhere in the source (`process.env` / `import.meta.env` not used in app code).
- All application "data" is static JSON seeded at module load time (`src/data/permintaan.json`, `keputusan.json`, `notifikasi.json`, `activityLog.json`) and persisted client-side via `window.localStorage` in `src/store.js`.
- `vite.config.js` - defines Vite + React plugin, dev server bound to `0.0.0.0:5173`
- No `tsconfig.json`, no `.eslintrc`/`.prettierrc`, no `jsconfig.json` detected — no linting/formatting tooling configured.
- `index.html` is the Vite entry HTML, loading Google Fonts (Inter, JetBrains Mono) via `<link>` tags and mounting `src/main.jsx` as the module entry point.

## Platform Requirements

- Node.js + npm installed
- Run `npm install` then `npm run dev` (Vite dev server on port 5173, accessible on all interfaces)
- `npm run build` produces a static `dist/` bundle (Vite default), suitable for static hosting (no server-side runtime required)
- No deployment configuration (no Dockerfile, no CI/CD config, no hosting-provider config files) detected in the repository

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React components: PascalCase matching the default export — `src/components/Tombol.jsx`, `src/components/MetricCard.jsx`, `src/pages/InputData.jsx`
- Hooks: camelCase prefixed with `use` — `src/hooks/useRipple.jsx`, `src/hooks/useMountSkeleton.js`
- Utility modules: camelCase, lowercase — `src/utils/format.js`, `src/utils/distribusi.js`, `src/utils/csv.js`
- Data seed files: camelCase `.json` — `src/data/permintaan.json`, `src/data/keputusan.json`
- Stylesheets: lowercase — `src/index.css`, `src/tokens.css`, `src/styles/animations.css`
- Components are declared as named `function` declarations (not arrow functions assigned to const), then `export default` at the bottom — see `src/components/Tombol.jsx:3`, `src/App.jsx:57`
- Helper/utility functions are `const` arrow functions — `src/utils/format.js:16` (`formatDate`), `src/store.js:46` (`clone`)
- Store mutator methods use Indonesian verb prefixes consistent with domain language: `tambah*` (add), `hapus*` (delete), `update*`, `get*`, `set*` — see `src/store.js:206-512` (`tambahAkun`, `hapusKota`, `updateKota`, `getDaftarAkun`)
- camelCase throughout, predominantly **Bahasa Indonesia** domain terms mixed with English programming terms — e.g. `daftarKota` (city list), `userAktif` (active user), `riwayatKeputusan` (decision history) in `src/store.js:95-107`
- Boolean state flags prefixed with `is`: `isSaving`, `isLegacyDaftarKota` — `src/pages/InputData.jsx:38`, `src/store.js:80`
- Event handler variables prefixed with `handle`: `handleChange`, `handleSubmit` — `src/pages/InputData.jsx:83,93`
- No TypeScript; this is a plain JavaScript/JSX codebase (`.js` / `.jsx` only, no `.ts`/`.tsx` files, no `tsconfig.json`)
- Object shapes are implicit/documented only via usage in JSON seed files (`src/data/*.json`) and store seed constants (`src/store.js:7-39`)

## Code Style

- No Prettier config file present (no `.prettierrc*`). Code is consistently formatted with double quotes for strings, 2-space indentation, and trailing commas in multi-line object/array literals — observable throughout `src/store.js` and `src/pages/InputData.jsx`
- Semicolons are used consistently at statement ends
- No ESLint config present (no `.eslintrc*`, `eslint.config.*`). No lint script in `package.json`. Conventions are maintained by convention/discipline only, not tooling enforcement
- No `package.json` `"scripts"` exist for `lint`, `test`, `format` — only `dev` and `build` (`package.json:6-9`)

## Import Organization

- None configured. All imports use relative paths (`../components/...`, `./pages/...`). `vite.config.js` defines no `resolve.alias`.

## Error Handling

- `try/catch` is used narrowly around `localStorage` access and `matchMedia`, with empty/comment-only catch blocks treating failures as non-fatal — `src/store.js:70-76` (`loadPersisted`), `src/store.js:87-92` (`getSystemPreferredTema`), `src/store.js:114-118` (`persistState`, includes explanatory comment `// localStorage unavailable (private mode/quota) — continue without persistence`)
- Domain validation errors are thrown with `throw new Error("...")` using Indonesian user-facing messages, caught by calling UI code — `src/store.js:249` (`tambahKota`)
- Promise rejections from browser APIs (View Transitions API) are swallowed with `.catch(() => {})` — `src/App.jsx:49-51`
- Form-level validation returns an error object (`{ field: message }`) rather than throwing — `src/pages/InputData.jsx:51-81` (`validate`)
- No централized error boundary or global error handler exists; errors are handled locally at the point of risk

## Logging

- Application "logging" is modeled as a domain feature, not a dev tool: `pushActivity` / `recordActivity` write structured activity log entries into app state for display in the UI (`src/store.js:157-174`), not to the console or any external service.

## Comments

- Sparse. Comments are used only to explain non-obvious defensive code, e.g. `// localStorage unavailable (private mode/quota) — continue without persistence` (`src/store.js:117`)
- No file-header or module-level doc comments observed
- Not used anywhere in the codebase

## Function Design

## Module Design

- Components: `export default ComponentName` only — `src/components/Tombol.jsx:28`
- Utility modules: named exports for each function, no default — `src/utils/csv.js` (`parseCsv`, `parseCsvToObjects`, `downloadCsv`), `src/utils/format.js` (`formatDate`, `formatTonase`, etc.)
- Singleton modules (store, toast): both a default export and named export of the same object — `src/store.js:514` (`export default store;` plus `export const store = {...}`), `src/components/Toast.jsx:167-168` (`export default useToast; export { showToast, ToastContainer };`)

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- No server, no API, no database — everything runs in the browser
- A single in-memory + `localStorage`-backed store (`src/store.js`) plays the role of backend/database/auth provider
- Manual URL routing via `window.history.pushState` instead of React Router
- Role-based menu/page gating is UI-only (cosmetic), not a real authorization layer
- One large page component per route, each importing the shared `store` directly

## Layers

- Purpose: Render a full route's UI and own its local interaction state
- Contains: `src/pages/*.jsx` (e.g. `Dashboard.jsx` 1534 lines, `Landing.jsx` 1619 lines, `KeputusanDistribusi.jsx`, `AnalisisRanking.jsx`, `StatusDistribusi.jsx`)
- Depends on: `store` (direct import), shared components, `src/utils/*`
- Used by: `pageRegistry` in `src/App.jsx`
- Purpose: Reusable UI primitives and chrome
- Contains: `src/components/*.jsx` (`Layout.jsx` app shell, `Card.jsx`, `Modal.jsx`, `Tabel.jsx`, `Toast.jsx`, `Tombol.jsx`, `PetaGeografis.jsx` map, etc.)
- Depends on: `store` (some components, e.g. `Layout.jsx`, read store directly for notifications/user), design tokens in `src/tokens.css`
- Used by: Page layer
- Purpose: Single source of truth for all application data; substitutes for a real backend/database
- Contains: `src/store.js` — a pub/sub singleton with getters/mutators (`addPermintaan`, `addKeputusan`, `cariAkun`, etc.)
- Depends on: `window.localStorage`, seed data in `src/data/*.json`
- Used by: Every page and several components, via `import store from "../store"`
- Purpose: Pure-ish business logic and formatting helpers, decoupled from React
- Contains: `src/utils/distribusi.js` (ranking/recommendation calculations), `src/utils/forecast.js` (per-city forecasting), `src/utils/csv.js`, `src/utils/format.js`, `src/utils/waktu.js`, `src/utils/navigation.js` (role→menu maps), `src/utils/chartDefaults.js`
- Depends on: Plain JS, no React/store imports (these are the most testable units in the codebase)
- Used by: Pages, for computing KPIs/rankings/charts

## Data Flow

- No React Context, Redux, Zustand, etc. — a single module-scoped object in `src/store.js` is the entire app's state
- Persisted synchronously and fully (not incrementally) to `localStorage` on every mutation
- `store.getState()` and most getters return a deep clone (`JSON.parse(JSON.stringify(...))`) to prevent external mutation of internal state

## Key Abstractions

- Purpose: Acts as the entire backend — auth, persistence, business mutations, notifications, activity logging
- Examples: `src/store.js` exports a single `store` object with ~30 methods (`addPermintaan`, `updateKeputusan`, `cariAkun`, `setStokTbs`, ...)
- Pattern: Module-level singleton + observer/pub-sub (`subscribe`/`listeners`/`notify`)
- Purpose: Maps a logical page key (string) to both a React component and a URL path
- Examples: `pageRegistry`, `pathByPage`, `pageByPath` in `src/App.jsx:18-42`
- Pattern: Plain object lookup tables, no router library
- Purpose: Declares which pages each of the three roles (`Admin`, `Manajer Distribusi`, `Tim Logistik`) can see/access
- Examples: `menuByRole`, `getDefaultMenuByRole` in `src/utils/navigation.js`
- Pattern: Static config object; enforcement happens only in `App.jsx`'s `allowedPages` check (UI-level, not a security boundary)

## Entry Points

- Location: `src/main.jsx`
- Triggers: Page load (Vite serves `index.html` → loads this module)
- Responsibilities: Mount `<App />` into the DOM root
- Location: `src/App.jsx`
- Triggers: Every navigation (pushState or popstate)
- Responsibilities: Resolve current route + auth/role state into the page to render; gate access to authenticated pages; render `Layout` wrapper for authenticated views

## Error Handling

- `try/catch` swallowing in `src/store.js` for `localStorage` read/write (`loadPersisted`, `persistState`) — failures degrade silently to in-memory-only state
- Validation errors thrown as plain `Error` from store mutators (e.g. `tambahKota` throws `"Kota dengan nama tersebut sudah ada."`) — calling pages are expected to catch these themselves
- No React error boundary component found — an unhandled render error would produce a blank/broken page

## Cross-Cutting Concerns

- Application-level activity logging is a first-class feature: `recordActivity`/`pushActivity` in `src/store.js:157-174` write to `state.activityLog`, surfaced on `src/pages/RiwayatAktivitas.jsx`
- No developer-facing logging framework (no Winston/Pino); relies on default browser console
- Ad-hoc, inline in store mutators (e.g. duplicate-city check in `tambahKota`, duplicate-request check in `hasPermintaanDuplikat`)
- No schema validation library (no Zod/Yup)
- `store.cariAkun(username, password, role)` does a plaintext string match against `state.daftarAkun` (`src/store.js:213-223`)
- "Session" is just `state.userAktif`, persisted to `localStorage` in plaintext alongside everything else
- No real authorization: page/menu gating in `App.jsx` and `navigation.js` only hides UI, it does not prevent calling store mutators directly

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
