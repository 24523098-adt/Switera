---
phase: 2
slug: role-differentiated-reporting
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-24
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| store→Laporan render | `snapshot.roleAktif`, `snapshot.keputusan`, `snapshot.riwayatKeputusan` are client-controlled localStorage-backed state; Laporan.jsx trusts and renders them directly with no server validation (consistent with existing app-wide model) | Role + collection data, client-only |
| user→CSV export | `downloadCsv()` writes city/status/armada string fields directly into CSV cells without sanitization (pre-existing `utils/csv.js` behavior, not modified by this plan) | Free-text fields → CSV cells |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering | Laporan.jsx roleAktif branch | accept | `roleAktif` validated against `roleOptions` whitelist with safe default to "Manajer Distribusi" (existing pattern, unchanged) — a tampered/invalid localStorage value cannot produce an undefined branch | closed |
| T-02-02 | Information Disclosure | GrafikStatusPengiriman / Distribusi Aktif table | accept | Same-origin client-only app; both roles already have store-level read access to all collections via `store.getState()` — this phase only changes which fields are displayed, not what is readable | closed |
| T-02-03 | Tampering | CSV injection via city/armada free-text fields exported to CSV | accept | Pre-existing in `utils/csv.js`/current Laporan CSV export; tracked separately as SEC-01 in REQUIREMENTS.md v2 (deferred), out of scope for this phase | closed |
| T-02-SC | Tampering | npm/pip/cargo installs | mitigate | No new package installs in this plan (uses existing chart.js dependency already in package.json) | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-01 | Whitelist + safe-default pattern already proven in production (Phase 1 and prior pages) | autonomous run | 2026-06-24 |
| AR-02-02 | T-02-02 | No new disclosure surface — same store-level read access both roles already had | autonomous run | 2026-06-24 |
| AR-02-03 | T-02-03 | Pre-existing CSV injection exposure, explicitly deferred to SEC-01 v2 in REQUIREMENTS.md; out of this phase's scope per CONTEXT.md boundary | autonomous run | 2026-06-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-24 | 4 | 4 | 0 | autonomous run (register authored at plan time, all dispositions pre-resolved — short-circuit per secure-phase.md Step 3) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-24
