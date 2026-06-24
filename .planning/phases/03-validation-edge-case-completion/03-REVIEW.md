---
phase: 03-validation-edge-case-completion
reviewed: 2026-06-24T11:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/store.js
  - src/pages/Register.jsx
  - src/pages/Login.jsx
  - src/pages/StatusDistribusi.jsx
  - src/pages/InputData.jsx
findings:
  critical: 0
  warning: 0
  info: 4
  total: 4
status: issues_found
---

# Phase 3: Code Review Report (Re-review — Fix Verification)

**Reviewed:** 2026-06-24T11:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This is a targeted re-review verifying that commits `e93428d`, `ae16503`, and `2d6457f` correctly fixed the four previously-reported Warning findings (WR-01, WR-02, WR-03, WR-04) without introducing regressions. All five files in the original phase scope were re-read in full, and each fix was inspected directly against `git show <commit> -- <file>` diffs plus a live re-trace of the surrounding logic. `getNextId`'s collision-safety fix was additionally verified by executing the before/after implementations against adversarial inputs (empty lists, non-numeric-suffix IDs, hand-edited gaps, exact-collision scenarios, duplicate max IDs) in Node.

**Result: all 4 Warnings are confirmed fixed. No regressions were introduced. 0 new Warnings or Critical issues found.**

The four previously-reported Info findings (IN-01 account ID hyphen-format inconsistency, IN-02 StatusDistribusi stale armada/eta state, IN-03 InputData duplicate empty-kota messaging, IN-04 dead `errors.keterangan` render branch) were out of scope for these three commits and remain unaddressed — they are carried forward unchanged below for traceability, plus one new Info note about a pre-existing pattern noticed while verifying WR-01/WR-02.

## Verification of Previously-Reported Warnings

### WR-01: Register generic "Semua field wajib diisi" banner — FIXED

**File:** `src/pages/Register.jsx:57-98` (commit `e93428d`)
**Verification:** `validate()` no longer sets a blanket `nextErrors.umum`. It now sets four independent keys — `nama`, `username`, `password`, `konfirmasiPassword` — each guarded by its own `if (!field)` check, mirroring Login's pattern. The dead `<ErrorText>{errors.umum}</ErrorText>` JSX and its conditional `marginTop: errors.umum ? "var(--space-4)" : 0` were removed (diff confirms both deletions). Grepped the entire `src/` tree for `errors.umum` / `nextErrors.umum` — zero remaining references. The original failure scenario described in WR-01 (user leaves only `konfirmasiPassword` blank, sees a vague top-of-form banner instead of a field-specific message) no longer occurs: `konfirmasiPassword` now gets its own "Konfirmasi password wajib diisi." message when empty, independent of the `!== password` mismatch check below it.
**Regression check:** None of the other per-field checks (username length, password length, confirmation mismatch, duplicate username) were touched by this commit; each still writes to a mutually-exclusive error key due to existing guard conditions (e.g. `normalizedUsername && length < 4` cannot fire alongside `!normalizedUsername`). Confirmed clean.

### WR-02: Register's "Nama Lengkap" field missing `ErrorText` slot — FIXED

**File:** `src/pages/Register.jsx:244-266` (commit `e93428d`)
**Verification:** The `nama` field's `<label>` block now renders `<ErrorText>{errors.nama}</ErrorText>` immediately after the input's wrapping `<span>`, in the same position/pattern as the other three fields (Username, Password, Konfirmasi Password). `ErrorText` (`src/components/auth/AuthShared.jsx`) returns `null` when `children` is falsy, so the default empty state renders nothing — confirmed no layout shift or stray DOM in the no-error case.
**Regression check:** None — this is a pure JSX addition with no side effects on other fields' rendering or the form's submit flow.

### WR-03: Login auth-failure misattribution (always blames username+password) — FIXED

**File:** `src/pages/Login.jsx:55-71` (commit `ae16503`)
**Verification:** The `!akun` branch no longer unconditionally sets both `username` and `password` errors. It now performs a secondary lookup (`getDaftarAkun().find(item => item.username === normalizedUsername)`) to disambiguate the three distinct failure modes `cariAkun` collapses into a single `null`:
- Unknown username → `{ username: "Username tidak ditemukan." }`
- Username exists, password mismatch → `{ password: "Password salah untuk akun ini." }`
- Username + password correct, role mismatch → `{ role: "Role tidak sesuai untuk akun ini." }` (previously inexpressible)

