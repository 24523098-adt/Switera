# Requirements: Switera

**Defined:** 2026-06-24
**Core Value:** The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.

## v1 Requirements

Requirements for Milestone v2.0 (Backend & Multi-User Migration). Each maps to roadmap phases. Derived from `.planning/research/SUMMARY.md`'s P1 ("Launch With") feature set.

### Database & Data Model

- [ ] **DATA-01**: All 7 data domains (akun, daftarKota, permintaan, keputusan, riwayatKeputusan, activityLog, notifikasi) persist in PostgreSQL via a Prisma schema with correct foreign-key relationships
- [ ] **DATA-02**: Existing seed data (JSON files + in-code seeds) is migrated into the database on first setup, with seed accounts' passwords bcrypt-hashed from the start — never an intermediate plaintext state
- [ ] **DATA-03**: Renaming or deleting a city enforces the same referential-integrity rules as today (block-delete-if-referenced, cascade-rename) at the database/service layer, not just client-side

### Authentication & Authorization

- [ ] **AUTH-01**: User can log in with username/password verified server-side via bcrypt comparison, receiving a signed JWT access token
- [ ] **AUTH-02**: User can register a new account with a server-side-hashed password, replacing the current plaintext storage
- [ ] **AUTH-03**: Every mutating API route enforces server-side role-based access control (RBAC) — a request from a role not permitted for that action is rejected with 403, regardless of what the client UI shows
- [ ] **AUTH-04**: An expired or invalid JWT is rejected by the server with 401, requiring the user to log in again (no refresh-token flow in this milestone — see v2 Requirements)

### REST API & Validation

- [ ] **API-01**: A REST endpoint exists for every CRUD operation currently performed via `store.js` methods, covering all 7 data domains
- [ ] **API-02**: Every mutating endpoint validates its input server-side (Zod) and returns field-level error messages on invalid input, independent of client-side validation
- [ ] **API-03**: The Express API is reachable from the Vite dev server via correctly configured CORS

### Business Logic Migration

- [ ] **LOGIC-01**: The distribution-ranking/recommendation calculation (`computeRekomendasiDistribusi`) runs server-side, reading live data from the database, not client-cached state
- [ ] **LOGIC-02**: Approving a distribution decision is guarded against race conditions — two concurrent approval requests for the same city cannot both succeed
- [ ] **LOGIC-03**: Activity-log entries and notifications are generated server-side as part of the mutation that triggers them, not by the client

### Frontend Integration

- [ ] **FE-01**: Every page that currently reads/writes `store.js` directly is updated to call the new REST API instead, with `store.js`'s existing public method names and `subscribe`/`notify` contract preserved (the "store-as-seam" pattern)
- [ ] **FE-02**: Every API call that can be slow or fail shows a loading state and/or error message to the user — no page silently hangs or fails with no feedback
- [ ] **FE-03**: All existing UI/UX (layout, copy, design system) is preserved exactly; this milestone changes only where data comes from, not how it looks

### Multi-Client Sync & Concurrency

- [ ] **SYNC-01**: Two or more users logged in simultaneously (any combination of roles) see the same underlying data, reflected within a few seconds of any user's change, without manually refreshing the page

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication & Authorization

- **AUTH-05**: Refresh-token flow (httpOnly cookie + `/auth/refresh` endpoint) so users aren't forced to re-login every time the short-lived access token expires
- **AUTH-06**: Refresh-token rotation with reuse detection (full production-grade session security) — overkill at school-project scale

### Multi-Client Sync & Concurrency

- **SYNC-02**: WebSocket/SSE-based real-time push instead of polling — only worth revisiting if a genuine sub-second collaboration requirement emerges

### Quality Infrastructure (carried from v1.0)

- **TEST-01**: Automated tests for `src/utils/distribusi.js`/`forecast.js` and the new backend services
- **SEC-01**: CSV injection sanitization review for user-entered city names

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| WebSocket/SSE real-time push for all data | Disproportionate complexity for this update frequency (manual form submissions, not high-frequency events) — polling is sufficient (SYNC-01) |
| Refresh-token rotation with reuse detection | Requires a persisted session store + replay detection — real engineering effort disproportionate to a 3-account, 3-role school demo |
| Pessimistic row-locking across the whole API | Solves a problem this app doesn't have; optimistic locking on the one race-prone stock-allocation path (LOGIC-02) is sufficient |
| Microservices / split deployments | Massive overhead for ~7 resources and a single Express process |
| Generic CRUD-generator / admin-panel framework (AdminJS, Forest Admin, etc.) | Conflicts with the "no rewrite of existing UI" constraint — hand-written routes matching `store.js`'s existing method surface are the right fit |
| New UI/visual design or design-system changes | The v1.0 design system carries over unchanged; this milestone is backend/data-layer only |
| New pages, roles, or business domains | Out of scope for this milestone |
| CI/CD pipeline or production deployment infrastructure | School project scope; local run (`npm run dev` + backend dev server) is sufficient |
| Mobile app / native clients | Web-first, out of scope |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| API-01 | TBD | Pending |
| API-02 | TBD | Pending |
| API-03 | TBD | Pending |
| LOGIC-01 | TBD | Pending |
| LOGIC-02 | TBD | Pending |
| LOGIC-03 | TBD | Pending |
| FE-01 | TBD | Pending |
| FE-02 | TBD | Pending |
| FE-03 | TBD | Pending |
| SYNC-01 | TBD | Pending |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 0/17 (pending roadmap creation)
- Unmapped: 17 ⚠️ (expected — roadmap not yet created)

---
*Requirements defined: 2026-06-24*
*Last updated: 2026-06-24 after research-informed requirements definition*
