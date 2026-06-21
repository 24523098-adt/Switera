import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import MetricCard from "../components/MetricCard";
import { showToast } from "../components/Toast";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import store from "../store";

const initialForm = { nama: "", kapasitas: "" };

const labelStyle = {
  display: "block",
};

const fieldLabelTextStyle = {
  display: "block",
  marginBottom: "var(--space-2)",
  fontSize: "var(--text-xs)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
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

const errorStyle = {
  margin: "6px 0 0",
  color: "var(--color-danger)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};

function AksiTabelButtons({ onEdit, onDelete }) {
  const editRipple = useRipple();
  const deleteRipple = useRipple();

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        className="aksi-btn aksi-btn-edit"
        onClick={onEdit}
        onMouseDown={editRipple.onMouseDown}
      >
        <span aria-hidden="true">✎</span>
        Edit
        <RippleSpans ripples={editRipple.ripples} removeRipple={editRipple.removeRipple} />
      </button>
      <button
        type="button"
        className="aksi-btn aksi-btn-delete"
        onClick={onDelete}
        onMouseDown={deleteRipple.onMouseDown}
      >
        <span aria-hidden="true">🗑</span>
        Hapus
        <RippleSpans ripples={deleteRipple.ripples} removeRipple={deleteRipple.removeRipple} />
      </button>
    </div>
  );
}

function ManajemenKota({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockValue, setStockValue] = useState("");
  const [stockError, setStockError] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);
  const stokTbs = snapshot.stokTbs ?? 0;

  const tableRows = daftarKota.map((kota) => ({
    id: kota.nama,
    nama: kota.nama,
    kapasitas: kota.kapasitas,
  }));

  const validateForm = (nextForm) => {
    const nextErrors = {};

    if (!nextForm.nama.trim()) {
      nextErrors.nama = "Nama kota wajib diisi.";
    }

    if (!nextForm.kapasitas || Number(nextForm.kapasitas) <= 0) {
      nextErrors.kapasitas = "Kapasitas harus berupa angka positif.";
    }

    return nextErrors;
  };

  const handleFormChange = (field, value) => {
    const nextForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    setFormErrors(validateForm(nextForm));
  };

  const openAddModal = () => {
    setEditTarget(null);
    setForm(initialForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (kota) => {
    setEditTarget(kota);
    setForm({ nama: kota.nama, kapasitas: String(kota.kapasitas) });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const submitForm = () => {
    const nextErrors = validateForm(form);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (editTarget) {
        store.updateKota(editTarget.nama, {
          nama: form.nama.trim(),
          kapasitas: form.kapasitas,
        });
        showToast({ type: "success", message: "Kota berhasil diperbarui." });
      } else {
        store.tambahKota({ nama: form.nama.trim(), kapasitas: form.kapasitas });
        showToast({ type: "success", message: "Kota berhasil ditambahkan." });
      }

      setIsFormOpen(false);
      setForm(initialForm);
      setFormErrors({});
      setEditTarget(null);
    } catch (error) {
      setFormErrors({ nama: error.message });
    }
  };

  const openStockModal = () => {
    setStockValue(String(snapshot.stokTbs ?? 0));
    setStockError("");
    setIsStockModalOpen(true);
  };

  const submitStock = () => {
    const numericValue = Number(stockValue);

    if (!stockValue || numericValue <= 0) {
      setStockError("Stok harus berupa angka positif.");
      return;
    }

    store.setStokTbs(numericValue);
    setIsStockModalOpen(false);
    showToast({ type: "success", message: "Stok TBS berhasil diperbarui." });
  };

  return (
    <>
      <PageHeader
        judul="Manajemen Kota"
        deskripsi="Kelola daftar kota dan kapasitas, serta stok TBS tersedia."
        aksi={<Tombol label="+ Tambah Kota" variant="primer" onClick={openAddModal} />}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <MetricCard
          label="Stok TBS Tersedia (ton)"
          nilai={`${stokTbs} ton`}
          size="lg"
          accent="primary"
        >
          <Tombol label="Edit" variant="sekunder" onClick={openStockModal} />
        </MetricCard>

        <Card>
          <SectionHeader>
            Daftar Kota — Menampilkan {daftarKota.length} kota
          </SectionHeader>

          {tableRows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "nama", label: "Nama Kota" },
                { key: "kapasitas", label: "Kapasitas (ton)", numeric: true },
              ]}
              data={tableRows}
              aksi={(baris) => {
                const currentItem = daftarKota.find((kota) => kota.nama === baris.id);

                return (
                  <AksiTabelButtons
                    onEdit={() => openEditModal(currentItem)}
                    onDelete={() => {}}
                  />
                );
              }}
            />
          ) : (
            <EmptyState pesan="Belum ada kota yang terdaftar. Tambahkan kota pertama untuk mulai mengatur kapasitas dan distribusi TBS." />
          )}
        </Card>
      </div>

      {isFormOpen ? (
        <Modal
          judul={editTarget ? "Edit Kota" : "Tambah Kota Baru"}
          onTutup={() => setIsFormOpen(false)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Nama Kota</span>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(event) => handleFormChange("nama", event.target.value)}
                  style={fieldBaseStyle}
                />
                {formErrors.nama ? <p style={errorStyle}>{formErrors.nama}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Kapasitas (ton)</span>
                <input
                  type="number"
                  className="field-no-spinner"
                  min="1"
                  step="1"
                  value={form.kapasitas}
                  onChange={(event) => handleFormChange("kapasitas", event.target.value)}
                  style={fieldBaseStyle}
                />
                {formErrors.kapasitas ? <p style={errorStyle}>{formErrors.kapasitas}</p> : null}
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Tombol
                  label="Batal"
                  variant="sekunder"
                  onClick={() => setIsFormOpen(false)}
                />
                <Tombol label="Simpan Perubahan" onClick={submitForm} />
              </div>
            </div>
          }
        />
      ) : null}

      {isStockModalOpen ? (
        <Modal
          judul="Perbarui Stok TBS"
          onTutup={() => setIsStockModalOpen(false)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Stok TBS Tersedia (ton)</span>
                <input
                  type="number"
                  className="field-no-spinner"
                  min="1"
                  step="1"
                  value={stockValue}
                  onChange={(event) => {
                    setStockValue(event.target.value);
                    setStockError("");
                  }}
                  style={fieldBaseStyle}
                />
                {stockError ? <p style={errorStyle}>{stockError}</p> : null}
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Tombol
                  label="Batal"
                  variant="sekunder"
                  onClick={() => setIsStockModalOpen(false)}
                />
                <Tombol label="Simpan" onClick={submitStock} />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default ManajemenKota;
