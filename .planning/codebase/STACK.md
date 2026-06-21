# Technology Stack

**Analysis Date:** 2026-06-21

## Languages

**Primary:**
- JavaScript (JSX) - React components and application logic, `src/**/*.jsx`
- CSS - Styling and design tokens, `src/index.css`, `src/tokens.css`, `src/styles/animations.css`

**Secondary:**
- HTML - Single page shell, `index.html`
- JSON - Static seed data, `src/data/*.json`

No TypeScript is used anywhere in the codebase — all files are `.js`/`.jsx` without type annotations.

## Runtime

**Environment:**
- Node.js (version not pinned — no `.nvmrc` or `engines` field in `package.json`)
- Browser runtime: modern evergreen browsers (ES modules used directly via Vite)

**Package Manager:**
- npm (lockfile present: `package-lock.json`)
- `package.json` declares `"type": "module"` (ESM project)

## Frameworks

**Core:**
- React 18.3.1 - UI framework, function components + hooks throughout `src/pages/` and `src/components/`
- React DOM 18.3.1 - DOM rendering, mounted in `src/main.jsx`

**Testing:**
- None detected. No test runner, test config, or `*.test.*`/`*.spec.*` files found in the repo.

**Build/Dev:**
- Vite 7.0.0 - Dev server and bundler, configured in `vite.config.js`
- @vitejs/plugin-react 4.7.0 - React Fast Refresh / JSX transform plugin for Vite

## Key Dependencies

**Critical:**
- `react` ^18.3.1 - Application UI runtime
- `react-dom` ^18.3.1 - DOM renderer
- `leaflet` ^1.9.4 - Interactive map rendering, used in `src/components/PetaGeografis.jsx` (geographic distribution map)
- `chart.js` ^4.5.1 + `react-chartjs-2` ^5.3.0 - Charting library used for dashboard analytics in `src/pages/Dashboard.jsx`, `src/pages/Laporan.jsx`, `src/pages/AnalisisRanking.jsx`, and configured centrally in `src/utils/chartDefaults.js`

**Infrastructure:**
- None — no ORM, no HTTP client library (no axios/fetch wrapper), no state-management library beyond a hand-rolled store (`src/store.js`)

## Configuration

**Environment:**
- No `.env` files present in the repository.
- No environment variables are read anywhere in the source (`process.env` / `import.meta.env` not used in app code).
- All application "data" is static JSON seeded at module load time (`src/data/permintaan.json`, `keputusan.json`, `notifikasi.json`, `activityLog.json`) and persisted client-side via `window.localStorage` in `src/store.js`.

**Build:**
- `vite.config.js` - defines Vite + React plugin, dev server bound to `0.0.0.0:5173`
- No `tsconfig.json`, no `.eslintrc`/`.prettierrc`, no `jsconfig.json` detected — no linting/formatting tooling configured.
- `index.html` is the Vite entry HTML, loading Google Fonts (Inter, JetBrains Mono) via `<link>` tags and mounting `src/main.jsx` as the module entry point.

## Platform Requirements

**Development:**
- Node.js + npm installed
- Run `npm install` then `npm run dev` (Vite dev server on port 5173, accessible on all interfaces)

**Production:**
- `npm run build` produces a static `dist/` bundle (Vite default), suitable for static hosting (no server-side runtime required)
- No deployment configuration (no Dockerfile, no CI/CD config, no hosting-provider config files) detected in the repository

---

*Stack analysis: 2026-06-21*
