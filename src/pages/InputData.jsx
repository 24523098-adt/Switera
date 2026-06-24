import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";
import { parseCsvToObjects } from "../utils/csv";

function IkonCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12.5L11 15.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialForm = {
  kota: "",
  tanggalPermintaan: "",
  jumlahPermintaan: "",
  keterangan: "",
};

function InputData({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState("");
  const [hoveredField, setHoveredField] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

  const validate = (nextForm) => {
    const nextErrors = {};

    if (daftarKota.length > 0 && !nextForm.kota) {
      nextErrors.kota = "Nama kota wajib dipilih.";
    }

    if (!nextForm.tanggalPermintaan) {
      nextErrors.tanggalPermintaan = "Tanggal permintaan wajib diisi.";
    }

    if (!nextForm.jumlahPermintaan) {
      nextErrors.jumlahPermintaan = "Jumlah permintaan wajib diisi.";
    } else if (Number(nextForm.jumlahPermintaan) <= 0) {
      nextErrors.jumlahPermintaan = "Jumlah tidak boleh nol atau negatif.";
    }

    if (
      nextForm.kota &&
      nextForm.tanggalPermintaan &&
      store.hasPermintaanDuplikat({
        kota: nextForm.kota,
        tanggalPermintaan: nextForm.tanggalPermintaan,
      })
    ) {
      nextErrors.tanggalPermintaan =
        "Data untuk kota ini pada tanggal tersebut sudah ada.";
    }

    return nextErrors;
  };

  const handleChange = (field, value) => {
    const nextForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    setErrors(validate(nextForm));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (daftarKota.length === 0) {
      showToast({
        type: "error",
        message: "Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu.",
      });
      return;
    }

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    window.setTimeout(() => {
      store.addPermintaan({
        kota: form.kota,
        tanggal_permintaan: form.tanggalPermintaan,
        tanggal_input: getTodayKey(),
        jumlah_permintaan: Number(form.jumlahPermintaan),
        keterangan: form.keterangan.trim(),
      });

      setForm(initialForm);
      setErrors({});
      setIsSaving(false);
      showToast({ type: "success", message: "Data permintaan berhasil disimpan." });
    }, 800);
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const text = await file.text();
    const rows = parseCsvToObjects(text);
    const namaKotaValid = new Set(daftarKota.map((kota) => kota.nama));

    let berhasil = 0;
    const gagal = [];

    rows.forEach((row, index) => {
      const kota = (row.kota ?? "").trim();
      const tanggalPermintaan = (row.tanggal_permintaan ?? "").trim();
      const jumlahPermintaan = Number(row.jumlah_permintaan);
      const keterangan = (row.keterangan ?? "").trim();
      const baris = index + 2;

      if (!kota || !namaKotaValid.has(kota)) {
        gagal.push(`Baris ${baris}: kota "${kota}" tidak ditemukan di daftar kota.`);
        return;
      }

      if (!tanggalPermintaan || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalPermintaan)) {
        gagal.push(`Baris ${baris}: tanggal_permintaan harus berformat YYYY-MM-DD.`);
        return;
      }

      if (!jumlahPermintaan || jumlahPermintaan <= 0) {
        gagal.push(`Baris ${baris}: jumlah_permintaan harus lebih dari 0.`);
        return;
      }

      if (store.hasPermintaanDuplikat({ kota, tanggalPermintaan })) {
        gagal.push(`Baris ${baris}: data ${kota} pada ${tanggalPermintaan} sudah ada.`);
        return;
      }

      store.addPermintaan({
        kota,
        tanggal_permintaan: tanggalPermintaan,
        tanggal_input: getTodayKey(),
        jumlah_permintaan: jumlahPermintaan,
        keterangan,
      });
      berhasil += 1;
    });

    setImportResult({ berhasil, gagal });

    if (berhasil > 0) {
      showToast({ type: "success", message: `${berhasil} data permintaan berhasil diimpor.` });
    }
  };

  const fieldBaseStyle = {
    width: "100%",
    border: "1px solid var(--color-border-mid)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-surface-2)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    transition:
      "border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)",
  };

  const getFieldStyle = (field) => {
    const isFocused = focusedField === field;
    const isHovered = hoveredField === field && !isFocused;

    return {
      ...fieldBaseStyle,
      backgroundColor: isHovered ? "var(--color-surface-3)" : "var(--color-surface-2)",
      borderColor: isFocused
        ? "var(--color-primary)"
        : isHovered
          ? "var(--color-border-strong)"
          : "var(--color-border-mid)",
      boxShadow: isFocused ? "0 0 0 3px var(--color-primary-glow)" : "none",
    };
  };

  const getFieldHandlers = (field) => ({
    onFocus: () => setFocusedField(field),
    onBlur: () => setFocusedField(""),
    onMouseEnter: () => setHoveredField(field),
    onMouseLeave: () => setHoveredField(""),
  });

  const labelStyle = {
    display: "block",
    marginBottom: "var(--space-2)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
  };

  const errorStyle = {
    margin: "6px 0 0",
    color: "var(--color-danger)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  };

  return (
    <>
      <PageHeader
        judul="Input Data Permintaan Kota"
        deskripsi="Isi permintaan TBS per kota sebagai dasar ranking dan keputusan distribusi."
      />
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <Card
          style={{
            border: "1px solid var(--color-border-mid)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8)",
            boxShadow: "var(--shadow-md), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              className="app-grid-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div>
                <label htmlFor="input-kota" style={labelStyle}>Nama Kota</label>
                {daftarKota.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                    Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu.
                  </p>
                ) : (
                  <select id="input-kota"
                    className="field-select"
                    value={form.kota}
                    onChange={(event) => handleChange("kota", event.target.value)}
                    style={getFieldStyle("kota")}
                    {...getFieldHandlers("kota")}
                  >
                    <option value="">⚑ Pilih kota</option>
                    {daftarKota.map((kota) => (
                      <option key={kota.nama} value={kota.nama}>
                        ⚑ {kota.nama}
                      </option>
                    ))}
                  </select>
                )}
                {errors.kota ? <p style={errorStyle}>{errors.kota}</p> : null}
              </div>

              <div>
                <label htmlFor="input-tanggal-permintaan" style={labelStyle}>Tanggal Permintaan</label>
                <input
                  id="input-tanggal-permintaan"
                  type="date"
                  value={form.tanggalPermintaan}
                  onChange={(event) =>
                    handleChange("tanggalPermintaan", event.target.value)
                  }
                  style={getFieldStyle("tanggalPermintaan")}
                  {...getFieldHandlers("tanggalPermintaan")}
                />
                {errors.tanggalPermintaan ? (
                  <p style={errorStyle}>{errors.tanggalPermintaan}</p>
                ) : null}
              </div>
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <label htmlFor="input-jumlah-permintaan" style={labelStyle}>Jumlah Permintaan dalam ton</label>
              <input
                id="input-jumlah-permintaan"
                type="number"
                className="field-no-spinner"
                min="1"
                step="1"
                value={form.jumlahPermintaan}
                onChange={(event) =>
                  handleChange("jumlahPermintaan", event.target.value)
                }
                style={getFieldStyle("jumlahPermintaan")}
                {...getFieldHandlers("jumlahPermintaan")}
              />
              {errors.jumlahPermintaan ? (
                <p style={errorStyle}>{errors.jumlahPermintaan}</p>
              ) : null}
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <label htmlFor="input-keterangan" style={labelStyle}>Keterangan</label>
              <textarea
                id="input-keterangan"
                rows="5"
                value={form.keterangan}
                onChange={(event) => handleChange("keterangan", event.target.value)}
                placeholder="Tambahkan catatan jika diperlukan."
                style={{
                  ...getFieldStyle("keterangan"),
                  minHeight: "120px",
                  resize: "vertical",
                  lineHeight: "var(--leading-loose)",
                }}
                {...getFieldHandlers("keterangan")}
              />
              {errors.keterangan ? (
                <p style={errorStyle}>{errors.keterangan}</p>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
              }}
            >
              <Tombol
                type="submit"
                disabled={isSaving}
                style={{ padding: "10px 28px" }}
                label={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    {isSaving ? <span className="spinner" /> : <IkonCheck />}
                    {isSaving ? "Menyimpan..." : "Simpan Data"}
                  </span>
                }
              />
            </div>
          </form>
        </Card>

        <Card style={{ marginTop: "var(--space-6)" }}>
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Impor Data Massal (CSV)
          </p>
          <p style={{ margin: "0 0 1rem", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
            Unggah file CSV dengan kolom <code>kota,tanggal_permintaan,jumlah_permintaan,keterangan</code>{" "}
            (format tanggal YYYY-MM-DD) untuk menambahkan banyak data permintaan sekaligus.
          </p>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "1px solid var(--color-border-mid)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-surface-2)",
              color: "var(--color-text-primary)",
              fontSize: "var(--text-sm)",
              padding: "9px 16px",
              cursor: "pointer",
            }}
          >
            Pilih File CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImportCsv} style={{ display: "none" }} />
          </label>

          {importResult ? (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ margin: 0, color: "var(--color-success)", fontSize: "var(--text-sm)" }}>
                {importResult.berhasil} data berhasil diimpor.
              </p>
              {importResult.gagal.length > 0 ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ margin: "0 0 4px", color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                    {importResult.gagal.length} baris gagal diimpor:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", lineHeight: 1.6 }}>
                    {importResult.gagal.map((pesan) => (
                      <li key={pesan}>{pesan}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}

export default InputData;
