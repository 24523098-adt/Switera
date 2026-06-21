# Codebase Structure

**Analysis Date:** 2026-06-21

## Directory Layout

```
Switera/
├── public/             # Static assets served as-is by Vite
├── src/                # Application source
│   ├── components/    # Shared/reusable UI components
│   │   └── auth/      # Auth-page-specific shared UI
│   ├── data/           # Static JSON seed data (acts as initial "database")
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # One component per route/screen
│   ├── styles/         # Extra CSS (animations)
│   ├── utils/          # Framework-free business logic and helpers
│   ├── App.jsx          # Manual router + top-level page switch
│   ├── main.jsx          # React DOM mount / entry point
│   ├── store.js          # Singleton "fake backend" store
│   ├── tokens.css         # Design tokens (colors, spacing, etc.)
│   └── index.css          # Global styles
├── index.html           # Vite HTML entry, mounts src/main.jsx
├── vite.config.js        # Vite + @vitejs/plugin-react config
├── package.json          # Scripts: dev, build (no test/lint scripts)
└── favicon.svg
```

## Directory Purposes

**src/pages/**
- Purpose: One large component per top-level route/screen
- Contains: `*.jsx`, no subdirectories
- Key files: `Landing.jsx` (1619 lines, marketing/public page), `Dashboard.jsx` (1534 lines), `KeputusanDistribusi.jsx`, `AnalisisRanking.jsx`, `StatusDistribusi.jsx`, `ManajemenData.jsx`, `InputData.jsx`, `Laporan.jsx`, `RiwayatAktivitas.jsx`, `Login.jsx`, `Register.jsx`
- Subdirectories: None (`.gitkeep` present, flat structure intentional)

**src/components/**
- Purpose: Shared UI building blocks used across multiple pages
- Contains: `*.jsx` components (`Layout.jsx` 899-line app shell, `Card.jsx`, `Modal.jsx`, `Tabel.jsx`, `Tombol.jsx` (button), `Toast.jsx`, `Badge.jsx`, `ProgressBar.jsx`, `Skeleton.jsx`, `Sparkline.jsx`, `Tooltip.jsx`, `CommandPalette.jsx`, `PetaGeografis.jsx` (Leaflet map), `MetricCard.jsx`, `PageHeader.jsx`, `SectionHeader.jsx`, `EmptyState.jsx`, `IkonDaun.jsx`)
- Key files: `Layout.jsx` (header/sidebar/notifications shell for authenticated views)
- Subdirectories: `auth/` — `AuthShared.jsx` (shared styling/markup for Login/Register)

**src/data/**
- Purpose: Static seed data that initializes the store on first load
- Contains: `permintaan.json` (requests), `keputusan.json` (decisions), `notifikasi.json` (notifications), `activityLog.json`
- Key files: All four are read once by `src/store.js` at module load

**src/utils/**
- Purpose: Pure(ish) logic decoupled from React/store — the most testable code in the repo
- Contains: `distribusi.js` (ranking/recommendation math), `forecast.js` (per-city forecasting), `csv.js` (export), `format.js` (display formatting), `waktu.js` (date/time helpers), `navigation.js` (role→menu config), `chartDefaults.js` (Chart.js config)
- Key files: `distribusi.js`, `forecast.js` — core decision-support calculations

**src/hooks/**
- Purpose: Custom React hooks shared across components
- Contains: `useMountSkeleton.js`, `useRipple.jsx`
- Key files: Both are small, presentation-focused hooks (loading skeleton timing, button ripple effect)

## Key File Locations

**Entry Points:**
- `index.html` — Vite HTML entry, loads `src/main.jsx` as a module
- `src/main.jsx` — React DOM root mount
- `src/App.jsx` — manual router and top-level page switch

**Configuration:**
- `vite.config.js` — Vite + React plugin config, dev server bound to `0.0.0.0:5173`
- `package.json` — only `dev`/`build` scripts; no lint/test scripts
- No `.env`, `.eslintrc`, `.prettierrc`, or `tsconfig.json` present

**Core Logic:**
- `src/store.js` — all data, auth, and mutation logic (the "backend")
- `src/utils/distribusi.js`, `src/utils/forecast.js` — distribution decision/ranking/forecasting algorithms

**Testing:**
- None — no test directory, no test files anywhere in the repo

**Documentation:**
- None present (no README.md, no docs/ directory)

## Naming Conventions

**Files:**
- `PascalCase.jsx` for React components (e.g. `Dashboard.jsx`, `Tombol.jsx`)
- `camelCase.js` for non-component modules (e.g. `store.js`, `format.js`, `navigation.js`)
- Indonesian naming throughout for domain concepts (e.g. `permintaan` = request, `keputusan` = decision, `distribusi` = distribution, `kota` = city) — component/file names mix English (React idioms) and Indonesian (domain terms)

**Directories:**
- lowercase, plural where it's a collection (`pages/`, `components/`, `utils/`, `hooks/`)

**Special Patterns:**
- `.gitkeep` files preserved in otherwise-empty directories (`src/pages/.gitkeep`, `src/components/.gitkeep`, `src/utils/.gitkeep`) — leftover from when these dirs may have been empty; harmless
- No `index.js` barrel files — every import references the concrete file directly

## Where to Add New Code

**New Page/Route:**
- Component: `src/pages/NamaHalaman.jsx`
- Register it: add to `pageRegistry`, `pathByPage` in `src/App.jsx:18-38`
- Menu visibility: add an entry to the relevant role(s) in `src/utils/navigation.js`

**New Shared Component:**
- Implementation: `src/components/NamaKomponen.jsx`
- Styling: reuse tokens from `src/tokens.css` rather than new inline styles (existing inline-style duplication is a known issue — see CONCERNS.md)

**New Store Capability:**
- Implementation: add getter/mutator method to the `store` object in `src/store.js`
- Follow the existing pattern: mutate `state`, call `notify()`, return a `clone(...)` of the result

**Utilities:**
- Shared business logic: `src/utils/*.js` (keep framework-free, as the existing files are)

## Special Directories

**public/**
- Purpose: Static assets copied as-is into the build output
- Source: Manually placed assets
- Committed: Yes

---

*Structure analysis: 2026-06-21*
*Update when directory structure changes*
