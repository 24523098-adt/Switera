# External Integrations

**Analysis Date:** 2026-06-21

## APIs & External Services

**None detected.** This is a fully client-side, offline-capable single-page application. No `fetch()`, `axios`, or any HTTP client calls to external services were found anywhere in `src/`.

**Fonts (static asset only):**
- Google Fonts - Inter and JetBrains Mono webfonts loaded via `<link>` tags in `index.html`
  - SDK/Client: none (plain `<link rel="stylesheet">` and `<link rel="preconnect">`)
  - Auth: none required

**Mapping:**
- Leaflet ^1.9.4 - client-side rendering library for the geographic distribution map in `src/components/PetaGeografis.jsx`
  - This is a rendering library, not a hosted API integration — no tile-server API key or remote service call was found in the component. If a tile provider (e.g. OpenStreetMap tiles) is added, it would introduce a runtime network dependency not currently present.

## Data Storage

**Databases:**
- None. There is no database, ORM, or query client anywhere in the codebase.

**File Storage:**
- Local filesystem only, limited to static seed data bundled at build time:
  - `src/data/permintaan.json` - distribution request records
  - `src/data/keputusan.json` - distribution decision records
  - `src/data/notifikasi.json` - notification seed data
  - `src/data/activityLog.json` - activity log seed data

**Caching / Persistence:**
- Browser `window.localStorage` is the sole persistence layer, implemented in `src/store.js`:
  - State is read from `localStorage` on load (`src/store.js:71`)
  - State is written to `localStorage` on every mutation (`src/store.js:115`)
  - Falls back silently to in-memory only state if `localStorage` is unavailable (e.g. private browsing / quota exceeded) (`src/store.js:117`)

## Authentication & Identity

**Auth Provider:**
- None — fully custom, client-side only authentication implemented in `src/store.js`.
- A hardcoded list of user accounts (`akunSeed`) is defined directly in source with plaintext usernames/passwords (e.g. `manajer`/`manajer123`, `logistik`/`logistik123`, `admin`/`admin123`) and static roles (`Manajer Distribusi`, `Tim Logistik`, `Admin`).
- Login (`src/pages/Login.jsx`) and Register (`src/pages/Register.jsx`) pages exist but operate purely against this in-memory/localStorage-backed account list — there is no server-side verification, password hashing, token issuance, or session-expiry mechanism.
- This is a security-relevant gap if the app is ever exposed beyond a local demo/prototype context — see this noted explicitly for the `concerns` focus pass.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, LogRocket, or similar service integrated.

**Logs:**
- No structured logging. Application activity is tracked only via the in-app `activityLog` data (`src/data/activityLog.json`, mutated through `src/store.js`), which is a UI feature, not an operational/observability log.

## CI/CD & Deployment

**Hosting:**
- Not configured. No hosting-provider config (Vercel, Netlify, Firebase, etc.) found in the repository.

**CI Pipeline:**
- None. No `.github/workflows/`, no other CI config files detected.

## Environment Configuration

**Required env vars:**
- None. No `.env` files exist and no `process.env`/`import.meta.env` usage was found in source.

**Secrets location:**
- None applicable — no secrets are used. Note: demo account passwords are stored in plaintext directly in source (`src/store.js`), which is itself a concern if this code path is ever used outside of a local prototype.

## Webhooks & Callbacks

**Incoming:**
- None — there is no backend/server component to receive webhooks.

**Outgoing:**
- None — no outbound webhook calls detected.

---

*Integration audit: 2026-06-21*
