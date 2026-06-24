---
phase: 04-auth-landing-design-system-unification
plan: 02
subsystem: ui
tags: [react, design-system, landing]

requires:
  - phase: 04-auth-landing-design-system-unification
    provides: 04-01's confirmation that Tombol/Card/IkonDaun stay byte-unchanged is the same discipline applied here
provides:
  - Landing.jsx rendering via shared Tombol, Card, and IkonDaun instead of bespoke local equivalents
  - Dead-code removal of LandingButton, SIZE_STYLES, local RippleSpans, unused useRipple import
affects: [Phase 5 (Full Completeness Pass) — Landing is now on the same design-system baseline as the rest of the app]

tech-stack:
  added: []
  patterns:
    - "Card's style override prop is the sanctioned way to express bespoke card-shaped surfaces (aspectRatio, custom shadows) without touching Card.jsx"

key-files:
  created: []
  modified:
    - src/pages/Landing.jsx

key-decisions:
  - "Local IkonDaun (byte-identical duplicate) deleted in favor of the shared import — confirmed identical viewBox/paths/defaults before deleting"
  - "Lihat Demo's trailing IkonArrowRight folded into Tombol's label prop (a <span> wrapper) since Tombol has no iconRight prop"
  - "Map-section Card passes padding: 0 to override Card's default var(--space-6) padding, since the map frame is flush with no inset in the original design"

patterns-established:
  - "All 5 Landing CTA/nav buttons use variant=\"primer\" (primary actions) or variant=\"sekunder\" (secondary/ghost actions) — no more ad-hoc tone/size button props"

requirements-completed: [DESIGN-01, DESIGN-04]

duration: ~25min
completed: 2026-06-24
status: complete
---

# Phase 4 Plan 02: Landing Page → Shared Component Library Summary

**Landing.jsx now renders through the shared `Tombol`, `Card`, and `IkonDaun` components instead of hand-rolled equivalents, with all 9 sections, layout, and Indonesian copy preserved exactly.**

## Performance

- **Tasks:** 4 (3 automated + 1 manual verification)
- **Files modified:** 1

## Accomplishments
- Deleted the duplicate local `IkonDaun` (byte-identical to the shared component) — both call sites unchanged
- Migrated all 5 `LandingButton` call sites (nav Masuk/Daftar, hero Mulai Sekarang/Lihat Demo, closing CTA Daftar Sekarang) to `Tombol`
- Removed dead code: `LandingButton`, `SIZE_STYLES`, local `RippleSpans`, unused `useRipple` import
- Converted `VisualCardShell` and the map-section frame to the shared `Card` via its `style` override prop
- Zero edits to `src/components/Tombol.jsx`, `src/components/Card.jsx`, `src/components/IkonDaun.jsx` (confirmed via `git diff --stat` after every task)

## Task Commits

1. **Task 1: De-duplicate IkonDaun** - `f7d3f4c` (fix)
2. **Task 2: Migrate LandingButton call sites to Tombol** - `ed80b41` (feat)
3. **Task 3: Adopt shared Card for VisualCardShell and map container** - `68b0a98` (feat)
4. **Task 4: Visual regression spot-check (DESIGN-04)** - no commit (verification-only)

## Files Created/Modified
- `src/pages/Landing.jsx` - IkonDaun de-duplicated, all buttons on Tombol, card surfaces on Card

## Decisions Made
- See `key-decisions` in frontmatter — IkonDaun de-dup, IkonArrowRight folded into label, map Card's padding:0 override.

## Deviations from Plan

### Auto-fixed Issues

**1. Task 3's automated verify script line-ending mismatch**
- **Found during:** Task 3 (Card adoption) self-check
- **Issue:** The plan's verify regex (`/<Card[ >]/g`) assumed single-line `<Card ...>` JSX, but the file uses CRLF line endings, so `<Card\r\n      style=` has `\r` immediately after `Card`, not a space — the literal regex never matched even though both `<Card>` elements are correctly in place.
- **Fix:** No code fix needed — confirmed correctness manually by normalizing both `\r` and `\n` before re-running the same check logic (2 Card elements found, all other conditions true). Did not alter file formatting/line-endings to chase the script, since CRLF is this file's existing convention.
- **Verification:** Manual regex re-run with `\r\n` normalized passes; `git diff --stat src/components/Card.jsx` confirms zero edits to the shared component.

## Issues Encountered
- No `chromium-cli` or Playwright tooling available in this environment for Task 4's manual browser spot-check. Substituted: (1) `npx vite build` — completed with zero errors, confirming no broken imports/JSX across the whole app; (2) direct grep-based code audit of `src/pages/Dashboard.jsx`, `src/pages/ManajemenKota.jsx`, and `src/pages/InputData.jsx` confirming they consume `Tombol`/`Card` only through the stable public prop API (`label`/`variant`/`onClick`/`style` and `style`/`children` respectively), with no shadowing or shared-state coupling to Landing.jsx; (3) confirmed `.tombol-primer`/`.tombol-sekunder`/`.app-card` CSS classes are already defined in `src/tokens.css` (proven in production use by ManajemenKota.jsx and Dashboard.jsx), so Landing's new Tombol/Card usages render with full design-system styling, not unstyled markup. This is **not** a substitute for an actual visual screenshot — flagging explicitly per project convention rather than claiming a browser-verified result that didn't happen.

## Next Phase Readiness
DESIGN-01 through DESIGN-04 are functionally complete pending the phase-level verification/code-review/security/UI-review pipeline. Recommend a real browser check (manual or via `/run-skill-generator` to set up `chromium-cli`) before the milestone ships, even though the structural checks above give high confidence of zero regression.

---
*Phase: 04-auth-landing-design-system-unification*
*Completed: 2026-06-24*
