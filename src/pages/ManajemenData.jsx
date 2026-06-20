import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import store from "../store";
import { formatDate } from "../utils/format";

const initialEditForm = {
  id: "",
  kota: "",
  tanggalPermintaan: "",
  tanggalInput: "",
  jumlahPermintaan: "",
  keterangan: "",
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

function ManajemenData({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [keyword, setKeyword] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editErrors, setEditErrors] = useState({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [focusedField, setFocusedField] = useState("");
  const [hoveredField, setHoveredField] = useState("");
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineValue, setInlineValue] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

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
    showToast({ type: "success", message: "Data permintaan berhasil diperbarui." });
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const itemDihapus = deleteTarget;
    store.removePermintaan(itemDihapus.id);
    setDeleteTarget(null);
    showToast({
      type: "success",
      message: "Data permintaan berhasil dihapus.",
      action: {
        label: "Urungkan",
        onClick: () => {
          store.addPermintaan(itemDihapus);
          showToast({ type: "info", message: "Penghapusan data dibatalkan." });
        },
      },
    });
  };

  const startInlineEdit = (item) => {
    setInlineEditingId(item.id);
    setInlineValue(String(item.jumlah_permintaan));
  };

  const commitInlineEdit = (item) => {
    const nextValue = Number(inlineValue);

    if (!inlineValue || nextValue <= 0) {
      setInlineEditingId(null);
      return;
    }

    if (nextValue !== item.jumlah_permintaan) {
      store.updatePermintaan(item.id, { jumlah_permintaan: nextValue });
      showToast({ type: "success", message: "Jumlah permintaan berhasil diperbarui." });
    }

    setInlineEditingId(null);
  };

  const tableRows = filteredPermintaan.map((item) => ({
    id: item.id,
    nomorId: item.id,
    namaKota: item.kota,
    tanggalPermintaan: formatDate(item.tanggal_permintaan),
    tanggalInput: formatDate(item.tanggal_input),
    jumlah:
      inlineEditingId === item.id ? (
        <input
          type="number"
          min="1"
          step="1"
          autoFocus
          value={inlineValue}
          onChange={(event) => setInlineValue(event.target.value)}
          onBlur={() => commitInlineEdit(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitInlineEdit(item);
            } else if (event.key === "Escape") {
              setInlineEditingId(null);
            }
          }}
          style={{
            width: "80px",
            border: "1px solid var(--color-primary)",
            borderRadius: "var(--radius-xs)",
            backgroundColor: "var(--color-surface-2)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            padding: "3px 6px",
            outline: "none",
          }}
        />
      ) : (
        <span
          onClick={() => startInlineEdit(item)}
          title="Klik untuk edit cepat"
          style={{ cursor: "pointer", borderBottom: "1px dashed var(--color-border-mid)" }}
        >
          {item.jumlah_permintaan} ton
        </span>
      ),
    keterangan: item.keterangan?.trim() ? item.keterangan : "-",
  }));

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

  const errorStyle = {
    margin: 0,
    color: "var(--color-danger)",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  };

  return (
    <>
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
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari berdasarkan nama kota"
              style={{
                ...getFieldStyle("keyword"),
                paddingLeft: "40px",
              }}
              {...getFieldHandlers("keyword")}
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
                <span style={fieldLabelTextStyle}>Nama Kota</span>
                <select
                  className="field-select"
                  value={editForm.kota}
                  onChange={(event) => handleEditChange("kota", event.target.value)}
                  style={getFieldStyle("editKota")}
                  {...getFieldHandlers("editKota")}
                >
                  <option value="">Pilih kota</option>
                  {daftarKota.map((kota) => (
                    <option key={kota.nama} value={kota.nama}>
                      {kota.nama}
                    </option>
                  ))}
                </select>
                {editErrors.kota ? <p style={errorStyle}>{editErrors.kota}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Tanggal Permintaan</span>
                <input
                  type="date"
                  value={editForm.tanggalPermintaan}
                  onChange={(event) =>
                    handleEditChange("tanggalPermintaan", event.target.value)
                  }
                  style={getFieldStyle("editTanggal")}
                  {...getFieldHandlers("editTanggal")}
                />
                {editErrors.tanggalPermintaan ? (
                  <p style={errorStyle}>{editErrors.tanggalPermintaan}</p>
                ) : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Jumlah Permintaan dalam ton</span>
                <input
                  type="number"
                  className="field-no-spinner"
                  min="1"
                  step="1"
                  value={editForm.jumlahPermintaan}
                  onChange={(event) =>
                    handleEditChange("jumlahPermintaan", event.target.value)
                  }
                  style={getFieldStyle("editJumlah")}
                  {...getFieldHandlers("editJumlah")}
                />
                {editErrors.jumlahPermintaan ? (
                  <p style={errorStyle}>{editErrors.jumlahPermintaan}</p>
                ) : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Keterangan</span>
                <textarea
                  rows="4"
                  value={editForm.keterangan}
                  onChange={(event) => handleEditChange("keterangan", event.target.value)}
                  style={{
                    ...getFieldStyle("editKeterangan"),
                    minHeight: "120px",
                    resize: "vertical",
                    lineHeight: "var(--leading-loose)",
                  }}
                  {...getFieldHandlers("editKeterangan")}
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
    </>
  );
}

export default ManajemenData;
