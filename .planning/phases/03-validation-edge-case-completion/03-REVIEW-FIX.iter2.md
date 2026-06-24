---
phase: 03-validation-edge-case-completion
fixed_at: 2026-06-24T10:45:00Z
review_path: .planning/phases/03-validation-edge-case-completion/03-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-06-24T10:45:00Z
**Source review:** .planning/phases/03-validation-edge-case-completion/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (critical_warning scope — 0 critical, 4 warning; info findings excluded)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Register shows generic "Semua field wajib diisi" banner simultaneously with field-specific errors, making the banner redundant/contradictory

**Files modified:** `src/pages/Register.jsx`
**Commit:** e93428d
**Applied fix:** Replaced the blanket `errors.umum` check in `validate()` with explicit per-field required checks for `nama`, `username`, `password`, and `konfirmasiPassword`, mirroring the pattern already used in Login. Removed the now-dead `errors.umum` banner render and its conditional `marginTop` (no code path sets `errors.umum` anymore). Fixed together with WR-02 since both touch the same `validate()`/render logic in the same file.

### WR-02: Register's "Nama Lengkap" field has no `ErrorText` slot, so no per-field error can ever be shown for it

**Files modified:** `src/pages/Register.jsx`
**Commit:** e93428d
**Applied fix:** Added `<ErrorText>{errors.nama}</ErrorText>` beneath the Nama Lengkap input, consistent with the other three fields, so the new `errors.nama` value set by the WR-01 fix actually renders.

### WR-03: Login's "auth failed" branch always reports both username and password as wrong, even when only the password (or only the role) was incorrect

**Files modified:** `src/pages/Login.jsx`
**Commit:** ae16503
**Applied fix:** When `store.cariAkun()` returns null, the handler now looks up the account by trimmed username alone via `store.getDaftarAkun().find(...)` and attributes the error to whichever field is actually wrong: unknown username -> `errors.username`, known username with wrong password -> `errors.password`, known username/password with wrong role tab -> `errors.role`. Adapted directly from the REVIEW.md suggestion, using `username.trim()` to stay consistent with the file's existing normalization pattern.
**Note:** This is a logic/branching change (auth-failure attribution) — flagged as `fixed: requires human verification`. Both syntax tiers passed, but the corrected branching behavior (especially the "wrong role" case) should be manually confirmed against the three account/role combinations in `src/store.js`'s seed data before relying on it.

### WR-04: `getNextAkunId()` / `getNextId()` is not collision-safe if any account ID doesn't match the `U###` numeric-suffix convention

**Files modified:** `src/store.js`
**Commit:** 2d6457f
**Applied fix:** Hardened `getNextId(items, prefix)` to track existing IDs in a `Set` and verify the candidate ID is actually absent before returning it, incrementing past any collisions in a `while` loop. Applied exactly as suggested in REVIEW.md; left the `U`-prefix hyphenation inconsistency (IN-01, an Info-level finding) untouched since it's out of scope for `critical_warning`.

## Skipped Issues

None — all 4 in-scope findings (WR-01 through WR-04) were fixed. IN-01 through IN-04 were excluded by `fix_scope: critical_warning` and were not attempted.

---

_Fixed: 2026-06-24T10:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
