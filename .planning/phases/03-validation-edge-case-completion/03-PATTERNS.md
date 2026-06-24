# Phase 3: Validation & Edge-Case Completion - Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 4 (modified)
**Analogs found:** 3 / 4

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/pages/Login.jsx` | page | request-response (auth) | `src/pages/InputData.jsx` | pattern-match (validation/error rendering) |
| `src/pages/StatusDistribusi.jsx` | page | request-response (modal form) | `src/pages/InputData.jsx` | pattern-match (validation/error rendering) |
| `src/pages/InputData.jsx` | page | request-response (form) | self (existing pattern) | exact (enhance existing) |
| `src/pages/Register.jsx` | page | request-response (auth) | `src/store.js` | pattern-match (getNextId convention) |

---

## Pattern Assignments

### `src/pages/Login.jsx` (page, request-response auth)

**Primary Analog:** `src/pages/InputData.jsx`

**Requirement:** Replace single generic error message with field-level inline errors matching InputData's pattern.

**Error rendering pattern** (`src/pages/InputData.jsx` lines 228-233):
```javascript
const errorStyle = {
  margin: "6px 0 0",
  color: "var(--color-danger)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};

// In JSX:
{errors.fieldName ? <p style={errorStyle}>{errors.fieldName}</p> : null}
```

**Current state** (`src/pages/Login.jsx` lines 23-45):
```javascript
const [error, setError] = useState("");

const handleSubmit = (event) => {
  event.preventDefault();

  if (!username.trim() || !password.trim() || !role) {
    setError("Harap isi semua field.");
    return;
  }

  const akun = store.cariAkun(username, password, role);

  if (!akun) {
    setError("Username, password, atau role tidak sesuai.");
    return;
  }
  // ...
};
```

**Validation function pattern** (replaces generic error):
- Split `error` state into `errors` object: `{ username?: string, password?: string, role?: string }`
- Create `validate()` function returning error object (empty = valid)
- Clear errors on field change (`lines 189-190, 211-212` already do `setError("")`)
- Re-validate on form submission before calling `store.cariAkun()`
- Specific error messages per field per validation rule:
  - `username`: "Username wajib diisi." (blank) or "Username tidak ditemukan." (auth fail)
  - `password`: "Password wajib diisi." (blank) or "Password salah untuk akun ini." (auth fail)
  - `role`: "Pilih role terlebih dahulu." (not selected)
  - Generic fallback: "Gagal masuk. Periksa kembali username, password, dan role Anda."

**Error rendering location** (replaces current `ErrorText` at line 227):
```javascript
// Below username field (line 198, after input span closes):
{errors.username ? <p style={errorStyle}>{errors.username}</p> : null}

// Below password field (line 225, after input span closes):
{errors.password ? <p style={errorStyle}>{errors.password}</p> : null}

// Below role selection (after RolePills component):
{errors.role ? <p style={errorStyle}>{errors.role}</p> : null}
```

**Clear-on-change pattern** (already exists):
- `onChange` handlers at lines 189-190 (username) and 211-212 (password) already clear error
- Extend to role selection: `onSelectRole={() => { setRole(role); setErrors({}); }}`

---

### `src/pages/StatusDistribusi.jsx` (page, request-response modal)

**Primary Analog:** `src/pages/InputData.jsx`

**Requirement:** Validate armada and ETA fields are not blank when status is "dalam-pengiriman", show inline errors.

**Error rendering pattern** (same as InputData):
```javascript
const errorStyle = {
  margin: "6px 0 0",
  color: "var(--color-danger)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};
```

**Current state** (`src/pages/StatusDistribusi.jsx` lines 73-86):
```javascript
const saveStatus = () => {
  if (!selectedKeputusan) {
    return;
  }

  const updates = { status: selectedStatus };
  if (selectedStatus === "dalam-pengiriman") {
    updates.armada = armada.trim();
    updates.eta = eta;
  }

  store.updateKeputusan(selectedKeputusan.id, updates);
  setSelectedKeputusan(null);
};
```

**Validation function pattern** (new):
```javascript
// Add state at line 28:
const [modalErrors, setModalErrors] = useState({});

// Create validation function:
const validateModalForm = () => {
  const nextErrors = {};
  if (selectedStatus === "dalam-pengiriman") {
    if (!armada.trim()) {
      nextErrors.armada = "Armada / Sopir wajib diisi saat status Dalam Pengiriman.";
    }
    if (!eta) {
      nextErrors.eta = "Estimasi Tiba (ETA) wajib dipilih saat status Dalam Pengiriman.";
    }
  }
  return nextErrors;
};

// Modify saveStatus():
const saveStatus = () => {
  if (!selectedKeputusan) {
    return;
  }

  const nextErrors = validateModalForm();
  setModalErrors(nextErrors);

  if (Object.keys(nextErrors).length > 0) {
    return; // Prevent save, display errors
  }

  const updates = { status: selectedStatus };
  if (selectedStatus === "dalam-pengiriman") {
    updates.armada = armada.trim();
    updates.eta = eta;
  }

  store.updateKeputusan(selectedKeputusan.id, updates);
  setModalErrors({});
  setSelectedKeputusan(null);
};
```

**Clear-on-change pattern** (in modal):
```javascript
// On armada field onChange (line 219):
onChange={(event) => {
  setArmada(event.target.value);
  setModalErrors({ ...modalErrors, armada: undefined });
}}

// On ETA field onChange (line 242):
onChange={(event) => {
  setEta(event.target.value);
  setModalErrors({ ...modalErrors, eta: undefined });
}}

// On status change (line 186):
onChange={(event) => {
  setSelectedStatus(event.target.value);
  setModalErrors({}); // Clear all errors when status changes
}}
```

**Error rendering locations** (in modal konten, lines 210-258):
```javascript
// After armada input (insert before ETA label):
{modalErrors.armada ? <p style={errorStyle}>{modalErrors.armada}</p> : null}

// After ETA input (before closing div):
{modalErrors.eta ? <p style={errorStyle}>{modalErrors.eta}</p> : null}
```

**Button state:** "Simpan Status" button remains enabled during validation (no disabled state required).

---

### `src/pages/InputData.jsx` (page, request-response form)

**Status:** Enhanced existing pattern (add empty-city-list guard).

**Requirement:** Show explanatory message when `daftarKota` is empty; prevent form submission if no cities exist.

**Current empty-state handling** (lines 49-81):
```javascript
const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

const validate = (nextForm) => {
  const nextErrors = {};

  if (!nextForm.kota) {
    nextErrors.kota = "Nama kota wajib dipilih.";
  }
  // ...
};
```

**Enhancement pattern** (new):
```javascript
// Add empty-state message rendering (after select dropdown, line 282):
{daftarKota.length === 0 ? (
  <p style={{
    color: "var(--color-text-muted)",
    fontSize: "var(--text-sm)",
  }}>
    Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu.
  </p>
) : null}

// Modify validate() to check empty list:
const validate = (nextForm) => {
  const nextErrors = {};

  if (daftarKota.length === 0) {
    // Empty list state — prevent submission
    // (no field-level error, rely on empty-state message above)
  } else if (!nextForm.kota) {
    nextErrors.kota = "Pilih kota terlebih dahulu.";
  }
  // ...
};

// Modify handleSubmit() to show toast on empty city list:
const handleSubmit = (event) => {
  event.preventDefault();

  if (daftarKota.length === 0) {
    showToast({ 
      type: "error", 
      message: "Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu." 
    });
    return;
  }

  const nextErrors = validate(form);
  setErrors(nextErrors);

  if (Object.keys(nextErrors).length > 0) {
    return;
  }
  // ... rest of handleSubmit
};
```

---

### `src/pages/Register.jsx` (page, request-response auth)

**Primary Analog:** `src/store.js` `getNextId` function

**Requirement:** Replace `Date.now()` ID generation with `store.getNextId()` convention.

**Current pattern** (`src/pages/Register.jsx` line 99):
```javascript
store.tambahAkun({
  id: `U${Date.now()}`,
  nama: nama.trim(),
  username: username.trim(),
  password,
  role,
});
```

**Target pattern** (`src/store.js` lines 53-61):
```javascript
const getNextId = (items, prefix) => {
  const nextNumber =
    items.reduce((maxValue, item) => {
      const numericId = Number(String(item.id).replace(/\D/g, ""));
      return Number.isNaN(numericId) ? maxValue : Math.max(maxValue, numericId);
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
};
```

**Examples of getNextId usage in store** (`src/store.js`):
- Line 145: `id: notif.id ?? getNextId(state.notifikasi, "NTF")`
- Line 159: `id: getNextId(state.activityLog, "LOG")`
- Line 351: `id: entry.id ?? getNextId(items, "PMT")`
- Line 419: `id: entry.id ?? getNextId(state.riwayatKeputusan, "KPT")`

**Implementation in Register.jsx**:
```javascript
// Replace line 99:
id: store.getNextId(store.getDaftarAkun(), "U"),
```

This ensures all new account IDs follow the convention `U-001`, `U-002`, etc., consistent with other entity IDs in the system.

---

## Shared Patterns

### Field-Level Inline Error Rendering
**Source:** `src/pages/InputData.jsx` (lines 228-233)
**Apply to:** Login.jsx, StatusDistribusi.jsx, InputData.jsx (enhancements)

```javascript
const errorStyle = {
  margin: "6px 0 0",
  color: "var(--color-danger)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};

// Render below each field:
{errors.fieldName ? <p style={errorStyle}>{errors.fieldName}</p> : null}
```

**Key characteristics:**
- Errors stored in object keyed by field name
- Inline `<p>` tag with consistent errorStyle
- Conditional rendering: only show if error exists for that field
- Errors cleared on user change to that field

### Validation Pattern
**Source:** `src/pages/InputData.jsx` (lines 51-81)
**Apply to:** Login.jsx, StatusDistribusi.jsx

```javascript
const validate = (nextForm) => {
  const nextErrors = {};

  // Check each field
  if (!nextForm.kota) {
    nextErrors.kota = "Nama kota wajib dipilih.";
  }

  // Multi-field validation
  if (nextForm.kota && store.hasPermintaanDuplikat({ ... })) {
    nextErrors.tanggalPermintaan = "Data untuk kota ini pada tanggal tersebut sudah ada.";
  }

  return nextErrors;
};
```

**Key characteristics:**
- Returns object (empty = valid form, keys = field names with errors)
- Called on form submission before store mutation
- Called on field change to show/hide errors immediately
- Errors prevent form submission if `Object.keys(nextErrors).length > 0`

### Clear-on-Change Pattern
**Source:** `src/pages/InputData.jsx` (lines 83-91)
**Apply to:** Login.jsx, StatusDistribusi.jsx

```javascript
const handleChange = (field, value) => {
  const nextForm = {
    ...form,
    [field]: value,
  };

  setForm(nextForm);
  setErrors(validate(nextForm)); // Re-validate immediately
};
```

**Key characteristics:**
- On every field change, re-validate entire form
- Errors clear/update immediately as user types
- No debouncing — validation runs on every keystroke

---

## No Analog Found

All required files have analogs or follow existing patterns in the codebase. No files require external reference patterns.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/store.js`, `src/components/auth/`
**Files scanned:** 12 core files
**Pattern extraction date:** 2026-06-24

**Key findings:**
1. **Validation uniformity:** All form validation follows InputData.jsx's error object + validate() + clear-on-change pattern
2. **Error rendering consistency:** All inline errors use same errorStyle (margin 6px, color danger, font 0.85rem)
3. **ID convention:** All generated IDs use `getNextId(items, prefix)` format (`PREFIX-NNN`), except current Register.jsx which uses `Date.now()` — this is the edge case to fix
4. **Modal validation:** StatusDistribusi modal form validation mirrors page form validation, added inline

