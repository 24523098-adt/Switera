---
phase: 4
slug: auth-landing-design-system-unification
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-24
---

# Phase 4 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User input → Login form | Unchanged from Phase 3 — untrusted username/password/role matched in-memory against plaintext `state.daftarAkun` | Credentials, client-only |
| User input → Register form | Unchanged from Phase 3 — untrusted nama/username/password persisted in plaintext to `localStorage` | Account data, client-only |
| Visitor → Landing page | Read-only seeded demo data (`store.getPermintaan()`, `store.getDaftarKota()`) rendered for the public marketing page; no write path | Demo data, client-only, no untrusted input |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | Login/Register submit button refactor | mitigate | Confirmed by code review: `handleSubmit`/`validate`/`cariAkun`/`tambahAkun` were not touched in either file; only the rendered `<button>` element changed to `<Tombol>`. All validation copy and auth-flow behavior verified byte-preserved | closed |
| T-04-02 | Spoofing | Auth credential check (`store.cariAkun`) | accept | Out of scope — plaintext localStorage auth is an explicit accepted decision carried from Phase 3 (REQUIREMENTS.md "Out of Scope"); untouched by this phase | closed |
| T-04-03 | Tampering | Landing component refactor (button/card/icon swap) | mitigate | Confirmed: `aggregatePermintaanRanking`/`store.get*` read-only demo-data flow is unchanged; `<PetaGeografis ranking={rankingDemo} daftarKota={daftarKotaDemo} />` props unchanged across the Card migration | closed |
| T-04-04 | Denial of Service (self) | Dead-code removal (`useRipple`/`RippleSpans`/`LandingButton`/`SIZE_STYLES`) | mitigate | Verified via `npx vite build` succeeding with zero errors after removal — no dangling references | closed |
| T-04-SC | Tampering | npm/pip/cargo installs | mitigate | No package installs occurred in this phase (consumed only existing first-party components) | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-02 | Plaintext client-only auth carried forward unchanged from Phase 3's accepted rationale; this phase touches only button rendering, not the credential check | autonomous run | 2026-06-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-24 | 5 | 5 | 0 | Inline review against the actual diff (no `gsd-security-auditor` subagent spawned) — this phase's threat model in both PLAN.md files was a pure rendering-surface refactor with no logic/state/auth changes, verified directly against the committed diff rather than re-deriving from scratch |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-24
