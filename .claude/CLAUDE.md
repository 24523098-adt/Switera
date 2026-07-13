<!-- GSD:project-start source:PROJECT.md -->

## Project

**Switera**

Switera is a React SPA + Express/PostgreSQL backend for managing the distribution of TBS (kelapa sawit / palm fruit) stock across cities — covering requests, ranking-based distribution decisions, status tracking, reporting, and activity history, with three distinct roles (Admin, Manajer Distribusi, Tim Logistik) enforced by real server-side RBAC. It's a school project meant to demo at production quality: complete features, proper validation, consistent UI, and clean code. As of milestone v2.0 (Backend & Multi-User Migration, complete — see `.planning/STATE.md`), the app is multi-user with a real backend; it is no longer client-only.

**Core Value:** The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

### Constraints

- **Tech stack**: React 18 + Vite 7 (frontend), Express 5 + Prisma 6 + PostgreSQL (backend in `server/`) — no new frameworks/libraries beyond what's already in `package.json`/`server/package.json` unless a requirement clearly needs one
- **Persistence**: PostgreSQL via Prisma is the source of truth. `src/store.js` is now a hydrated in-memory cache + REST API client (`src/api/apiClient.js`), not a database substitute — mutators are async and call the backend; only `{userAktif, tema}` is persisted to `window.localStorage` (session/theme only, not domain data)
- **Design system**: Reuse existing shared components (`src/components/*`) and tokens (`src/tokens.css`) rather than introducing new styling approaches — required to fix the design-consistency gap, not optional
- **Scope**: Completion and polish of existing functionality only — no new pages, roles, or business domains

<!-- GSD:project-end -->

## MIS Layer (penguatan Management Information System)

Switera ditekankan sebagai **MIS**, bukan TPS: setiap halaman mengolah data menjadi informasi keputusan (agregasi, indikator status, perbandingan, dukungan keputusan), tidak menampilkan daftar transaksi mentah tanpa olahan.

- **Backend MIS** (khusus Manajer Distribusi, `requireAuth` + `requireRole`): `server/src/services/misService.js` + `server/src/routes/misRoutes.js`, di-mount tanpa prefix di `index.js`. Endpoint: `GET /mis/situasi-hari-ini`, `/mis/tindakan-mendesak`, `/mis/rekomendasi-prioritas`, `/mis/keputusan-berjalan`, `/mis/proyeksi-stok`, `/mis/kpi`, `GET /efisiensi-logistik`, `POST /mis/sinkron-notifikasi`, `GET/PUT /mis/target-kpi`, `GET /mis/riwayat-kpi`, `POST /mis/briefing-harian` (AI-3, Gemini). Semua additive, tidak mengubah endpoint lama. Catatan Docker: `node --watch` di kontainer tidak menerima event bind mount Windows — perubahan kode server butuh `docker compose restart server` (ikut me-reseed DB); perubahan schema.prisma butuh `docker compose up -d --build --renew-anon-volumes server`. Catatan: `/kpi` lama tetap; KPI manajer baru ada di `/mis/kpi` (client `getKpi` menunjuk ke sana). Client wrappers ada di `src/api/apiClient.js` (bukan `src/api.js`).
- **Target KPI & riwayat (MBO)**: model `TargetKpi` singleton (target pemenuhan/waktu kirim/utilisasi + ambang `minHariPasokan`/`maxHariEskalasi`) menggantikan ambang hardcoded di misService — status stok, eskalasi keputusan, dan notifikasi cerdas membaca target ini; `/mis/kpi` mengembalikan realisasi+target+status tercapai/meleset. Model `KpiSnapshot` (satu baris per tanggal, direkam otomatis oleh `sinkron-notifikasi`, fail-soft) menjadi sumber grafik Tren Kinerja; seed mem-backfill 14 hari. Dashboard Manajer punya bagian Kinerja vs Target (kartu klik → drill-down `computePemenuhanPerKota`/`computeSiklusDetail`/utilisasi per kota) dan modal Atur Target.
- **Util MIS frontend**: `src/utils/mis.js` (fungsi murni: exceptions, stok/days-of-supply, tren, backlog, drill-down) dipakai dashboard Admin/Logistik dan beberapa halaman.
- **Dashboard Manajer** = 7 bagian dari endpoint MIS: Situasi Hari Ini, Kinerja vs Target, Tren Kinerja, Tindakan Mendesak, Kota Perlu Keputusan, Keputusan Berjalan (dengan pembatalan), Proyeksi Stok (line chart). Dashboard Admin punya panel Kesehatan Sistem + rekomendasi; Dashboard Logistik punya ringkasan operasional + Prioritas Kerja (SLA).
- **Notifikasi cerdas**: `sinkronNotifikasiMis` membuat notifikasi proyeksi stok (tipe `kritis`) dan eskalasi keputusan (tipe `perhatian`) dengan dedupe 24 jam; frontend (`Layout.jsx`) mengelompokkan notifikasi menurut keparahan (kritis/perhatian/informasi) dan badge merah hanya untuk kritis.
- **Header global**: dot kesehatan sistem (hijau/kuning/merah) di sebelah judul halaman, hanya untuk Manajer (sumber `/mis/tindakan-mendesak`), klik menuju dashboard.
- **Token design**: `tokens.css` menambah alias bernama (`--border-card`, `--shadow-card/hover/modal`, `--radius-card/button`, `--color-surface-secondary/text/shadow`) dan palet `--color-status-*`. `--color-primary` tetap olive `#4c6700` (warna teks terbaca); brand lime tetap `--color-lime`. `--font-body` kini Bricolage Grotesque.

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

