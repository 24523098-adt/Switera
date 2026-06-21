# Testing Patterns

**Analysis Date:** 2026-06-21

## Test Framework

**Runner:**
- None. No test runner is installed or configured anywhere in the repository.

**Assertion Library:**
- None.

**Run Commands:**
```bash
# package.json only defines:
npm run dev      # vite
npm run build    # vite build
# No "test" script exists
```

## Test File Organization

**Location:**
- N/A — no `*.test.*`, `*.spec.*` files, `__tests__/` or `tests/` directories exist anywhere in the repo.

**Naming:**
- N/A

**Structure:**
```
src/
  utils/
    distribusi.js     # no distribusi.test.js
    forecast.js        # no forecast.test.js
    csv.js              # no csv.test.js
```

## Test Structure

Not applicable — no tests exist to derive patterns from.

## Mocking

Not applicable — no mocking framework installed (no Vitest, Jest, Sinon, etc. in `package.json`).

## Fixtures and Factories

**Test Data:**
- None for testing purposes. Note that `src/data/*.json` (`permintaan.json`, `keputusan.json`, `notifikasi.json`, `activityLog.json`) serve as **seed/demo data** for the app itself (loaded by `src/store.js` on first run), not as test fixtures.

## Coverage

**Requirements:** None — no coverage tooling configured.

## Test Types

**Unit Tests:** None present. Best candidates if added: `src/utils/csv.js`, `src/utils/format.js`, `src/utils/waktu.js` — these are pure functions with no React/store dependency.

**Integration Tests:** None present. Best candidates: `src/utils/distribusi.js` (`computeRekomendasiDistribusi`, `computeKpiMetrics`, `aggregatePermintaanRanking`) and `src/utils/forecast.js` (`computeForecastPerKota`) — these drive the app's core distribution-decision output and have edge cases (e.g. division-by-zero guards, anomaly detection skipped when historical average is 0, see `src/store.js:339`).

**E2E Tests:** None present.

## Common Patterns

Not applicable — no existing tests to derive conventions from.

## Recommendation (if tests are added later)

Since the project already uses Vite, **Vitest** + **@testing-library/react** is the natural fit (zero additional build config, shares Vite's transform pipeline). Priority order if/when testing is introduced:
1. `src/utils/distribusi.js` and `src/utils/forecast.js` — core business logic, currently the highest-risk untested code (drives real distribution decisions)
2. `src/utils/csv.js`, `src/utils/format.js` — pure utilities, cheap to test
3. `src/store.js` mutators — would require mocking `window.localStorage`

---

*Testing analysis: 2026-06-21*
*Update when test patterns change*
