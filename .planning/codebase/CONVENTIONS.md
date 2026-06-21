# Coding Conventions

**Analysis Date:** 2026-06-21

## Naming Patterns

**Files:**
- React components: PascalCase matching the default export — `src/components/Tombol.jsx`, `src/components/MetricCard.jsx`, `src/pages/InputData.jsx`
- Hooks: camelCase prefixed with `use` — `src/hooks/useRipple.jsx`, `src/hooks/useMountSkeleton.js`
- Utility modules: camelCase, lowercase — `src/utils/format.js`, `src/utils/distribusi.js`, `src/utils/csv.js`
- Data seed files: camelCase `.json` — `src/data/permintaan.json`, `src/data/keputusan.json`
- Stylesheets: lowercase — `src/index.css`, `src/tokens.css`, `src/styles/animations.css`

**Functions:**
- Components are declared as named `function` declarations (not arrow functions assigned to const), then `export default` at the bottom — see `src/components/Tombol.jsx:3`, `src/App.jsx:57`
- Helper/utility functions are `const` arrow functions — `src/utils/format.js:16` (`formatDate`), `src/store.js:46` (`clone`)
- Store mutator methods use Indonesian verb prefixes consistent with domain language: `tambah*` (add), `hapus*` (delete), `update*`, `get*`, `set*` — see `src/store.js:206-512` (`tambahAkun`, `hapusKota`, `updateKota`, `getDaftarAkun`)

**Variables:**
- camelCase throughout, predominantly **Bahasa Indonesia** domain terms mixed with English programming terms — e.g. `daftarKota` (city list), `userAktif` (active user), `riwayatKeputusan` (decision history) in `src/store.js:95-107`
- Boolean state flags prefixed with `is`: `isSaving`, `isLegacyDaftarKota` — `src/pages/InputData.jsx:38`, `src/store.js:80`
- Event handler variables prefixed with `handle`: `handleChange`, `handleSubmit` — `src/pages/InputData.jsx:83,93`

**Types:**
- No TypeScript; this is a plain JavaScript/JSX codebase (`.js` / `.jsx` only, no `.ts`/`.tsx` files, no `tsconfig.json`)
- Object shapes are implicit/documented only via usage in JSON seed files (`src/data/*.json`) and store seed constants (`src/store.js:7-39`)

## Code Style

**Formatting:**
- No Prettier config file present (no `.prettierrc*`). Code is consistently formatted with double quotes for strings, 2-space indentation, and trailing commas in multi-line object/array literals — observable throughout `src/store.js` and `src/pages/InputData.jsx`
- Semicolons are used consistently at statement ends

**Linting:**
- No ESLint config present (no `.eslintrc*`, `eslint.config.*`). No lint script in `package.json`. Conventions are maintained by convention/discipline only, not tooling enforcement
- No `package.json` `"scripts"` exist for `lint`, `test`, `format` — only `dev` and `build` (`package.json:6-9`)

## Import Organization

**Order (observed, not enforced by tooling):**
1. External packages (React, third-party libs) — e.g. `import { useEffect, useMemo, useState } from "react";`
2. Local components — `import Card from "../components/Card";`
3. Local utils/store — `import store from "../store";`, `import { parseCsvToObjects } from "../utils/csv";`

Example from `src/pages/InputData.jsx:1-7`:
```js
import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";
import { parseCsvToObjects } from "../utils/csv";
```

**Path Aliases:**
- None configured. All imports use relative paths (`../components/...`, `./pages/...`). `vite.config.js` defines no `resolve.alias`.

## Error Handling

**Patterns:**
- `try/catch` is used narrowly around `localStorage` access and `matchMedia`, with empty/comment-only catch blocks treating failures as non-fatal — `src/store.js:70-76` (`loadPersisted`), `src/store.js:87-92` (`getSystemPreferredTema`), `src/store.js:114-118` (`persistState`, includes explanatory comment `// localStorage unavailable (private mode/quota) — continue without persistence`)
- Domain validation errors are thrown with `throw new Error("...")` using Indonesian user-facing messages, caught by calling UI code — `src/store.js:249` (`tambahKota`)
- Promise rejections from browser APIs (View Transitions API) are swallowed with `.catch(() => {})` — `src/App.jsx:49-51`
- Form-level validation returns an error object (`{ field: message }`) rather than throwing — `src/pages/InputData.jsx:51-81` (`validate`)
- No централized error boundary or global error handler exists; errors are handled locally at the point of risk

## Logging

**Framework:** None (no logging library). No `console.log` calls found in reviewed source files outside of error suppression comments.

**Patterns:**
- Application "logging" is modeled as a domain feature, not a dev tool: `pushActivity` / `recordActivity` write structured activity log entries into app state for display in the UI (`src/store.js:157-174`), not to the console or any external service.

## Comments

**When to Comment:**
- Sparse. Comments are used only to explain non-obvious defensive code, e.g. `// localStorage unavailable (private mode/quota) — continue without persistence` (`src/store.js:117`)
- No file-header or module-level doc comments observed

**JSDoc/TSDoc:**
- Not used anywhere in the codebase

## Function Design

**Size:** Functions are kept small and single-purpose; larger page components (e.g. `src/pages/InputData.jsx`) decompose logic into local helper functions (`validate`, `handleChange`, `handleSubmit`) inside the component body rather than extracting to separate files when the logic is component-specific.

**Parameters:** Object-destructured parameters are preferred for functions with multiple related inputs — `tambahKota({ nama, kapasitas })` (`src/store.js:247`), `showToast({ type = "info", message, subMessage, duration = 3000, action })` (`src/components/Toast.jsx:16`). Default values are assigned directly in the destructuring signature.

**Return Values:** Store getters consistently return deep clones of internal state via the `clone()` helper (`src/store.js:46`) to prevent external mutation of internal state — e.g. `getState()`, `getPermintaan()`, `getDaftarKota()` all wrap return values in `clone(...)`.

## Module Design

**Exports:** Mixed default + named exports per file depending on purpose:
- Components: `export default ComponentName` only — `src/components/Tombol.jsx:28`
- Utility modules: named exports for each function, no default — `src/utils/csv.js` (`parseCsv`, `parseCsvToObjects`, `downloadCsv`), `src/utils/format.js` (`formatDate`, `formatTonase`, etc.)
- Singleton modules (store, toast): both a default export and named export of the same object — `src/store.js:514` (`export default store;` plus `export const store = {...}`), `src/components/Toast.jsx:167-168` (`export default useToast; export { showToast, ToastContainer };`)

**Barrel Files:** Not used. No `index.js` re-export files found in `src/components/` or `src/utils/`.

**State Management:** No external state library (no Redux/Zustand/Context API usage). Global state is a hand-rolled singleton pub/sub store (`src/store.js`) using a `Set` of listener callbacks (`listeners`), a `subscribe()` method, and `notify()` to broadcast cloned snapshots. Persisted to `window.localStorage` under key `switera_state_v1`. Components subscribe via `useEffect` + `useState` in each page/component that needs live data — pattern repeated in `src/App.jsx:82-88` and `src/pages/InputData.jsx:41-47`.

**Domain Language:** The codebase consistently mixes Indonesian domain terminology (kota=city, permintaan=request, keputusan=decision, stok=stock, akun=account) with English programming idioms. New code should follow this same mixed convention rather than translating domain terms to English.

---

*Convention analysis: 2026-06-21*