Frontend (root `package.json`):
- `react` ^18.3.1 - Application UI runtime
- `react-dom` ^18.3.1 - DOM renderer
- `leaflet` ^1.9.4 - Interactive map rendering, used in `src/components/PetaGeografis.jsx` (geographic distribution map)
- `chart.js` ^4.5.1 + `react-chartjs-2` ^5.3.0 - Charting library used for dashboard analytics in `src/pages/Dashboard.jsx`, `src/pages/Laporan.jsx`, `src/pages/AnalisisRanking.jsx`, and configured centrally in `src/utils/chartDefaults.js`
- No state-management library beyond the hand-rolled hydrated-cache store (`src/store.js`) and its REST client (`src/api/apiClient.js`)

Backend (`server/package.json`):
- `express` ^5.0.0 - HTTP API server (`server/src/index.js`)
- `@prisma/client` + `prisma` 6.19.2 (pinned exact) - ORM/migrations against PostgreSQL, schema in `server/prisma/schema.prisma`
- `jsonwebtoken` + `bcryptjs` - auth token issuing/verification and password hashing (`server/src/auth/jwt.js`)
- `zod` - request validation
- `cors` - locked to the Vite dev origin by default, overridable via `CORS_ORIGIN`

## Configuration

- Backend reads env vars via `dotenv` from `server/.env` (gitignored, not committed — no `.env.example` is checked in either; see README for the variable list): `DATABASE_URL` (required, Prisma/Postgres connection string), `JWT_SECRET` (required), `PORT` (optional, default 4000), `CORS_ORIGIN` (optional, default `http://localhost:5173`).
- The frontend reads no env vars; it talks to the backend over plain `fetch` via `src/api/apiClient.js` (base URL hardcoded to the local backend).
- `src/data/*.json` seed files are now only used by Prisma's `server/prisma/seed.js` (DB seeding) and by `src/pages/Landing.jsx`'s pre-login static demo widgets — authenticated pages no longer read them directly.
- `docker-compose.yml` at repo root runs a local PostgreSQL 16 container for development.
- `vite.config.js` - defines Vite + React plugin, dev server bound to `0.0.0.0:5173`
- No `tsconfig.json`, no `.eslintrc`/`.prettierrc`, no `jsconfig.json` detected — no linting/formatting tooling configured (frontend or backend).
- `index.html` is the Vite entry HTML, loading Google Fonts (Inter, JetBrains Mono) via `<link>` tags and mounting `src/main.jsx` as the module entry point.

## Platform Requirements

