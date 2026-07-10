import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import MetricCard from "../components/MetricCard";
import Tooltip from "../components/Tooltip";
import { showToast } from "../components/Toast";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import store from "../store";

const initialForm = { nama: "", kapasitas: "" };

function IkonInfo() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", color: "var(--color-text-muted)", cursor: "help" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function IkonEditKecil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L4.6 16.4L15.5 5.5C16 5 16.7 5 17.2 5.5L18.5 6.8C19 7.3 19 8 18.5 8.5L7.6 19.4L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IkonHapusKecil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7H19M9 7V5C9 4.4 9.4 4 10 4H14C14.6 4 15 4.4 15 5V7M7 7L7.7 19C7.8 19.6 8.3 20 8.9 20H15.1C15.7 20 16.2 19.6 16.3 19L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  border: "2px solid #000000",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  padding: "10px 14px",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "var(--shadow-sm)",
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
        <IkonEditKecil />
        Edit
        <RippleSpans ripples={editRipple.ripples} removeRipple={editRipple.removeRipple} />
      </button>
      <button
        type="button"
        className="aksi-btn aksi-btn-delete"
        onClick={onDelete}
        onMouseDown={deleteRipple.onMouseDown}
      >
        <IkonHapusKecil />
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blockedTarget, setBlockedTarget] = useState(null);

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    store.loadKota();
    store.loadStok();
    store.loadKeputusan();
  }, []);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);
  const stokTbs = snapshot.stokTbs ?? 0;

  // Bar kapasitas ala Stitch — lebar relatif terhadap kapasitas terbesar,
  // dianimasikan via transisi width saat data masuk.
  const maxKapasitas = Math.max(1, ...daftarKota.map((kota) => kota.kapasitas));

  // Alokasi aktif per kota (dari keputusan) untuk menghitung utilisasi kapasitas.
  const alokasiByKota = useMemo(() => {
    const map = new Map();
    (snapshot.keputusan ?? []).forEach((item) => {
      map.set(item.kota_tujuan, (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0));
    });
    return map;
  }, [snapshot.keputusan]);

  const tableRows = daftarKota.map((kota) => {
    const alokasi = alokasiByKota.get(kota.nama) || 0;
    const persen = kota.kapasitas > 0 ? Math.min(100, Math.round((alokasi / kota.kapasitas) * 100)) : 0;
    const warnaUtil = persen >= 90 ? "var(--color-danger)" : persen >= 70 ? "var(--color-warning-text)" : "var(--color-primary)";
    return {
      id: kota.nama,
      nama: kota.nama,
      kapasitas: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
          <span style={{ minWidth: "64px", textAlign: "right", fontWeight: "var(--font-weight-semibold)" }}>
            {kota.kapasitas}
          </span>
          <span
            aria-hidden="true"
            style={{
              width: "120px",
              height: "8px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-surface-container)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: "block",
                height: "100%",
                width: `${Math.round((kota.kapasitas / maxKapasitas) * 100)}%`,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-primary)",
                transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </span>
        </span>
      ),
      utilisasi: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
          <span style={{ minWidth: "42px", textAlign: "right", fontWeight: "var(--font-weight-bold)", color: warnaUtil }}>
            {persen}%
          </span>
          <span aria-hidden="true" style={{ width: "100px", height: "8px", borderRadius: "var(--radius-full)", border: "2px solid #000000", backgroundColor: "var(--color-surface)", overflow: "hidden", flexShrink: 0 }}>
            <span style={{ display: "block", height: "100%", width: `${persen}%`, backgroundColor: warnaUtil }} />
          </span>
        </span>
      ),
    };
  });

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

  const submitForm = async () => {
    const nextErrors = validateForm(form);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (editTarget) {
        await store.updateKota(editTarget.nama, {
          nama: form.nama.trim(),
          kapasitas: form.kapasitas,
        });
        showToast({ type: "success", message: "Kota berhasil diperbarui." });
      } else {
        await store.tambahKota({ nama: form.nama.trim(), kapasitas: form.kapasitas });
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

  const requestDelete = async (kota) => {
    try {
      const { permintaanCount, keputusanCount } = await store.getKotaReferenceCounts(kota.nama);

      if (permintaanCount > 0 || keputusanCount > 0) {
        setBlockedTarget({ ...kota, permintaanCount, keputusanCount });
      } else {
        setDeleteTarget(kota);
      }
    } catch (error) {
      showToast({ type: "error", message: error.message ?? "Gagal memeriksa referensi kota." });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await store.hapusKota(deleteTarget.nama);
      setDeleteTarget(null);
      showToast({ type: "success", message: "Kota berhasil dihapus." });
    } catch {
      // runMutation already surfaced a Toast for the failure.
    }
  };

  const openStockModal = () => {
    setStockValue(String(snapshot.stokTbs ?? 0));
    setStockError("");
    setIsStockModalOpen(true);
  };

  const submitStock = async () => {
    const numericValue = Number(stockValue);

    if (!stockValue || numericValue <= 0) {
      setStockError("Stok harus berupa angka positif.");
      return;
    }

    try {
      await store.setStokTbs(numericValue);
      setIsStockModalOpen(false);
      showToast({ type: "success", message: "Stok TBS berhasil diperbarui." });
    } catch {
      // runMutation already surfaced a Toast for the failure; modal stays open.
    }
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
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Stok TBS Tersedia (ton)
              <Tooltip content="Tandan Buah Segar" position="top">
                <IkonInfo />
              </Tooltip>
            </span>
          }
          nilai={`${stokTbs} ton`}
          size="lg"
          accent="primary"
        >
          <Tombol label="Edit" variant="sekunder" onClick={openStockModal} />
        </MetricCard>

        <Card style={{ animationDelay: "60ms" }}>
          <SectionHeader>
            Daftar Kota — Menampilkan {daftarKota.length} kota
          </SectionHeader>

          {tableRows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "nama", label: "Nama Kota" },
                { key: "kapasitas", label: "Kapasitas (ton)", numeric: true },
                { key: "utilisasi", label: "Utilisasi", numeric: true },
              ]}
              data={tableRows}
              aksi={(baris) => {
                const currentItem = daftarKota.find((kota) => kota.nama === baris.id);

                return (
                  <AksiTabelButtons
                    onEdit={() => openEditModal(currentItem)}
                    onDelete={() => requestDelete(currentItem)}
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
                gap: "var(--space-4)",
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
                gap: "var(--space-4)",
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

      {deleteTarget ? (
        <Modal
          judul="Hapus Kota"
          onTutup={() => setDeleteTarget(null)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Kota{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {deleteTarget.nama}
                </strong>{" "}
                akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
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
                  onClick={() => setDeleteTarget(null)}
                />
                <Tombol label="Ya, Hapus" variant="bahaya" onClick={confirmDelete} />
              </div>
            </div>
          }
        />
      ) : null}

      {blockedTarget ? (
        <Modal
          judul="Tidak Bisa Menghapus Kota"
          onTutup={() => setBlockedTarget(null)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Kota{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {blockedTarget.nama}
                </strong>{" "}
                tidak bisa dihapus karena masih digunakan oleh {blockedTarget.permintaanCount}{" "}
                permintaan dan {blockedTarget.keputusanCount} keputusan distribusi. Hapus atau
                pindahkan data tersebut terlebih dahulu.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Tombol
                  label="Mengerti"
                  variant="sekunder"
                  onClick={() => setBlockedTarget(null)}
                />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default ManajemenKota;
