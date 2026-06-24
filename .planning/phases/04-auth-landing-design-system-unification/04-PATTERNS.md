# Phase 4: Auth & Landing Design-System Unification - Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 3 (modified, no new files — consistency port only)
**Analogs found:** 3 / 3

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|-----------------|----------------|
| `src/pages/Landing.jsx` | component (marketing page) | request-response (static render + nav triggers) | `src/pages/Dashboard.jsx` (for Tombol/Card usage), `src/components/IkonDaun.jsx` (de-dupe target) | role-match (Dashboard is the canonical "already migrated" page) |
| `src/pages/Login.jsx` | component (auth form) | request-response (form submit → store mutation) | `src/pages/Register.jsx` (sibling, same shell) + `src/components/auth/AuthShared.jsx` (shared pieces both already use) | exact (Login/Register already share identical chrome pattern) |
| `src/pages/Register.jsx` | component (auth form) | request-response (form submit → store mutation) | `src/pages/Login.jsx` + `src/components/auth/AuthShared.jsx` | exact |

No new files are created in this phase — it is a refactor-in-place of three existing pages. `src/components/Tombol.jsx`, `src/components/Card.jsx`, `src/components/IkonDaun.jsx`, `src/components/auth/AuthShared.jsx` are **consumed, not modified** (per UI-SPEC Shared-Component Risk Register — zero edits to these files unless the optional `Modal.jsx` additive-prop path is taken for Risk 4).

---

## Pattern Assignments

### `src/pages/Landing.jsx` (component, request-response)

**Analog:** `src/pages/Dashboard.jsx` (canonical correct `Tombol`/`Card` consumer)

**1. `Tombol` import + usage pattern** — copy exactly this shape, do not invent new props:

Import (`src/pages/Dashboard.jsx:10`):
```javascript
import Tombol from "../components/Tombol";
```

Primary button usage, full-width, default variant (`src/pages/Dashboard.jsx:1098-1102`):
```javascript
<Tombol
  label="Tetapkan Tujuan"
  onClick={handleTetapkanDistribusi}
  style={{ width: "100%", padding: "10px" }}
/>
```

Secondary/compact variant with icon-bearing label, explicit `variant="sekunder"` (`src/pages/Dashboard.jsx:1347-1356`):
```javascript
<Tombol
  label={
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <IkonEditKecil /> Perbarui Status
    </span>
  }
  variant="sekunder"
  onClick={() => openStatusModal(item)}
  style={{ padding: "5px 10px", fontSize: "var(--text-xs)" }}
/>
```

**Key takeaway for Landing:** `Tombol`'s only variants are `primer` (default, green fill), `sekunder` (transparent/bordered), `bahaya` (red, not needed here). Per UI-SPEC Risk 1 (locked decision), Landing's hero/nav CTAs ("Mulai Sekarang", "Daftar Sekarang", "Daftar") should become `<Tombol variant="primer" label="..." onClick={...} style={{...sizing overrides...}} />`, and "Masuk"/ghost-style nav button should become `<Tombol variant="sekunder" ... />`. Size differences (Landing's `sm`/`md` sizing from the old `SIZE_STYLES` map at `Landing.jsx:398-401`) are expressed via the `style` override prop exactly as Dashboard does above (`style={{ padding: "10px" }}`, `style={{ padding: "5px 10px", fontSize: "var(--text-xs)" }}`) — `Tombol` has no `size` prop, so all sizing must go through `style`.

**Local `LandingButton` to be deleted** (`src/pages/Landing.jsx:398-419`):
```javascript
const SIZE_STYLES = {
  sm: { padding: "7px 16px", fontSize: "var(--text-xs)" },
  md: { padding: "11px 24px", fontSize: "var(--text-sm)" },
};

function LandingButton({ label, onClick, tone = "primer", size = "md", iconRight, style }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();
  return (
    <button
      type="button"
      className={`landing-btn landing-btn-${tone}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ ...SIZE_STYLES[size], ...style }}
    >
      {label}
      {iconRight}
      <RippleSpans ripples={ripples} removeRipple={removeRipple} />
    </button>
  );
}
```
All 5 call sites of `LandingButton` (lines 1077, 1078, 1178, 1185, 1580) need to become `Tombol` calls. Note `iconRight` prop has no `Tombol` equivalent — fold the icon into the `label` node (same pattern as the `IkonEditKecil`-in-label example above): `label={<span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>Lihat Demo <IkonArrowRight /></span>}`.

**2. `Card` import + `style`-override pattern** — copy exactly this shape:

Import (`src/pages/Dashboard.jsx:3`):
```javascript
import Card from "../components/Card";
```

Style-override usage, additive only, no new props on `Card` itself (`src/pages/Dashboard.jsx:390`):
```javascript
<Card style={{ minHeight: "420px" }}>
  {/* ...chart content... */}
