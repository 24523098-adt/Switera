import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";
import { parseCsvToObjects } from "../utils/csv";

// Ikon Material Symbols (kelas dasar di tokens.css).
function Ikon({ name, size = 20, fill = false, style }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

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

// Field yang divalidasi per langkah stepper.
const STEP_FIELDS = {
  1: ["kota"],
  2: ["tanggalPermintaan", "jumlahPermintaan", "keterangan"],
};

const STEPS = [
  { nomor: 1, label: "Pilih Kota" },
  { nomor: 2, label: "Detail Permintaan" },
  { nomor: 3, label: "Konfirmasi" },
];

const formatterTanggal = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

function InputData({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState("");
  const [hoveredField, setHoveredField] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    store.loadPermintaan();
    store.loadKota();
  }, []);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

  const validate = async (nextForm) => {
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
      (await store.hasPermintaanDuplikat({
        kota: nextForm.kota,
        tanggalPermintaan: nextForm.tanggalPermintaan,
      }))
    ) {
      nextErrors.tanggalPermintaan =
        "Data untuk kota ini pada tanggal tersebut sudah ada.";
    }

    return nextErrors;
  };

  const handleChange = async (field, value) => {
    const nextForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    setErrors(await validate(nextForm));
  };

  // Maju ke langkah berikutnya bila field langkah aktif valid.
  const goNext = async () => {
    if (step === 1 && daftarKota.length === 0) {
      showToast({
        type: "error",
        message: "Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu.",
      });
      return;
    }

    const allErrors = await validate(form);
    const stepFields = STEP_FIELDS[step] ?? [];
    const stepErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => stepFields.includes(field))
    );

    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0) {
      setStep((value) => Math.min(3, value + 1));
    }
  };

  const goBack = () => setStep((value) => Math.max(1, value - 1));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (daftarKota.length === 0) {
      showToast({
        type: "error",
        message: "Belum ada kota yang dikonfigurasi. Hubungi Admin untuk menambahkan kota terlebih dahulu.",
      });
      return;
    }

    const nextErrors = await validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // Kembali ke langkah pertama yang bermasalah agar error terlihat.
      setStep(nextErrors.kota ? 1 : 2);
      return;
    }

    setIsSaving(true);

    try {
      await store.addPermintaan({
        kota: form.kota,
        tanggal_permintaan: form.tanggalPermintaan,
        tanggal_input: getTodayKey(),
        jumlah_permintaan: Number(form.jumlahPermintaan),
        keterangan: form.keterangan.trim(),
      });

      setForm(initialForm);
      setErrors({});
      setStep(1);
      showToast({ type: "success", message: "Data permintaan berhasil disimpan." });
    } catch (error) {
      if (error.fields?.jumlah_permintaan) {
        setErrors({ jumlahPermintaan: error.fields.jumlah_permintaan });
        setStep(2);
      } else if (error.fields?.tanggal_permintaan) {
        setErrors({ tanggalPermintaan: error.fields.tanggal_permintaan });
        setStep(2);
      } else if (error.fields?.kota) {
        setErrors({ kota: error.fields.kota });
        setStep(1);
      }
    } finally {
      setIsSaving(false);
    }
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

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const kota = (row.kota ?? "").trim();
      const tanggalPermintaan = (row.tanggal_permintaan ?? "").trim();
      const jumlahPermintaan = Number(row.jumlah_permintaan);
      const keterangan = (row.keterangan ?? "").trim();
      const baris = index + 2;

      if (!kota || !namaKotaValid.has(kota)) {
        gagal.push(`Baris ${baris}: kota "${kota}" tidak ditemukan di daftar kota.`);
        continue;
      }

      if (!tanggalPermintaan || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalPermintaan)) {
        gagal.push(`Baris ${baris}: tanggal_permintaan harus berformat YYYY-MM-DD.`);
        continue;
      }

      if (!jumlahPermintaan || jumlahPermintaan <= 0) {
        gagal.push(`Baris ${baris}: jumlah_permintaan harus lebih dari 0.`);
        continue;
      }

      if (await store.hasPermintaanDuplikat({ kota, tanggalPermintaan })) {
        gagal.push(`Baris ${baris}: data ${kota} pada ${tanggalPermintaan} sudah ada.`);
        continue;
      }

      try {
        await store.addPermintaan({
          kota,
          tanggal_permintaan: tanggalPermintaan,
          tanggal_input: getTodayKey(),
          jumlah_permintaan: jumlahPermintaan,
          keterangan,
        });
        berhasil += 1;
      } catch (error) {
        gagal.push(`Baris ${baris}: ${error.message}`);
      }
    }

    setImportResult({ berhasil, gagal });

    if (berhasil > 0) {
      showToast({ type: "success", message: `${berhasil} data permintaan berhasil diimpor.` });
    }
  };

  const fieldBaseStyle = {
    width: "100%",
    border: "2px solid #000000",
    borderRadius: "var(--radius-lg)",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-on-surface)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    padding: "12px 16px",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "var(--shadow-sm)",
    transition:
      "border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)",
  };

  const getFieldStyle = (field) => {
    const isFocused = focusedField === field;
    const isHovered = hoveredField === field && !isFocused;

    return {
      ...fieldBaseStyle,
      backgroundColor: isHovered ? "var(--color-surface-container-low)" : "var(--color-surface)",
      borderColor: errors[field]
        ? "var(--color-error)"
        : isFocused
          ? "var(--color-primary)"
          : isHovered
            ? "var(--color-border-strong)"
            : "var(--color-border)",
      boxShadow: errors[field] ? "none" : isFocused ? "var(--shadow-focus)" : "none",
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
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-on-surface)",
  };

  const errorStyle = {
    margin: "6px 0 0",
    color: "var(--color-error)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  };

  const summaryLabelStyle = {
    fontSize: "var(--text-2xs)",
    color: "var(--color-on-surface-variant)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
  };

  const summaryValueStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "var(--text-sm)",
    color: "var(--color-on-surface)",
    marginTop: "4px",
  };

  const belumDiisi = <span style={{ color: "var(--color-text-disabled)", fontStyle: "italic" }}>Belum diisi</span>;

  // Konteks bisnis kota terpilih: kapasitas, sisa kapasitas, rata-rata historis
  // 30 hari, serta peringatan bila permintaan melebihi kapasitas atau melonjak
  // lebih dari 50 persen di atas rata-rata. Menjadikan input data pendukung
  // keputusan (MIS), bukan sekadar pencatatan (TPS).
  const konteksKota = useMemo(() => {
    const kotaObj = daftarKota.find((item) => item.nama === form.kota);
    if (!kotaObj) {
      return null;
    }
    const kapasitas = Number(kotaObj.kapasitas) || 0;
    const semua = (snapshot.permintaan ?? []).filter((item) => item.kota === form.kota);
    const batas30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const in30 = semua.filter(
      (item) => item.tanggal_permintaan && new Date(`${item.tanggal_permintaan}T00:00:00`).getTime() >= batas30
    );
    const basis = in30.length > 0 ? in30 : semua;
    const rataHistoris = basis.length > 0
      ? basis.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0) / basis.length
      : 0;
    const totalKota = semua.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0);
    const jumlah = Number(form.jumlahPermintaan) || 0;
    return {
      kapasitas,
      sisaKapasitas: kapasitas - totalKota,
      rataHistoris: Math.round(rataHistoris * 10) / 10,
      jumlahData: basis.length,
      melebihiKapasitas: jumlah > 0 && jumlah > kapasitas,
      lonjakan: jumlah > 0 && rataHistoris > 0 && jumlah > rataHistoris * 1.5,
    };
  }, [daftarKota, form.kota, form.jumlahPermintaan, snapshot.permintaan]);

  return (
    <>
      <PageHeader
        judul="Input Data Permintaan Kota"
        deskripsi="Isi permintaan TBS per kota sebagai dasar ranking dan keputusan distribusi."
      />
      <div
        className="app-grid-2-1"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "var(--space-6)",
          alignItems: "start",
        }}
      >
        {/* ===== Kiri: stepper + form ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", minWidth: 0 }}>
          {/* Stepper */}
          <Card style={{ padding: "var(--space-6) var(--space-8)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
              {/* Garis latar */}
              <span aria-hidden="true" style={{ position: "absolute", top: "20px", left: "40px", right: "40px", height: "3px", backgroundColor: "var(--color-surface-container)", zIndex: 0 }} />
              {/* Garis progres */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "40px",
                  width: `calc((100% - 80px) * ${(step - 1) / (STEPS.length - 1)})`,
                  height: "3px",
                  backgroundColor: "var(--color-primary)",
                  zIndex: 0,
                  transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
              {STEPS.map((item) => {
                const selesai = step > item.nomor;
                const aktif = step === item.nomor;

                return (
                  <div key={item.nomor} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", backgroundColor: "var(--color-surface)", padding: "0 8px" }}>
                    <span
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-full)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-heading)",
                        fontWeight: "var(--font-weight-bold)",
                        fontSize: "var(--text-sm)",
                        backgroundColor: selesai || aktif ? "var(--color-lime)" : "var(--color-surface)",
                        color: "#000000",
                        border: "2px solid #000000",
                        boxShadow: aktif ? "var(--shadow-md)" : "var(--shadow-sm)",
                        transition: "background-color var(--transition-base), box-shadow var(--transition-base)",
                      }}
                    >
                      {selesai ? <Ikon name="check" size={20} /> : item.nomor}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: aktif ? "var(--font-weight-bold)" : "var(--font-weight-medium)",
                        color: selesai || aktif ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Kartu form per langkah */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", gap: "10px" }}>
                <Ikon name={step === 1 ? "location_city" : step === 2 ? "assignment" : "fact_check"} size={22} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                  {step === 1 ? "Pilih Kota Tujuan" : step === 2 ? "Lengkapi Detail Permintaan" : "Konfirmasi Data"}
                </h3>
              </div>

              <div key={step} className="animate-fade-in" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {step === 1 ? (
                  <div>
                    <label htmlFor="input-kota" style={labelStyle}>Nama Kota</label>
                    {daftarKota.length === 0 ? (
                      <p style={{ margin: 0, color: "var(--color-on-surface-variant)", fontSize: "var(--text-sm)" }}>
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
                        <option value="">Pilih kota</option>
                        {daftarKota.map((kota) => (
                          <option key={kota.nama} value={kota.nama}>
                            {kota.nama}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.kota ? <p style={errorStyle}>{errors.kota}</p> : null}
                  </div>
                ) : null}

                {step === 2 ? (
                  <>
                    <div>
                      <label htmlFor="input-tanggal-permintaan" style={labelStyle}>Tanggal Permintaan</label>
                      <input
                        id="input-tanggal-permintaan"
                        type="date"
                        value={form.tanggalPermintaan}
                        onChange={(event) => handleChange("tanggalPermintaan", event.target.value)}
                        style={{ ...getFieldStyle("tanggalPermintaan"), maxWidth: "320px" }}
                        {...getFieldHandlers("tanggalPermintaan")}
                      />
                      {errors.tanggalPermintaan ? <p style={errorStyle}>{errors.tanggalPermintaan}</p> : null}
                    </div>

                    <div>
                      <label htmlFor="input-jumlah-permintaan" style={labelStyle}>Jumlah Permintaan (Ton)</label>
                      <div style={{ position: "relative", maxWidth: "320px" }}>
                        <input
                          id="input-jumlah-permintaan"
                          type="number"
                          className="field-no-spinner"
                          min="1"
                          step="1"
                          value={form.jumlahPermintaan}
                          onChange={(event) => handleChange("jumlahPermintaan", event.target.value)}
                          style={{ ...getFieldStyle("jumlahPermintaan"), paddingRight: "64px" }}
                          {...getFieldHandlers("jumlahPermintaan")}
                        />
                        <span
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            padding: "0 16px",
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "var(--color-pastel)",
                            borderLeft: "2px solid #000000",
                            borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--color-on-surface-variant)",
                            pointerEvents: "none",
                          }}
                        >
                          Ton
                        </span>
                      </div>
                      {errors.jumlahPermintaan ? <p style={errorStyle}>{errors.jumlahPermintaan}</p> : null}
                    </div>

                    <div>
                      <label htmlFor="input-keterangan" style={labelStyle}>Keterangan</label>
                      <textarea
                        id="input-keterangan"
                        rows="4"
                        value={form.keterangan}
                        onChange={(event) => handleChange("keterangan", event.target.value)}
                        placeholder="Tambahkan catatan jika diperlukan."
                        style={{
                          ...getFieldStyle("keterangan"),
                          minHeight: "100px",
                          resize: "vertical",
                          lineHeight: "var(--leading-loose)",
                        }}
                        {...getFieldHandlers("keterangan")}
                      />
                      {errors.keterangan ? <p style={errorStyle}>{errors.keterangan}</p> : null}
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
                      Periksa kembali data berikut sebelum disimpan.
                    </p>
                    {[
                      { label: "Kota Tujuan", nilai: form.kota, ikon: "location_on" },
                      { label: "Tanggal Permintaan", nilai: form.tanggalPermintaan ? formatterTanggal.format(new Date(`${form.tanggalPermintaan}T00:00:00`)) : "", ikon: "event" },
                      { label: "Jumlah Permintaan", nilai: form.jumlahPermintaan ? `${form.jumlahPermintaan} ton` : "", ikon: "scale" },
                      { label: "Keterangan", nilai: form.keterangan.trim() || "—", ikon: "notes" },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "12px 16px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container-low)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)" }}>
                          <Ikon name={row.ikon} size={18} style={{ color: "var(--color-primary)" }} />
                          {row.label}
                        </span>
                        <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface)", textAlign: "right" }}>{row.nilai}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Aksi kartu */}
              <div style={{ padding: "var(--space-5) var(--space-6)", backgroundColor: "var(--color-surface-container-low)", borderTop: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <Tombol
                  type="button"
                  variant="sekunder"
                  label="Kembali"
                  onClick={goBack}
                  disabled={step === 1}
                  style={step === 1 ? { visibility: "hidden" } : undefined}
                />
                {step < 3 ? (
                  <Tombol
                    type="button"
                    label={
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        Lanjut
                        <Ikon name="arrow_forward" size={18} />
                      </span>
                    }
                    onClick={goNext}
                  />
                ) : (
                  <Tombol
                    type="submit"
                    isLoading={isSaving}
                    style={{ padding: "10px 28px" }}
                    label={
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {!isSaving ? <IkonCheck /> : null}
                        {isSaving ? "Menyimpan..." : "Simpan Data"}
                      </span>
                    }
                  />
                )}
              </div>
            </form>
          </Card>

          {/* Impor CSV */}
          <Card style={{ animationDelay: "60ms" }}>
            <p
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-md)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-on-surface)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Ikon name="upload_file" size={20} style={{ color: "var(--color-secondary)" }} />
              Impor Data Massal (CSV)
            </p>
            <p style={{ margin: "0 0 1rem", color: "var(--color-on-surface-variant)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
              Unggah file CSV dengan kolom <code>kota,tanggal_permintaan,jumlah_permintaan,keterangan</code>{" "}
              (format tanggal YYYY-MM-DD) untuk menambahkan banyak data permintaan sekaligus.
            </p>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "2px solid #000000",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-surface)",
                color: "#000000",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-bold)",
                padding: "10px 20px",
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "background-color var(--transition-fast)",
              }}
            >
              <Ikon name="attach_file" size={18} />
              Pilih File CSV
              <input type="file" accept=".csv,text/csv" onChange={handleImportCsv} style={{ display: "none" }} />
            </label>

            {importResult ? (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ margin: 0, color: "var(--color-success-text)", fontSize: "var(--text-sm)" }}>
                  {importResult.berhasil} data berhasil diimpor.
                </p>
                {importResult.gagal.length > 0 ? (
                  <div style={{ marginTop: "0.5rem" }}>
                    <p style={{ margin: "0 0 4px", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
                      {importResult.gagal.length} baris gagal diimpor:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--color-on-surface-variant)", fontSize: "var(--text-xs)", lineHeight: 1.6 }}>
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

        {/* ===== Kanan: ringkasan sticky ===== */}
        <div style={{ position: "sticky", top: "88px" }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div aria-hidden="true" style={{ height: "8px", width: "100%", backgroundColor: "var(--color-secondary-container)" }} />
            <div style={{ padding: "var(--space-6)" }}>
              <h3 style={{ margin: "0 0 var(--space-5)", fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Ikon name="summarize" size={20} style={{ color: "var(--color-secondary)" }} />
                Ringkasan Permintaan
              </h3>

              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <li style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "12px" }}>
                  <span style={summaryLabelStyle}>Kota Tujuan</span>
                  <div style={summaryValueStyle}>
                    <Ikon name="location_on" size={18} style={{ color: "var(--color-primary)" }} />
                    {form.kota ? <strong>{form.kota}</strong> : belumDiisi}
                  </div>
                </li>
                <li style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "12px" }}>
                  <span style={summaryLabelStyle}>Tanggal Permintaan</span>
                  <div style={summaryValueStyle}>
                    <Ikon name="event" size={18} style={{ color: "var(--color-outline)" }} />
                    {form.tanggalPermintaan
                      ? formatterTanggal.format(new Date(`${form.tanggalPermintaan}T00:00:00`))
                      : belumDiisi}
                  </div>
                </li>
                <li>
                  <span style={summaryLabelStyle}>Jumlah Pasokan</span>
                  <div style={summaryValueStyle}>
                    <Ikon name="scale" size={18} style={{ color: "var(--color-outline)" }} />
                    {form.jumlahPermintaan ? `${form.jumlahPermintaan} ton` : belumDiisi}
                  </div>
                </li>
              </ul>

              {konteksKota ? (
                <div style={{ marginTop: "var(--space-5)", border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-4)", backgroundColor: "var(--color-pastel-card)" }}>
                  <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-muted)" }}>
                    Konteks Kota {form.kota}
                  </p>
                  {[
                    { label: "Kapasitas kota", nilai: `${konteksKota.kapasitas} ton` },
                    { label: "Sisa kapasitas", nilai: `${konteksKota.sisaKapasitas} ton`, warna: konteksKota.sisaKapasitas < 0 ? "var(--color-danger-text)" : undefined },
                    { label: `Rata-rata (${konteksKota.jumlahData} data)`, nilai: `${konteksKota.rataHistoris} ton` },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{row.label}</span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: row.warna ?? "var(--color-on-surface)" }}>{row.nilai}</span>
                    </div>
                  ))}
                  {konteksKota.melebihiKapasitas ? (
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "flex-start", border: "2px solid #000000", borderLeft: "6px solid var(--color-danger)", borderRadius: "var(--radius-md)", padding: "8px 10px", backgroundColor: "var(--color-danger-bg)" }}>
                      <Ikon name="error" size={16} style={{ color: "#000000", marginTop: "1px" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                        Permintaan melebihi kapasitas kota ({konteksKota.kapasitas} ton).
                      </span>
                    </div>
                  ) : null}
                  {konteksKota.lonjakan ? (
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "flex-start", border: "2px solid #000000", borderLeft: "6px solid var(--color-warning-text)", borderRadius: "var(--radius-md)", padding: "8px 10px", backgroundColor: "var(--color-warning-bg)" }}>
                      <Ikon name="warning" size={16} style={{ color: "#000000", marginTop: "1px" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                        Permintaan lebih dari 50 persen di atas rata-rata historis ({konteksKota.rataHistoris} ton).
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ marginTop: "var(--space-5)", backgroundColor: "var(--color-pastel)", border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Ikon name="info" size={18} style={{ color: "var(--color-secondary)", marginTop: "2px" }} />
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
                    Pastikan data tonase akurat — angka ini menjadi dasar ranking dan alokasi distribusi.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default InputData;