- Node.js + npm installed, plus Docker (for the local PostgreSQL container) or an equivalent reachable PostgreSQL instance
- Backend: from `server/`, `npm install`, configure `server/.env`, `npm run prisma:migrate`, `npm run db:seed`, then `npm run dev` (runs on port 4000)
- Frontend: from repo root, `npm install` then `npm run dev` (Vite dev server on port 5173, accessible on all interfaces) — requires the backend to be running for any authenticated page
- `npm run build` (root) produces a static `dist/` bundle (Vite default) for the frontend only; the backend (`server/`) needs a running Node process, it is not part of the static bundle
- No CI/CD config or hosting-provider config files detected in the repository

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

## Design System (Neo-Brutalism)

- The app uses the **Neo-Brutalism** design system from Google Stitch (reference HTML under `stitch_neo_brutalism/` + `DESIGN_NEO.md`), applied 2026-07-04, replacing the previous "Agro-Distribution Catalyst" light theme. Light mode only; store's `tema` state still exists but is inert (do not re-add a toggle without being asked)
- Core palette (all in `tokens.css`): bg `#fafafa`, surface white, **lime neon `#BCF819`** (`--color-lime`, plus `--color-lime-bold #ABF600` dan `--color-lime-dim #a2d800` untuk hover) dipakai agresif untuk CTA/pill aktif/indikator, pastel `#F2FED1` (`--color-pastel`) dan `#EAFCC2` (`--color-pastel-card`) untuk latar kartu sekunder, `--color-primary #4c6700` (olive gelap, khusus teks dan ikon aksen agar terbaca), error `#ba1a1a`, text `#111111`/`#434934`, **border selalu hitam `#000000`**
- Signature rules: card border `2px solid #000` radius 16-24px dengan **hard shadow tanpa blur** (`--shadow-sm` 2px2px, `--shadow-md` 4px4px, `--shadow-lg` 8px8px, semua hitam); tombol berbentuk pill (`border-radius: 9999px`) bg lime, teks hitam, border hitam; hover `translate(2px,2px)` dengan shadow menyusut, active shadow hilang; status chip/badge selalu ber-border hitam 2px
- Fonts: **Bricolage Grotesque** (`--font-heading`, bobot 700-800, tracking rapat) untuk heading dan nilai metrik, **DM Sans** (`--font-body`) untuk body/label; icons **Material Symbols Outlined** (base class di `tokens.css`; pages define a local `Ikon` helper), semuanya dimuat via `index.html` Google Fonts links
- **Legacy-token aliases**: `tokens.css` masih mendefinisikan nama lama (`--color-surface-2/3`, `--color-border-mid/strong`, `--color-accent`, `--color-danger/success/info/warning(+subtle)`, `--font-display/mono`, `--shadow-xs/xl`, dll.) sebagai alias ke palet Neo-Brutalism supaya kode yang belum tersentuh tetap benar; new code should use the new token names, and do not delete aliases without checking all references
- `src/styles/animations.css` holds shared keyframes (`fadeInUp`, `fadeIn`, `scaleIn`, `slideInRight`, `shimmer` gradien lime, `hardShadowShift`, `pulse`/`pulseDot`, `ticker`, plus legacy aliases) and utilities (`.animate-*`, `.anim-*`, `.delay-1..6`, `.skeleton` lime dengan border hitam, `.reveal`, `.animate-ticker`); `prefers-reduced-motion` is handled once, globally, there
- Interaksi khas: elemen "turun" ke arah bayangan saat hover/ditekan (`translate(2px,2px)` lalu `(4px,4px)` dengan shadow menyusut lalu hilang), bukan lift atau scale halus; fokus input mengubah latar ke pastel (bukan glow ring); shadow hitam pekat, bukan green-tinted
- Login/Register keep the **sawit photo background** (`public/images/sawit-bg.jpg`) + dark overlay as brand identity; card form/input/role selector bergaya Neo-Brutalism (card putih border 3px + hard shadow, stiker dekoratif miring), never replace the photo

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