</Card>
```

Plain usage with no overrides (`src/pages/Dashboard.jsx:492`):
```javascript
<Card>
  {/* ...content... */}
</Card>
```

**Apply to Landing's `VisualCardShell`** (`src/pages/Landing.jsx:612-627`, currently a bespoke `<div>`):
```javascript
function VisualCardShell({ children, icon }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-mid)",
        borderRadius: "14px",
        padding: "28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        aspectRatio: "4 / 3",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
```
Per UI-SPEC Risk 2 (locked decision), convert the outer `<div>` to `<Card style={{...the same custom border/padding/boxShadow/aspectRatio overrides...}}>` — this satisfies "renders using Card" without adding any new prop to `Card.jsx`. Same treatment applies to the FAQ section container and (if card-shaped) the testimonial-chip container at `Landing.jsx:1468` (currently a raw `boxShadow: "0 20px 60px rgba(0,0,0,0.4)"` div). Do NOT apply `Card` to the hero glow gradient or `MockupDashboard` chrome (`Landing.jsx:476-510`) — those are decorative, not semantically card-shaped, per UI-SPEC explicit exclusion.

**3. `IkonDaun` de-duplication** — straightforward import swap:

Current duplicate in Landing (`src/pages/Landing.jsx:133-157`) is byte-identical to the shared component:
```javascript
function IkonDaun({ size = 22, color = "var(--color-primary)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M39 8C25.5 8.4 13 16.7 13 29.2C13 35.2 17.8 40 23.8 40C35.7 40 41.2 25.4 39 8Z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      <path d="M11 40C16.8 27.3 25.3 19.5 36 14" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
```
Delete this local function. Replace with the exact import already used by Login/Register (`src/pages/Login.jsx:4`, `src/pages/Register.jsx:4`):
```javascript
import IkonDaun from "../components/IkonDaun";
```
Usage call sites (`Landing.jsx:1019`, `Landing.jsx:1605`) need no change — `<IkonDaun size={18} />` / `<IkonDaun size={16} />` work identically against the shared component (same default props: `size=22`, `color="var(--color-primary)"`).

**Copy preservation constraint:** All Indonesian strings in `FITUR_LIST`, `LANGKAH_LIST`, `STATISTIK_LIST`, `FAQ_LIST`, `TESTIMONIAL_CHIPS`, hero headline/subtext, and footer text must carry over unchanged — only the rendering wrapper (`LandingButton` → `Tombol`, bespoke `<div>` → `Card`) changes.

---

### `src/pages/Login.jsx` (component, request-response)

**Analog:** `src/pages/Register.jsx` (sibling page, identical shell pattern) + `src/components/auth/AuthShared.jsx` (already-shared pieces)

**1. Already-correct imports to keep unchanged** (`src/pages/Login.jsx:1-14`):
```javascript
import { useState } from "react";
import store from "../store";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import IkonDaun from "../components/IkonDaun";
import {
  ErrorText,
  FieldIcon,
  IkonMata,
  IkonOrang,
  RolePills,
  TombolClose,
  fieldLabelStyle,
  inputBaseStyle,
} from "../components/auth/AuthShared";
```
This import block is the gold-standard pattern — Register.jsx uses the identical shape. No change needed here; `IkonDaun` is already correctly imported from the shared component (Login/Register never had the duplication problem Landing has).

**2. Submit button — current bespoke pattern to replace** (`src/pages/Login.jsx:306-309`):
```javascript
<button type="submit" className="auth-submit-btn" onMouseDown={submitRipple.onMouseDown}>
  Masuk
  <RippleSpans ripples={submitRipple.ripples} removeRipple={submitRipple.removeRipple} />
</button>
```
Per UI-SPEC Risk 4 recommendation, replace with `Tombol` (add `import Tombol from "../components/Tombol";`):
```javascript
<Tombol type="submit" label="Masuk" variant="primer" style={{ width: "100%" }} />
```
Note: `Tombol` already handles its own ripple internally (`useRipple` baked into `Tombol.jsx:4`) — the manual `submitRipple` hook and `RippleSpans` become unnecessary once migrated, removing duplicate ripple-state bookkeeping.

**3. Link button — current bespoke pattern**, less critical to migrate per UI-SPEC (no shared component named for this), but the existing app convention for inline text-link buttons elsewhere is `link-underline-hover` class (e.g. `RiwayatAktivitas.jsx`) — UI-SPEC defers this as a discretionary choice, not a hard requirement.

**4. Error/validation rendering — already correct, do not touch logic, only confirm rendering surface uses `ErrorText`** (`src/pages/Login.jsx:215,239,266`):
```javascript
<ErrorText>{errors.role}</ErrorText>
...
<ErrorText>{errors.username}</ErrorText>
...
<ErrorText>{errors.password}</ErrorText>
```
This is already the correct shared pattern — no change required.

**5. `RolePills` usage — already correct** (`src/pages/Login.jsx:208-214`):
```javascript
<RolePills
  selectedRole={role}
  onSelectRole={(nextRole) => {
    setRole(nextRole);
    setErrors((previous) => ({ ...previous, role: undefined }));
  }}
/>
```
No change required — already shared via `AuthShared.jsx`.

---

### `src/pages/Register.jsx` (component, request-response)

**Analog:** `src/pages/Login.jsx` (identical shell, same imports, same `AuthShared.jsx` consumption — see above for the full pattern). Apply the identical `Tombol`-for-submit-button migration to Register's `auth-submit-btn` usage. Preserve "Akun berhasil dibuat. Silakan masuk." success-state copy and 2s auto-redirect-to-Login behavior exactly; only the submit/link button rendering surface changes.

---

## Shared Patterns

### `Tombol` usage convention (apply to Landing, Login, Register)
**Source:** `src/components/Tombol.jsx` (component itself — DO NOT MODIFY) + usage examples in `src/pages/Dashboard.jsx:1098-1102, 1347-1356`
```javascript
import Tombol from "../components/Tombol";
// ...
<Tombol
  label={"text" /* or a JSX node combining icon + text */}
  variant="primer" /* default | "sekunder" | "bahaya" */
  onClick={handler}
  type="button" /* or "submit" */
  style={{ /* width/padding/fontSize overrides only — no new props exist */ }}
/>
```
`Tombol` has exactly 5 props: `label`, `variant`, `onClick`, `type`, `disabled`, `style`. There is no `size` or `iconRight` prop — express both through `label` (compose icon + text inside) and `style` (padding/fontSize).

### `Card` usage convention (apply to Landing only — Login/Register use the bespoke glass-morphism overlay, not `Card`)
**Source:** `src/components/Card.jsx` (component itself — DO NOT MODIFY) + usage in `src/pages/Dashboard.jsx:172,390,492,695,958,1012,1272,1331`
```javascript
import Card from "../components/Card";
// ...
<Card style={{ /* additive overrides: minHeight, custom border, custom boxShadow, custom padding */ }}>
  {children}
</Card>
```
`Card` already merges any `style` object passed in on top of its defaults (`backgroundColor`, `borderRadius: var(--radius-lg)`, `padding: var(--space-6)`, optional `accent` top-border, `animation: fadeInUp`). Landing's bespoke 28px padding / `border-mid` / large boxShadow values should be passed via `style`, not via new `Card` props.

### `IkonDaun` shared import (apply to Landing — delete local duplicate; Login/Register already correct)
**Source:** `src/components/IkonDaun.jsx` (component itself — DO NOT MODIFY) + import usage in `src/pages/Login.jsx:4`, `src/pages/Register.jsx:4`
```javascript
import IkonDaun from "../components/IkonDaun";
```

### `AuthShared.jsx` pieces (apply to Login/Register only — already in use, do not regress)
**Source:** `src/components/auth/AuthShared.jsx` (component itself — DO NOT MODIFY)
```javascript
import {
  ErrorText,
  FieldIcon,
  IkonMata,
  IkonOrang,
  RolePills,
  TombolClose,
  fieldLabelStyle,
  inputBaseStyle,
} from "../components/auth/AuthShared";
```
All of these are already correctly consumed by both Login and Register — no migration needed, just preserve existing usage exactly while swapping the submit button to `Tombol`.

---

## No Analog Found

None — all three modified files have direct, exact-match or role-match analogs already in the codebase (`Dashboard.jsx` for Tombol/Card conventions, `Login.jsx`/`Register.jsx` cross-referencing each other, `AuthShared.jsx` for shared auth pieces).

---

## DESIGN-04 Regression Check (mandatory per UI-SPEC)

Per UI-SPEC's "Mandatory plan-phase instruction": since `Tombol` and `Card` are consumed as-is (zero edits to `Tombol.jsx`/`Card.jsx`/their `.tombol-*`/`.app-card` CSS classes), regression risk to other consumers is None. The PLAN.md verification step must still include an explicit task: "visually spot-check `Dashboard.jsx`, `ManajemenKota.jsx`, and one other `Tombol`/`Card`-consuming page after the Landing/Login/Register changes" — this is a process check, not expected to surface any actual diff, since no shared component file changes.

If the optional `Modal.jsx` additive-prop path is taken for Login/Register's overlay shell (UI-SPEC Risk 4, lowest priority, not required), flag that specific change separately — it is the only path in this phase that touches a shared component file (`src/components/Modal.jsx`), and even then only via a new optional prop defaulting to current behavior.

## Metadata

**Analog search scope:** `src/pages/`, `src/components/`, `src/components/auth/`
**Files scanned:** `Landing.jsx`, `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `Tombol.jsx`, `Card.jsx`, `IkonDaun.jsx`, `AuthShared.jsx`
**Pattern extraction date:** 2026-06-24
