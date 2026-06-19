import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import useRipple from "../hooks/useRipple";
import store from "../store";

function SectionHeader({ children }) {
  return (
    <p
      style={{
        margin: 0,
        marginBottom: "var(--space-3)",
        paddingBottom: "var(--space-3)",
        borderBottom: "1px solid var(--color-border)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wider)",
      }}
    >
      {children}
    </p>
  );
}

const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return formatterTanggal.format(new Date(`${value}T00:00:00`));
};

const initialEditForm = {
  id: "",
  kota: "",
  tanggalPermintaan: "",
  tanggalInput: "",
  jumlahPermintaan: "",
  keterangan: "",
};

const actionButtonStyle = (color) => ({
  position: "relative",
  overflow: "hidden",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  border: `1px solid ${color}`,
  borderRadius: "var(--radius-sm)",
  backgroundColor: "transparent",
  color,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  padding: "6px 10px",
  transition:
    "background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)",
});

function RippleSpans({ ripples, removeRipple }) {
  return ripples.map((ripple) => (
    <span
      key={ripple.id}
      className="ripple-span"
      style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
      onAnimationEnd={() => removeRipple(ripple.id)}
    />
  ));
}

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
        onClick={onEdit}
        onMouseDown={editRipple.onMouseDown}
        style={actionButtonStyle("var(--color-info)")}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = "var(--color-info-subtle)";
          event.currentTarget.style.transform = "translateY(-1px)";
          event.currentTarget.style.boxShadow = "var(--shadow-xs)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = "transparent";
          event.currentTarget.style.transform = "translateY(0)";
          event.currentTarget.style.boxShadow = "none";
        }}
      >
        <span aria-hidden="true">✎</span>
        Edit
        <RippleSpans ripples={editRipple.ripples} removeRipple={editRipple.removeRipple} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        onMouseDown={deleteRipple.onMouseDown}
        style={actionButtonStyle("var(--color-danger)")}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = "var(--color-danger-subtle)";
          event.currentTarget.style.transform = "translateY(-1px)";
          event.currentTarget.style.boxShadow = "var(--shadow-xs)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = "transparent";
          event.currentTarget.style.transform = "translateY(0)";
          event.currentTarget.style.boxShadow = "none";
        }}
      >
        <span aria-hidden="true">🗑</span>
        Hapus
        <RippleSpans ripples={deleteRipple.ripples} removeRipple={deleteRipple.removeRipple} />
      </button>
    </div>
  );
}