- Two-process architecture: React/Vite frontend (root) + Express/Prisma/PostgreSQL backend (`server/`), talking over a REST API
- `src/store.js` is a hydrated in-memory cache + REST API client (mutators are `async`, call `src/api/apiClient.js`, then update the cache from the server's response and `notify()`) — it is no longer the data layer itself
- The backend (`server/src/services/*`) is the real source of truth and the real authorization layer: JWT auth (`server/src/auth/jwt.js`), `requireAuth`/`requireRole` middleware enforce RBAC per-route, Zod validates request bodies, Prisma talks to PostgreSQL
- Manual URL routing via `window.history.pushState` instead of React Router (frontend-only, unchanged)
- Frontend role-based menu/page gating (`App.jsx`, `navigation.js`) is still UI-only/cosmetic — the *real* authorization boundary is now server-side middleware, not the frontend
- One large page component per route, each importing the shared `store` directly
- Client polls the backend every 4s (`store.startPolling`/`stopPolling`/`pollTick`, started/stopped from `App.jsx`'s auth-state effect) so multiple logged-in users converge on the same data within a few seconds — no WebSocket/SSE push (deferred, see `.planning/STATE.md` Deferred Items)

## Layers

- Purpose: Render a full route's UI and own its local interaction state
- Contains: `src/pages/*.jsx` (e.g. `Dashboard.jsx`, `Landing.jsx`, `KeputusanDistribusi.jsx`, `AnalisisRanking.jsx`, `StatusDistribusi.jsx`)
- Depends on: `store` (direct import), shared components, `src/utils/*`
- Used by: `pageRegistry` in `src/App.jsx`
- Purpose: Reusable UI primitives and chrome
- Contains: `src/components/*.jsx` (`Layout.jsx` app shell, `Card.jsx`, `Modal.jsx`, `Tabel.jsx`, `Toast.jsx`, `Tombol.jsx`, `PetaGeografis.jsx` map, etc.)
- Depends on: `store` (some components, e.g. `Layout.jsx`, read store directly for notifications/user), design tokens in `src/tokens.css`, shared animations in `src/styles/animations.css`
- Used by: Page layer
- Purpose: Hydrated in-memory cache + REST client; frontend's only data-access path
- Contains: `src/store.js` (pub/sub singleton, async mutators, `hydrate()`/`startPolling()`), `src/api/apiClient.js` (fetch wrapper, JWT attach, 401 handling)
- Depends on: The backend REST API (see below); persists only `{userAktif, tema}` to `window.localStorage` (`switera_session_v2` key)
- Used by: Every page and several components, via `import store from "../store"`
- Purpose: Pure-ish business logic and formatting helpers, decoupled from React
- Contains: `src/utils/distribusi.js` (ranking/recommendation calculations), `src/utils/forecast.js` (per-city forecasting), `src/utils/csv.js`, `src/utils/format.js`, `src/utils/waktu.js`, `src/utils/navigation.js` (role→menu maps), `src/utils/chartDefaults.js`
- Depends on: Plain JS, no React/store imports (these are the most testable units in the codebase)
- Used by: Pages, for computing KPIs/rankings/charts
- Purpose: REST API, business mutations, persistence, auth/RBAC — the actual backend
- Contains: `server/src/routes/*` (per-domain Express routers), `server/src/services/*` (business logic + Prisma access), `server/src/middleware/*` (`requireAuth`, `requireRole`, `validate`, `errorHandler`), `server/src/auth/jwt.js`, `server/prisma/schema.prisma` + migrations
- Depends on: PostgreSQL via Prisma, `jsonwebtoken`/`bcryptjs`/`zod`
- Used by: The frontend's `apiClient.js`, exclusively over HTTP (no shared code/imports across the frontend/backend boundary)

## Data Flow

- No React Context, Redux, Zustand, etc. — a single module-scoped object in `src/store.js` is the frontend's entire client-side state, but it is a *cache*, not the system of record
- `store.hydrate()` runs once per login/session-restore (`App.jsx` effect on `snapshot.userAktif?.username`) and `Promise.all`s every domain loader; synchronous getters (`getState`, `getDaftarKota`, ...) read the cache, mutators `await` the API then write the server's authoritative response into the cache before `notify()`
- `store.getState()` and most getters still return a deep clone (`JSON.parse(JSON.stringify(...))`) to prevent external mutation of internal state
- Server is the single point of truth for validation, RBAC, and conflict resolution (e.g. `keputusan` status changes use an optimistic-lock `updateMany` + 409 response, not a client-side guard)

## Key Abstractions

- Purpose: Frontend hydrated cache + REST client facade — looks like the old "store as backend" API to calling pages, but every mutator now round-trips the real backend
- Examples: `src/store.js` exports the same ~30-method shape (`addPermintaan`, `updateKeputusan`, `cariAkun`→login, `setStokTbs`, ...) but each is `async` and calls `apiClient`
- Pattern: Module-level singleton + observer/pub-sub (`subscribe`/`listeners`/`notify`), now layered over async I/O
- Purpose: Maps a logical page key (string) to both a React component and a URL path
- Examples: `pageRegistry`, `pathByPage`, `pageByPath` in `src/App.jsx:18-42`
- Pattern: Plain object lookup tables, no router library
- Purpose: Declares which pages each of the three roles (`Admin`, `Manajer Distribusi`, `Tim Logistik`) can see/access
- Examples: `menuByRole`, `getDefaultMenuByRole` in `src/utils/navigation.js`
- Pattern: Static config object; frontend enforcement in `App.jsx`'s `allowedPages` check is still UI-only — real enforcement is `requireRole(...)` middleware server-side (`server/src/middleware/`)

## Entry Points

- Location: `src/main.jsx`
- Triggers: Page load (Vite serves `index.html` → loads this module)
- Responsibilities: Mount `<App />` into the DOM root
- Location: `src/App.jsx`
- Triggers: Every navigation (pushState or popstate)
- Responsibilities: Resolve current route + auth/role state into the page to render; gate access to authenticated pages; render `Layout` wrapper for authenticated views

## Error Handling

- `try/catch` swallowing in `src/store.js` for `localStorage` read/write (`loadPersisted`, `persistState`) — failures degrade silently to in-memory-only state
- Frontend: `apiClient.js` throws an `Error` with `.message`/`.fields`/`.status` set from the backend's JSON error response; calling pages catch it and map fields/messages onto form state or a `Toast`
- Backend: domain errors are thrown as `Error` (optionally with `.statusCode`), caught by `server/src/middleware/errorHandler.js`, which prefers `err.statusCode` and falls back to matching a few legacy Indonesian message strings
- No React error boundary component found — an unhandled render error would produce a blank/broken page

## Cross-Cutting Concerns

- Application-level activity logging is a first-class feature: the backend writes `ActivityLog`/`Notifikasi` rows inside the same request as the triggering mutation (`server/src/services/*`); the frontend reads them via REST and surfaces them on `src/pages/RiwayatAktivitas.jsx` and the header notification dropdown
- No developer-facing logging framework (no Winston/Pino) on either side; relies on default console output
- Request validation is centralized via `zod` schemas + a `validate(schema)` middleware on the backend (no client-side schema validation library)
- Auth is real: `POST /auth/login` checks `bcryptjs`-hashed passwords server-side and returns a JWT; the frontend stores it in `localStorage` (`switera_token`) and sends it as `Authorization: Bearer <token>`; the accepted XSS-exposure tradeoff for this school-demo milestone is documented in `.planning/STATE.md` (threat T-09-JWT) — refresh-token rotation is deferred (v2 Requirements: AUTH-05/06)
- Real authorization: every mutating route is gated by `requireAuth` + `requireRole(...)` middleware server-side; frontend page/menu gating in `App.jsx`/`navigation.js` is now purely a UX convenience layered on top of that, not the security boundary

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## Workflow

GSD is OFF on this project (explicit standing instruction from the user, 2026-07-14 — reversing the 2026-07-02 "use GSD again" directive). Do NOT route work through `/gsd-*` skills or GSD subagents. Work directly/inline (Read/Grep/Edit/Bash, plan mode for nontrivial work) — no `.planning/quick/` task dirs, no PLAN.md/SUMMARY.md artifacts. `.planning/` still exists as historical record but is not actively maintained per-task. If the user asks to use GSD again, flip this note back.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
