---
phase: 03-validation-edge-case-completion
reviewed: 2026-06-24T10:30:00Z
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
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-06-24T10:30:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Phase 3 validation/edge-case changes: `store.getNextAkunId()` + Register's switch off `Date.now()`, Login's field-level error split, StatusDistribusi's armada/ETA required-field validation, and InputData's empty-city-list handling. No security vulnerabilities or crash-level bugs were found — this is a client-only demo app with no real backend, and the changes are scoped tightly to validation/messaging as intended. However several logic gaps and inconsistencies were found that undermine the stated goal of "field-level validation" and "complete, trustworthy" UX: Register's `errors.umum` banner can coexist with (and visually outrank) field-specific errors, Login's auth failure handling always blames both username and password even when only one is wrong, `getNextAkunId()` is not collision-safe against manually-edited account IDs, and StatusDistribusi's armada/ETA fields silently keep stale data across reopen of the modal for different decisions. None of these are blockers for a client-only school project, but they are real correctness/UX gaps worth fixing given the phase's explicit purpose.

## Warnings

### WR-01: Register shows generic "Semua field wajib diisi" banner simultaneously with field-specific errors, making the banner redundant/contradictory

**File:** `src/pages/Register.jsx:62-83`
**Issue:** `validate()` sets `nextErrors.umum` whenever any field is empty (line 62-64), independent of the per-field checks below it (username length, password length, confirmation mismatch, duplicate username). If a user fills in `nama`, `username`, and `password` but leaves `konfirmasiPassword` blank, `errors.umum` = "Semua field wajib diisi." is shown even though only one field is actually empty — and no field-level error is shown for `konfirmasiPassword` itself (the `konfirmasiPassword !== password` check at line 74 requires `konfirmasiPassword` to be truthy, so it never fires when it's empty). The user sees a vague top-of-form message instead of being pointed at the actual empty field, defeating the purpose of field-level validation that this phase is supposed to deliver into Register/Login.
**Fix:** Replace the blanket `umum` check with explicit empty-field errors keyed per field (mirroring what Login does), e.g.:
```javascript
if (!nama.trim()) nextErrors.nama = "Nama lengkap wajib diisi.";
if (!normalizedUsername) nextErrors.username = "Username wajib diisi.";
if (!password) nextErrors.password = "Password wajib diisi.";
if (!konfirmasiPassword) nextErrors.konfirmasiPassword = "Konfirmasi password wajib diisi.";
```
and render `ErrorText` for `errors.nama` as well (currently the "Nama Lengkap" field has no error slot at all — see WR-02).

### WR-02: Register's "Nama Lengkap" field has no `ErrorText` slot, so no per-field error can ever be shown for it

**File:** `src/pages/Register.jsx:235-256`
**Issue:** Every other field in the form (`username`, `password`, `konfirmasiPassword`) renders `<ErrorText>{errors.X}</ErrorText>` directly beneath the input. The `nama` field block (lines 235-256) has no equivalent line. Even if WR-01 is fixed to populate `errors.nama`, there is currently no UI to display it — it would silently fall back to the generic `errors.umum` banner only.
**Fix:** Add `<ErrorText>{errors.nama}</ErrorText>` after the `nama` input's closing `</span>` (after line 255), consistent with the other three fields.

### WR-03: Login's "auth failed" branch always reports both username and password as wrong, even when only the password (or only the username) was incorrect

**File:** `src/pages/Login.jsx:55-63`
**Issue:** `store.cariAkun(username, password, role)` returns `null` for three distinct failure modes: unknown username, correct username with wrong password, or correct username/password with wrong role selected. The commit message acknowledges this ("the boolean result can't distinguish which one was wrong") but the chosen behavior is misleading: a user who typed their username and password correctly but selected the wrong role tab is told `"Username tidak ditemukan."` and `"Password salah untuk akun ini."` — both of which are factually false in that scenario, actively misleading the user away from the real problem (wrong role selected).
**Fix:** Disambiguate using the data already available — `state.daftarAkun` lookups by username/role are cheap and `cariAkun` could expose enough info to distinguish cases, e.g. add a store helper or do a username-only lookup in Login to differentiate:
```javascript
const akun = store.cariAkun(username, password, role);
if (!akun) {
  const akunByUsername = store.getDaftarAkun().find((a) => a.username === username.trim());
  if (!akunByUsername) {
    setErrors({ username: "Username tidak ditemukan." });
  } else if (akunByUsername.password !== password) {
    setErrors({ password: "Password salah untuk akun ini." });
  } else {
    setErrors({ role: "Role tidak sesuai untuk akun ini." });
  }
  return;
}
```

### WR-04: `getNextAkunId()` / `getNextId()` is not collision-safe if any account ID doesn't match the `U###` numeric-suffix convention

**File:** `src/store.js:53-61, 213-215`
**Issue:** `getNextId` extracts digits from each existing ID via `String(item.id).replace(/\D/g, "")` and takes `max + 1`. The seed accounts use `U001`–`U003`, so this works today, but it silently breaks the moment any account is added with a non-conforming ID — e.g. if a future bulk-import or admin-edit feature introduces an account whose `id` has no digits (`Number.isNaN` branch falls back to `maxValue`, effectively ignoring that record) or an ID like `U001-temp` (digits `001` get extracted, not `0`). There is currently no `hapusAkun`/edit-account path in `store.js`, so the risk is latent rather than active, but the function offers no defense if `daftarAkun` ever contains a hand-edited or imported record — it will happily reuse an ID that collides with an existing or soon-to-be-restored account.
**Fix:** Not urgent given current call sites, but worth hardening defensively, e.g. verify the candidate ID is actually absent from the collection before returning it, retrying past collisions:
```javascript
const getNextId = (items, prefix) => {
  const existingIds = new Set(items.map((item) => String(item.id)));
  let nextNumber = items.reduce((maxValue, item) => {
    const numericId = Number(String(item.id).replace(/\D/g, ""));
    return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
  }, 0) + 1;
  let candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  while (existingIds.has(candidate)) {
    nextNumber += 1;
    candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }
  return candidate;
};
```
Note also that `getNextAkunId()` returns IDs in `U-001` format (hyphenated, via the shared `getNextId` prefix logic) whereas the seed data and existing accounts use `U001` (no hyphen) — see IN-01.

## Info

### IN-01: New account IDs from `getNextAkunId()` use a different format than seeded accounts (`U-001` vs `U001`)

**File:** `src/store.js:53-61, 213-215`
**Issue:** `getNextId(items, prefix)` always formats as `` `${prefix}-${String(nextNumber).padStart(3, "0")}` `` — i.e. `U-001`, `U-004`, etc. — but the seed accounts in `akunSeed` (store.js:7-29) use `U001`, `U002`, `U003` with no hyphen. This is consistent with how `getNextId` is used elsewhere (`PMT-001`, `NTF-001`, `LOG-001`, `KPT-001` all use hyphens), so `getNextAkunId()` is internally consistent with the rest of the codebase's convention — but it means newly registered accounts will have an ID format inconsistent with the three seeded accounts, which is a cosmetic/data-consistency wrinkle worth knowing about even though nothing in the codebase currently parses or displays account IDs to end users.
**Fix:** If consistency with seed data matters, special-case the `"U"` prefix to omit the hyphen, or accept the inconsistency since account IDs aren't user-facing.

### IN-02: StatusDistribusi's armada/ETA fields are not cleared/reset when switching `selectedStatus` away from `dalam-pengiriman` and back within the same modal session

**File:** `src/pages/StatusDistribusi.jsx:69-90, 240-296`
**Issue:** `openStatusModal` seeds `armada`/`eta` from the clicked item (lines 73-74). If the user then changes the `<select>` to `dalam-pengiriman` for an item that previously had no armada/eta, types something into `armada`, then switches the select to `selesai` and back to `dalam-pengiriman` without closing the modal, the typed `armada` value persists (state isn't reset on status change) — likely intended behavior, but `validateModalForm` only re-validates on submit, so there's no immediate feedback that the previously-cleared error (`modalErrors.armada`) might now be stale relative to a value the user no longer remembers entering. This is a minor UX edge case, not a data-integrity bug, since `saveStatus` only persists `armada`/`eta` when `selectedStatus === "dalam-pengiriman"` at save time (lines 105-108), so incorrect status values can't leak through.
**Fix:** No fix required for correctness; consider resetting `armada`/`eta` to `""` when the select changes away from `dalam-pengiriman` if a "clean slate per status change" UX is desired.

### IN-03: `InputData.jsx` duplicate-check toast and inline error both fire for the same condition with overlapping but not identical text

**File:** `src/pages/InputData.jsx:96-102` vs `src/pages/InputData.jsx:54-56, 274-277`
**Issue:** When `daftarKota.length === 0`, `handleSubmit` shows a toast ("Belum ada kota yang dikonfigurasi...") and returns before calling `validate()` (lines 96-102). Separately, the JSX directly renders the same message inline as a `<p>` when `daftarKota.length === 0` (lines 274-277). This means the message is duplicated — once permanently visible inline, and again as a toast if the user manages to trigger `handleSubmit` (e.g. via Enter key) while the city list is empty. Since the `<select>` is entirely replaced by the inline message when there are no cities, submitting the form is really only reachable via pressing Enter in another field, but when it happens the user sees the same message twice (once already on-screen, once as a transient toast), which reads as redundant rather than reinforcing.
**Fix:** Low priority. Could skip the toast when the inline message is already visible, or skip the inline message in favor of relying on `errors.kota` once `validate()` is consistently invoked. Current behavior is technically correct, just visually repetitive.

### IN-04: `errors.keterangan` is referenced in render but `validate()` never sets it

**File:** `src/pages/InputData.jsx:351-353` vs `src/pages/InputData.jsx:51-81`
**Issue:** The JSX conditionally renders `{errors.keterangan ? <p style={errorStyle}>{errors.keterangan}</p> : null}` (lines 351-353), but `validate()` (lines 51-81) has no branch that ever assigns `nextErrors.keterangan`. This is dead/defensive code — harmless, but it's a leftover scaffold for a validation rule that doesn't exist (keterangan is optional, which is correct per the field's intent), so the conditional render block serves no purpose currently.
**Fix:** Remove the dead conditional block, or leave a comment noting `keterangan` is intentionally optional and the slot exists for future use. Not blocking.

---

_Reviewed: 2026-06-24T10:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