function ManajemenData({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [keyword, setKeyword] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editErrors, setEditErrors] = useState({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

  const sortedPermintaan = useMemo(
    () =>
      [...(snapshot.permintaan ?? [])].sort((first, second) => {
        const tanggalInput = new Date(`${second.tanggal_input}T00:00:00`) -
          new Date(`${first.tanggal_input}T00:00:00`);

        if (tanggalInput !== 0) {
          return tanggalInput;
        }

        return (
          new Date(`${second.tanggal_permintaan}T00:00:00`) -
          new Date(`${first.tanggal_permintaan}T00:00:00`)
        );
      }),
    [snapshot.permintaan]
  );

  const filteredPermintaan = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return sortedPermintaan;
    }

    return sortedPermintaan.filter((item) =>
      item.kota.toLowerCase().includes(normalizedKeyword)
    );
  }, [keyword, sortedPermintaan]);

  const validateEditForm = (nextForm) => {
    const nextErrors = {};

    if (!nextForm.kota) {
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
        excludeId: nextForm.id,
      })
    ) {
      nextErrors.tanggalPermintaan =
        "Data untuk kota ini pada tanggal tersebut sudah ada.";
    }

    return nextErrors;
  };

  const openEditModal = (item) => {
    setEditForm({
      id: item.id,
      kota: item.kota,
      tanggalPermintaan: item.tanggal_permintaan,
      tanggalInput: item.tanggal_input,
      jumlahPermintaan: String(item.jumlah_permintaan),
      keterangan: item.keterangan ?? "",
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleEditChange = (field, value) => {
    const nextForm = {
      ...editForm,
      [field]: value,
    };

    setEditForm(nextForm);
    setEditErrors(validateEditForm(nextForm));
  };

  const saveEdit = () => {
    const nextErrors = validateEditForm(editForm);
    setEditErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    store.updatePermintaan(editForm.id, {
      kota: editForm.kota,
      tanggal_permintaan: editForm.tanggalPermintaan,
      tanggal_input: editForm.tanggalInput,
      jumlah_permintaan: Number(editForm.jumlahPermintaan),
      keterangan: editForm.keterangan.trim(),
    });

    setIsEditOpen(false);
    setEditForm(initialEditForm);
    setToastMessage("Data permintaan berhasil diperbarui.");
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    store.removePermintaan(deleteTarget.id);
    setDeleteTarget(null);
    setToastMessage("Data permintaan berhasil dihapus.");
  };

  const tableRows = filteredPermintaan.map((item) => ({
    id: item.id,
    nomorId: item.id,
    namaKota: item.kota,
    tanggalPermintaan: formatDate(item.tanggal_permintaan),
    tanggalInput: formatDate(item.tanggal_input),
    jumlah: `${item.jumlah_permintaan} ton`,
    keterangan: item.keterangan?.trim() ? item.keterangan : "-",
  }));

  const fieldStyle = {
    width: "100%",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-surface-2)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    padding: "9px 12px",
    outline: "none",
    boxSizing: "border-box",
    transition:
      "border-color var(--transition-input), box-shadow var(--transition-input)",
  };
  const getFieldStyle = (field) => ({
    ...fieldStyle,
    borderColor:
      focusedField === field ? "var(--color-primary)" : "var(--color-border)",
    boxShadow:
      focusedField === field ? "0 0 0 3px var(--color-primary-subtle)" : "none",
  });

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    color: "var(--color-text-secondary)",
    fontWeight: 500,
    fontSize: "var(--text-sm)",
  };

  const errorStyle = {
    margin: 0,
    color: "var(--color-danger)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  };

  return (
    <Layout
      title="Switera"
      roleAwal="Admin"
      menuAwal="manajemen-data"
      onMenuChange={onNavigate}
    >
      <PageHeader
        judul="Manajemen Data Permintaan"
        deskripsi="Tinjau, ubah, atau hapus data permintaan kota yang sudah tersimpan."
        aksi={
          <div
            style={{
              width: "min(360px, 100%)",
              position: "relative",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              type="search"
              value={keyword}
              onFocus={() => setFocusedField("keyword")}
              onBlur={() => setFocusedField("")}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari berdasarkan nama kota"
              style={{
                ...getFieldStyle("keyword"),
                paddingLeft: "40px",
              }}
            />
          </div>
        }
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <Card>
          <SectionHeader>
            Daftar Permintaan — Menampilkan {tableRows.length} dari {sortedPermintaan.length} data
          </SectionHeader>

          {tableRows.length > 0 ? (
            <>
              <Tabel
                kolom={[
                  { key: "nomorId", label: "ID" },
                  { key: "namaKota", label: "Nama Kota" },
                  { key: "tanggalPermintaan", label: "Tanggal Permintaan" },
                  { key: "tanggalInput", label: "Tanggal Input" },
                  { key: "jumlah", label: "Jumlah (ton)", numeric: true },
                  { key: "keterangan", label: "Keterangan" },
                ]}
                data={tableRows}
                aksi={(baris) => {
                  const currentItem = filteredPermintaan.find((item) => item.id === baris.id);

                  return (
                    <AksiTabelButtons
                      onEdit={() => openEditModal(currentItem)}
                      onDelete={() => setDeleteTarget(currentItem)}
                    />
                  );
                }}
              />
            </>
          ) : (
            <EmptyState pesan="Tidak ada data yang cocok dengan kata kunci pencarian kota." />
          )}
        </Card>
      </div>

      {isEditOpen ? (
        <Modal
          judul="Edit data permintaan"
          onTutup={() => setIsEditOpen(false)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <label style={labelStyle}>
                <span>Nama Kota</span>
                <select
                  value={editForm.kota}
                  onFocus={() => setFocusedField("editKota")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => handleEditChange("kota", event.target.value)}
                  style={getFieldStyle("editKota")}
                >
                  <option value="">Pilih kota</option>
                  {daftarKota.map((kota) => (
                    <option key={kota} value={kota}>
                      {kota}
                    </option>
                  ))}
                </select>
                {editErrors.kota ? <p style={errorStyle}>{editErrors.kota}</p> : null}
              </label>

              <label style={labelStyle}>
                <span>Tanggal Permintaan</span>
                <input
                  type="date"
                  value={editForm.tanggalPermintaan}
                  onFocus={() => setFocusedField("editTanggal")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) =>
                    handleEditChange("tanggalPermintaan", event.target.value)
                  }
                  style={getFieldStyle("editTanggal")}
                />
                {editErrors.tanggalPermintaan ? (
                  <p style={errorStyle}>{editErrors.tanggalPermintaan}</p>
                ) : null}
              </label>

              <label style={labelStyle}>
                <span>Jumlah Permintaan dalam ton</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.jumlahPermintaan}
                  onFocus={() => setFocusedField("editJumlah")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) =>
                    handleEditChange("jumlahPermintaan", event.target.value)
                  }
                  style={getFieldStyle("editJumlah")}
                />
                {editErrors.jumlahPermintaan ? (
                  <p style={errorStyle}>{editErrors.jumlahPermintaan}</p>
                ) : null}
              </label>

              <label style={labelStyle}>
                <span>Keterangan</span>
                <textarea
                  rows="4"
                  value={editForm.keterangan}
                  onFocus={() => setFocusedField("editKeterangan")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => handleEditChange("keterangan", event.target.value)}
                  style={{
                    ...getFieldStyle("editKeterangan"),
                    resize: "vertical",
                  }}
                />
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
                  onClick={() => setIsEditOpen(false)}
                />
                <Tombol label="Simpan Perubahan" onClick={saveEdit} />
              </div>
            </div>
          }
        />
      ) : null}

      {deleteTarget ? (
        <Modal
          judul="Hapus data permintaan"
          onTutup={() => setDeleteTarget(null)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Data permintaan untuk kota{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {deleteTarget.kota}
                </strong>{" "}
                pada tanggal {formatDate(deleteTarget.tanggal_permintaan)} akan dihapus
                secara permanen.
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

      {toastMessage ? (
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            width: "min(360px, calc(100vw - 3rem))",
            zIndex: 1100,
          }}
        >
          <Card
            style={{
              borderLeft: "6px solid var(--color-success)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--color-text-primary)",
                fontWeight: 700,
              }}
            >
              Berhasil
            </p>
            <p
              style={{
                margin: "0.35rem 0 0",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {toastMessage}
            </p>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
}

export default ManajemenData;
