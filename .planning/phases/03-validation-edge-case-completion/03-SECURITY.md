---
phase: 3
slug: validation-edge-case-completion
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-24
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User input → Login form | Untrusted username/password/role strings entered client-side, matched in-memory against plaintext `state.daftarAkun` | Credentials, client-only |
| User input → Register form | Untrusted nama/username/password strings entered client-side, persisted in plaintext to `localStorage` | Account data, client-only |
| User input → StatusDistribusi modal | Untrusted armada (free text) and eta (date) strings, persisted via `store.updateKeputusan` into localStorage | Free-text + date, client-only |
| User input → InputData form | Untrusted kota selection (constrained to existing `daftarKota.nama` values) and jumlahPermintaan, persisted via `store.addPermintaan` | Constrained selection + number, client-only |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Information Disclosure | Login.jsx error messages | accept (rationale updated post-fix) | Original premise ("both messages co-occur") was invalidated by WR-03 fix (commit `ae16503`), which now disambiguates username/password/role errors — re-audited and re-accepted: client-only app already exposes the full plaintext `daftarAkun` list via `localStorage` to any browser attacker, so a login-form enumeration oracle adds no meaningful new disclosure beyond what's already trivially available; ASVS Level 1 does not require enumeration resistance | closed |
| T-03-02 | Tampering | store.getNextAkunId() | accept | Read-only derivation from existing in-memory `state.daftarAkun`; hardened by WR-04 fix (commit `2d6457f`) to be collision-safe via Set-based candidate check | closed |
| T-03-03 | Repudiation | Register.jsx account creation | accept | Account creation already triggers no activity-log entry in current code (pre-existing gap, out of scope for VALID-04 which only concerns ID format) | closed |
| T-03-04 | Tampering | StatusDistribusi armada free-text field | accept | Free-text field already existed pre-Phase-3 with no sanitization; this plan only adds a required-non-blank check, does not change the trust boundary; rendered via React's default escaping (no `innerHTML`) | closed |
| T-03-05 | Denial of Service (self) | InputData empty-daftarKota guard | accept | Guard only blocks the user's own form submission with a clear message; no risk to other users or shared state in a client-only single-browser app | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-01 | Post-fix re-audit: the WR-03 code-review fix (disambiguating Login auth-failure messages) technically reintroduces a username-enumeration oracle, invalidating the plan-time rationale. Re-accepted under updated reasoning — this is a client-only demo with no backend; any browser attacker already has direct plaintext read access to the entire `daftarAkun` list via `localStorage`, so the login-form oracle adds no incremental disclosure. Enumeration resistance is an ASVS Level 2+ control, out of scope at this project's declared ASVS Level 1. | autonomous run (gsd-security-auditor recommendation, Option A) | 2026-06-24 |
| AR-03-02 | T-03-03 | Pre-existing repudiation gap (no activity-log on account creation), explicitly out of scope for VALID-04 | autonomous run | 2026-06-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-24 | 5 | 5 | 0 | gsd-security-auditor — full verification run (not short-circuited) because WR-03's post-review fix changed Login.jsx behavior in a way that invalidated T-03-01's plan-time accept rationale; re-audited and re-accepted under updated reasoning (see Accepted Risks Log) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-24
