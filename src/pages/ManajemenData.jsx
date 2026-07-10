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

function IkonSearch({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  const [filterKota, setFilterKota] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("semua");
  const [volMin, setVolMin] = useState("");
  const [volMax, setVolMax] = useState("");

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

  // Peta kapasitas kota untuk deteksi anomali (permintaan melebihi kapasitas).
  const kapasitasMap = useMemo(
    () => new Map(daftarKota.map((kota) => [kota.nama, Number(kota.kapasitas) || 0])),
    [daftarKota]
  );

  const dalamPeriode = (tanggal) => {
    if (filterPeriode === "semua" || !tanggal) return true;
    const t = new Date(`${tanggal}T00:00:00`).getTime();
    const now = Date.now();
    const hari = filterPeriode === "minggu" ? 7 : 30;
    return t >= now - hari * 24 * 60 * 60 * 1000;
  };

  const filteredPermintaan = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const min = volMin === "" ? null : Number(volMin);
    const max = volMax === "" ? null : Number(volMax);

    return sortedPermintaan.filter((item) => {
      if (normalizedKeyword && !item.kota.toLowerCase().includes(normalizedKeyword)) return false;
      if (filterKota && item.kota !== filterKota) return false;
      if (!dalamPeriode(item.tanggal_permintaan)) return false;
      const jumlah = Number(item.jumlah_permintaan) || 0;
      if (min !== null && jumlah < min) return false;
      if (max !== null && jumlah > max) return false;
      return true;
    });
  }, [keyword, sortedPermintaan, filterKota, filterPeriode, volMin, volMax]);

  // Ringkasan agregat (MIS): total, rata-rata per kota, kota tertinggi/terendah.
  const ringkasan = useMemo(() => {
    const perKota = new Map();
    let total = 0;
    (snapshot.permintaan ?? []).forEach((item) => {
      const jumlah = Number(item.jumlah_permintaan) || 0;
      total += jumlah;
      perKota.set(item.kota, (perKota.get(item.kota) || 0) + jumlah);
    });
    const entries = [...perKota.entries()].sort((a, b) => b[1] - a[1]);
    return {
      total,
      rataPerKota: entries.length > 0 ? Math.round((total / entries.length) * 10) / 10 : 0,
      tertinggi: entries[0] ?? null,
      terendah: entries[entries.length - 1] ?? null,
    };
  }, [snapshot.permintaan]);

  // Baris anomali: permintaan melebihi kapasitas kota.
  const anomaliIds = useMemo(() => {
    const set = new Set();
    (snapshot.permintaan ?? []).forEach((item) => {
      const kapasitas = kapasitasMap.get(item.kota) ?? 0;
      if (kapasitas > 0 && (Number(item.jumlah_permintaan) || 0) > kapasitas) {
        set.add(item.id);
      }
    });
    return set;
  }, [snapshot.permintaan, kapasitasMap]);

  const validateEditForm = async (nextForm) => {
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
      (await store.hasPermintaanDuplikat({
        kota: nextForm.kota,
        tanggalPermintaan: nextForm.tanggalPermintaan,
        excludeId: nextForm.id,
      }))
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

  const handleEditChange = async (field, value) => {
    const nextForm = {
      ...editForm,
      [field]: value,
    };

    setEditForm(nextForm);
    setEditErrors(await validateEditForm(nextForm));
  };

  const saveEdit = async () => {
    const nextErrors = await validateEditForm(editForm);
    setEditErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await store.updatePermintaan(editForm.id, {
        kota: editForm.kota,
        tanggal_permintaan: editForm.tanggalPermintaan,
        tanggal_input: editForm.tanggalInput,
        jumlah_permintaan: Number(editForm.jumlahPermintaan),
        keterangan: editForm.keterangan.trim(),
      });

      setIsEditOpen(false);
      setEditForm(initialEditForm);
      showToast({ type: "success", message: "Data permintaan berhasil diperbarui." });
    } catch (error) {
      if (error.fields?.jumlah_permintaan) {
        setEditErrors({ jumlahPermintaan: error.fields.jumlah_permintaan });
      } else if (error.fields?.tanggal_permintaan) {
        setEditErrors({ tanggalPermintaan: error.fields.tanggal_permintaan });
      } else if (error.fields?.kota) {
        setEditErrors({ kota: error.fields.kota });
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const itemDihapus = deleteTarget;

    try {
      await store.removePermintaan(itemDihapus.id);
      setDeleteTarget(null);
      showToast({
        type: "success",
        message: "Data permintaan berhasil dihapus.",
        action: {
          label: "Urungkan",
          onClick: async () => {
            await store.addPermintaan(itemDihapus);
            showToast({ type: "info", message: "Penghapusan data dibatalkan." });
          },
        },
      });
    } catch {
      setDeleteTarget(null);
    }
  };

  const startInlineEdit = (item) => {
    setInlineEditingId(item.id);
    setInlineValue(String(item.jumlah_permintaan));
  };

  const commitInlineEdit = async (item) => {
    const nextValue = Number(inlineValue);

    if (!inlineValue || nextValue <= 0) {
      setInlineEditingId(null);
      return;
    }

    if (nextValue !== item.jumlah_permintaan) {
      try {
        await store.updatePermintaan(item.id, { jumlah_permintaan: nextValue });
        showToast({ type: "success", message: "Jumlah permintaan berhasil diperbarui." });
      } catch {
        // runMutation already surfaces a Toast for the failure; nothing
        // further to do here besides closing the inline editor below.
      }
    }

    setInlineEditingId(null);
  };

  const tableRows = filteredPermintaan.map((item) => ({
    id: item.id,
    nomorId: item.id,
    namaKota: anomaliIds.has(item.id) ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {item.kota}
        <span
          title="Permintaan melebihi kapasitas kota"
          style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", border: "2px solid #000000", borderRadius: "var(--radius-full)", padding: "1px 8px", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}
        >
          Anomali
        </span>
      </span>
    ) : (
      item.kota
    ),
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
            width: "90px",
            border: "2px solid #000000",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-pastel)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            padding: "var(--space-1) var(--space-2)",
            outline: "none",
          }}
        />
      ) : (
        <span
          onClick={() => startInlineEdit(item)}
          title="Klik untuk edit cepat"
          style={{ cursor: "pointer", borderBottom: "2px dashed #000000" }}
        >
          {item.jumlah_permintaan} ton
        </span>
      ),
    keterangan: item.keterangan?.trim() ? item.keterangan : "-",
  }));

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
      "border-color var(--transition-input), box-shadow var(--transition-input), background-color var(--transition-input)",
  };

  // Fokus ala neo brutalist: latar pastel, border tetap hitam.
  const getFieldStyle = (field) => {
    const isFocused = focusedField === field;
    const isHovered = hoveredField === field && !isFocused;

    return {
      ...fieldBaseStyle,
      backgroundColor: isFocused
        ? "var(--color-pastel)"
        : isHovered
          ? "var(--color-surface-container-low)"
          : "var(--color-surface)",
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
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                width: "min(320px, 100%)",
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
                  display: "inline-flex",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              >
                <IkonSearch />
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
            <Tombol label="+ Tambah Data Baru" onClick={() => onNavigate?.("input-data")} />
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
        {/* Ringkasan agregat (MIS) */}
        <div className="app-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: "var(--space-3)" }}>
          {[
            { label: "Total Permintaan", nilai: `${ringkasan.total} ton` },
            { label: "Rata-rata / Kota", nilai: `${ringkasan.rataPerKota} ton` },
            { label: "Kota Tertinggi", nilai: ringkasan.tertinggi ? `${ringkasan.tertinggi[0]}` : "-", sub: ringkasan.tertinggi ? `${ringkasan.tertinggi[1]} ton` : "" },
            { label: "Kota Terendah", nilai: ringkasan.terendah ? `${ringkasan.terendah[0]}` : "-", sub: ringkasan.terendah ? `${ringkasan.terendah[1]} ton` : "" },
          ].map((box) => (
            <Card key={box.label} style={{ padding: "var(--space-4)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>{box.label}</p>
              <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{box.nilai}</p>
              {box.sub ? <p style={{ margin: "2px 0 0", fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>{box.sub}</p> : null}
            </Card>
          ))}
        </div>

        {/* Filter analitik */}
        <Card style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={fieldLabelTextStyle}>Kota</span>
            <select className="field-select" value={filterKota} onChange={(event) => setFilterKota(event.target.value)} style={{ ...getFieldStyle("filterKota"), minWidth: "160px" }}>
              <option value="">Semua kota</option>
              {daftarKota.map((kota) => (
                <option key={kota.nama} value={kota.nama}>{kota.nama}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={fieldLabelTextStyle}>Periode</span>
            <select className="field-select" value={filterPeriode} onChange={(event) => setFilterPeriode(event.target.value)} style={{ ...getFieldStyle("filterPeriode"), minWidth: "150px" }}>
              <option value="semua">Semua waktu</option>
              <option value="minggu">7 hari terakhir</option>
              <option value="bulan">30 hari terakhir</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={fieldLabelTextStyle}>Volume min</span>
            <input type="number" min="0" value={volMin} onChange={(event) => setVolMin(event.target.value)} placeholder="0" style={{ ...getFieldStyle("volMin"), width: "110px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={fieldLabelTextStyle}>Volume maks</span>
            <input type="number" min="0" value={volMax} onChange={(event) => setVolMax(event.target.value)} placeholder="~" style={{ ...getFieldStyle("volMax"), width: "110px" }} />
          </label>
          {(filterKota || filterPeriode !== "semua" || volMin || volMax) ? (
            <Tombol variant="sekunder" label="Reset Filter" onClick={() => { setFilterKota(""); setFilterPeriode("semua"); setVolMin(""); setVolMax(""); }} />
          ) : null}
        </Card>

        <Card style={{ animationDelay: "40ms" }}>
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
              getRowStyle={(baris) => (anomaliIds.has(baris.id) ? { backgroundColor: "var(--color-danger-bg)" } : undefined)}
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