Traced the trimming/comparison consistency between this new lookup and `store.cariAkun`'s internal logic (`src/store.js:224-234`): both trim username via `.trim()` before comparing with `===`, and neither trims password — symmetric in both places, so no new mismatch was introduced relative to pre-fix behavior.
**Regression check:** The previously-correct "both wrong" case (unknown username, where password is irrelevant) still surfaces as a `username`-only error now (more precise, not a regression — it was always factually true that username was wrong in that case). No call site outside `Login.jsx` depends on the old two-key error shape. Confirmed clean.

### WR-04: `getNextId` not collision-safe against non-conforming IDs — FIXED

**File:** `src/store.js:53-68` (commit `2d6457f`)
**Verification:** `getNextId` now builds `existingIds = new Set(items.map(item => String(item.id)))` and loops (`while (existingIds.has(candidate))`) incrementing `nextNumber` until a candidate not already present is found, rather than trusting `maxValue + 1` blindly. Directly executed both the old and new implementations side-by-side in Node against adversarial inputs:
- Empty list → `PMT-001` (both)
- Non-numeric-suffix-only IDs → `PMT-001` (both)
- Gapped sequence (`001, 002, 005`) → `PMT-006` (both; no collision in this case, correctly)
- Exact-collision-inducing sets (duplicate max IDs, mixed-prefix lists) → new version's `while` loop correctly walks past any collision; old version could return an already-occupied ID in equivalent hand-edited-import scenarios per the commit's stated threat model
- All 5 production call sites (`pushNotifikasi`, `pushActivity`, `getNextAkunId`, `addPermintaan`, `addKeputusan`) funnel through this single helper and uniformly inherit the fix.

No infinite-loop risk: the `while` condition only re-loops when the *current* candidate collides, and `nextNumber` strictly increases each iteration, so termination is guaranteed for any finite `existingIds` set.
**Regression check:** Confirmed via execution that all previously-passing cases (sequential seed data, empty collections) produce identical output to the pre-fix version. No behavior change for the common/non-colliding path — only the previously-unguarded collision path is now corrected. Confirmed clean.

## Info

_Carried forward unchanged from the original review — out of scope for the WR-01..WR-04 fix commits being verified here, and not addressed by them._

### IN-01: New account IDs from `getNextAkunId()` use a different format than seeded accounts (`U-001` vs `U001`)

**File:** `src/store.js:53-68, 220-222`
**Issue:** `getNextId` formats all candidates as `` `${prefix}-${...}` `` (hyphenated), but seeded accounts use `U001`/`U002`/`U003` (no hyphen). Newly registered accounts via Register.jsx will get `U-004`-style IDs, inconsistent with the three seeded accounts. Cosmetic only — no code currently parses or displays account IDs to end users.
**Fix:** If consistency matters, special-case the `"U"` prefix to omit the hyphen; otherwise accept the inconsistency since IDs aren't user-facing.

### IN-02: StatusDistribusi's armada/ETA fields are not reset when toggling `selectedStatus` away from and back to `dalam-pengiriman` within the same modal session

**File:** `src/pages/StatusDistribusi.jsx:69-90, 240-296`
**Issue:** Switching the status `<select>` away from `dalam-pengiriman` and back without closing the modal leaves any typed `armada`/`eta` value in place (not reset on status change). Not a data-integrity issue since `saveStatus` only persists these fields when `selectedStatus === "dalam-pengiriman"` at save time.
**Fix:** Optional — reset `armada`/`eta` to `""` on status change away from `dalam-pengiriman` if a "clean slate" UX is desired. Not required for correctness.

### IN-03: `InputData.jsx` duplicate empty-kota messaging — inline message and toast both fire for the same condition

**File:** `src/pages/InputData.jsx:96-102` vs `src/pages/InputData.jsx:274-277`
**Issue:** When `daftarKota.length === 0`, the same "Belum ada kota yang dikonfigurasi..." message is shown both permanently inline (replacing the `<select>`) and as a transient toast if `handleSubmit` is triggered (e.g. via Enter key in another field). Visually redundant, not incorrect.
**Fix:** Low priority — skip the toast when the inline message is already visible, or rely solely on `errors.kota`. Current behavior is technically correct, just repetitive.

### IN-04: `errors.keterangan` is referenced in render but `validate()` never sets it

**File:** `src/pages/InputData.jsx:351-353` vs `src/pages/InputData.jsx:51-81`
**Issue:** Dead conditional render block for a validation rule that doesn't exist — `keterangan` is intentionally optional, so this is harmless leftover scaffolding with no functional impact.
**Fix:** Remove the dead block, or add a comment noting `keterangan` is intentionally optional. Not blocking.

---

_Reviewed: 2026-06-24T11:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
