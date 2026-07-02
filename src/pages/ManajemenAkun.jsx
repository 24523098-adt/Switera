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
import { roleOptions } from "../utils/navigation";

const initialTambahForm = { nama: "", username: "", password: "", role: "" };
const initialEditForm = { id: "", nama: "", role: "" };

function IkonUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20C4 16.134 7.58172 13 12 13C16.4183 13 20 16.134 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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

function IkonKunciKecil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 12L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 8L19 5L21 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AksiTabelButtons({ onEdit, onResetPassword, onDelete, isCurrentUser }) {
  const editRipple = useRipple();
  const resetRipple = useRipple();
  const deleteRipple = useRipple();

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
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
        className="aksi-btn"
        onClick={onResetPassword}
        onMouseDown={resetRipple.onMouseDown}
        style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
      >
        <IkonKunciKecil />
        Reset Sandi
        <RippleSpans ripples={resetRipple.ripples} removeRipple={resetRipple.removeRipple} />
      </button>
      <button
        type="button"
        className="aksi-btn aksi-btn-delete"
        onClick={onDelete}
        onMouseDown={deleteRipple.onMouseDown}
        disabled={isCurrentUser}
        title={isCurrentUser ? "Tidak dapat menghapus akun sendiri" : undefined}
        style={isCurrentUser ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
      >
        <IkonHapusKecil />
        Hapus
        <RippleSpans ripples={deleteRipple.ripples} removeRipple={deleteRipple.removeRipple} />
      </button>
    </div>
  );
}

const labelStyle = { display: "block" };

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
  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)",
};

const errorStyle = {
  margin: "6px 0 0",
  color: "var(--color-danger)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};

function ManajemenAkun() {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [keyword, setKeyword] = useState("");
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [tambahForm, setTambahForm] = useState(initialTambahForm);
  const [tambahErrors, setTambahErrors] = useState({});
  const [isSavingTambah, setIsSavingTambah] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editErrors, setEditErrors] = useState({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((next) => setSnapshot(next));
    return unsubscribe;
  }, []);

  useEffect(() => {
    store.loadAkun();
  }, []);

  const currentUserId = snapshot.userAktif?.id;

  const filteredAkun = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const daftar = snapshot.daftarAkun ?? [];
    if (!kw) return daftar;
    return daftar.filter(
      (item) =>
        item.nama.toLowerCase().includes(kw) ||
        item.username.toLowerCase().includes(kw)
    );
  }, [keyword, snapshot.daftarAkun]);

  const statsByRole = useMemo(() => {
    const daftar = snapshot.daftarAkun ?? [];
    return roleOptions.reduce((acc, role) => {
      acc[role] = daftar.filter((item) => item.role === role).length;
      return acc;
    }, {});
  }, [snapshot.daftarAkun]);

  const getFieldStyle = (field) => ({
    ...fieldBaseStyle,
    borderColor: focusedField === field ? "var(--color-primary)" : "var(--color-border-mid)",
    boxShadow: focusedField === field ? "0 0 0 3px var(--color-primary-glow)" : "none",
  });

  const getFieldHandlers = (field) => ({
    onFocus: () => setFocusedField(field),
    onBlur: () => setFocusedField(""),
  });

  const validateTambah = (form) => {
    const errors = {};
    if (!form.nama.trim()) errors.nama = "Nama wajib diisi.";
    if (!form.username.trim()) errors.username = "Username wajib diisi.";
    else if (form.username.trim().length < 3) errors.username = "Username minimal 3 karakter.";
    if (!form.password) errors.password = "Password wajib diisi.";
    else if (form.password.length < 6) errors.password = "Password minimal 6 karakter.";
    if (!form.role) errors.role = "Role wajib dipilih.";
    return errors;
  };

  const validateEdit = (form) => {
    const errors = {};
    if (!form.nama.trim()) errors.nama = "Nama wajib diisi.";
    if (!form.role) errors.role = "Role wajib dipilih.";
    return errors;
  };

  const handleTambahChange = (field, value) => {
    const next = { ...tambahForm, [field]: value };
    setTambahForm(next);
    setTambahErrors(validateTambah(next));
  };

  const handleEditChange = (field, value) => {
    const next = { ...editForm, [field]: value };
    setEditForm(next);
    setEditErrors(validateEdit(next));
  };

  const openEditModal = (item) => {
    setEditForm({ id: item.id, nama: item.nama, role: item.role });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const saveTambah = async () => {
    const errors = validateTambah(tambahForm);
    setTambahErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingTambah(true);
    try {
      await store.register({
        nama: tambahForm.nama.trim(),
        username: tambahForm.username.trim(),
        password: tambahForm.password,
        role: tambahForm.role,
      });
      await store.loadAkun();
      setIsTambahOpen(false);
      setTambahForm(initialTambahForm);
      showToast({ type: "success", message: "Akun baru berhasil ditambahkan." });
    } catch (error) {
      if (/username sudah digunakan/i.test(error.message)) {
        setTambahErrors({ username: "Username sudah digunakan." });
      }
    } finally {
      setIsSavingTambah(false);
    }
  };

  const saveEdit = async () => {
    const errors = validateEdit(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingEdit(true);
    try {
      await store.updateAkunData(editForm.id, {
        nama: editForm.nama.trim(),
        role: editForm.role,
      });
      setIsEditOpen(false);
      setEditForm(initialEditForm);
      showToast({ type: "success", message: "Akun berhasil diperbarui." });
    } catch {
      // runMutation sudah tampilkan toast error
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openResetModal = (item) => {
    setResetTarget(item);
    setResetPassword("");
    setResetError("");
    setShowResetPassword(false);
  };

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    if (!resetPassword || resetPassword.length < 6) {
      setResetError("Password minimal 6 karakter.");
      return;
    }

    setIsResetting(true);
    try {
      await store.resetPasswordAkun(resetTarget.id, resetPassword);
      showToast({ type: "success", message: `Kata sandi akun "${resetTarget.nama}" berhasil direset.` });
      setResetTarget(null);
      setResetPassword("");
    } catch {
      // runMutation sudah tampilkan toast error
    } finally {
      setIsResetting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await store.hapusAkunById(deleteTarget.id);
      setDeleteTarget(null);
      showToast({ type: "success", message: `Akun "${deleteTarget.nama}" berhasil dihapus.` });
    } catch {
      // runMutation sudah tampilkan toast error
    } finally {
      setIsDeleting(false);
    }
  };

  const tableRows = filteredAkun.map((item) => ({
    id: item.id,
    nomorId: item.id,
    nama: item.nama,
    username: item.username,
    role: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 10px",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          backgroundColor:
            item.role === "Admin"
              ? "var(--color-accent-subtle)"
              : item.role === "Manajer Distribusi"
                ? "rgba(99,102,241,0.12)"
                : "rgba(16,185,129,0.12)",
          color:
            item.role === "Admin"
              ? "var(--color-accent)"
              : item.role === "Manajer Distribusi"
                ? "#818cf8"
                : "#34d399",
        }}
      >
        {item.role}
      </span>
    ),
    akun_saya: item.id === currentUserId ? (
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        (Anda)
      </span>
    ) : null,
  }));

  return (
    <>
      <PageHeader
        judul="Manajemen Akun"
        deskripsi="Kelola akun pengguna sistem, tambah, edit nama atau role, dan hapus akun."
        aksi={
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: "min(280px, 100%)", position: "relative" }}>
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
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama atau username"
                style={{
                  ...getFieldStyle("keyword"),
                  paddingLeft: "40px",
                }}
                {...getFieldHandlers("keyword")}
              />
            </div>
            <Tombol
              label="+ Tambah Akun"
              onClick={() => {
                setTambahForm(initialTambahForm);
                setTambahErrors({});
                setIsTambahOpen(true);
              }}
            />
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          <MetricCard
            label="Total Akun"
            nilai={String(snapshot.daftarAkun?.length ?? 0)}
            ikon={<IkonUser />}
            style={{ animationDelay: "0ms" }}
          />
          {roleOptions.map((role, idx) => (
            <MetricCard
              key={role}
              label={role}
              nilai={String(statsByRole[role] ?? 0)}
              style={{ animationDelay: `${(idx + 1) * 40}ms` }}
            />
          ))}
        </div>

        <Card style={{ animationDelay: "160ms" }}>
          <SectionHeader>
            Daftar Akun — Menampilkan {tableRows.length} dari {snapshot.daftarAkun?.length ?? 0} akun
          </SectionHeader>

          {tableRows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "nomorId", label: "ID" },
                { key: "nama", label: "Nama" },
                { key: "username", label: "Username" },
                { key: "role", label: "Role" },
                { key: "akun_saya", label: "" },
              ]}
              data={tableRows}
              aksi={(baris) => {
                const item = filteredAkun.find((a) => a.id === baris.id);
                return (
                  <AksiTabelButtons
                    onEdit={() => openEditModal(item)}
                    onResetPassword={() => openResetModal(item)}
                    onDelete={() => setDeleteTarget(item)}
                    isCurrentUser={item.id === currentUserId}
                  />
                );
              }}
            />
          ) : (
            <EmptyState
              pesan={
                keyword
                  ? "Tidak ada akun yang cocok dengan kata kunci pencarian."
                  : "Belum ada akun terdaftar."
              }
            />
          )}
        </Card>
      </div>

      {isTambahOpen ? (
        <Modal
          judul="Tambah Akun Baru"
          onTutup={() => setIsTambahOpen(false)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Nama Lengkap</span>
                <input
                  type="text"
                  value={tambahForm.nama}
                  onChange={(e) => handleTambahChange("nama", e.target.value)}
                  placeholder="Nama lengkap pengguna"
                  style={getFieldStyle("tambahNama")}
                  {...getFieldHandlers("tambahNama")}
                />
                {tambahErrors.nama ? <p style={errorStyle}>{tambahErrors.nama}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Username</span>
                <input
                  type="text"
                  value={tambahForm.username}
                  onChange={(e) => handleTambahChange("username", e.target.value)}
                  placeholder="Nama pengguna untuk login"
                  style={getFieldStyle("tambahUsername")}
                  {...getFieldHandlers("tambahUsername")}
                />
                {tambahErrors.username ? <p style={errorStyle}>{tambahErrors.username}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Password</span>
                <input
                  type="password"
                  value={tambahForm.password}
                  onChange={(e) => handleTambahChange("password", e.target.value)}
                  placeholder="Minimal 6 karakter"
                  style={getFieldStyle("tambahPassword")}
                  {...getFieldHandlers("tambahPassword")}
                />
                {tambahErrors.password ? <p style={errorStyle}>{tambahErrors.password}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Role</span>
                <select
                  className="field-select"
                  value={tambahForm.role}
                  onChange={(e) => handleTambahChange("role", e.target.value)}
                  style={getFieldStyle("tambahRole")}
                  {...getFieldHandlers("tambahRole")}
                >
                  <option value="">Pilih role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {tambahErrors.role ? <p style={errorStyle}>{tambahErrors.role}</p> : null}
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Batal" variant="sekunder" onClick={() => setIsTambahOpen(false)} />
                <Tombol label={isSavingTambah ? "Menyimpan..." : "Simpan Akun"} onClick={saveTambah} disabled={isSavingTambah} />
              </div>
            </div>
          }
        />
      ) : null}

      {isEditOpen ? (
        <Modal
          judul="Edit Akun"
          onTutup={() => setIsEditOpen(false)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Username <strong style={{ color: "var(--color-text-secondary)" }}>{filteredAkun.find((a) => a.id === editForm.id)?.username}</strong> tidak dapat diubah.
              </p>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Nama Lengkap</span>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => handleEditChange("nama", e.target.value)}
                  style={getFieldStyle("editNama")}
                  {...getFieldHandlers("editNama")}
                />
                {editErrors.nama ? <p style={errorStyle}>{editErrors.nama}</p> : null}
              </label>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Role</span>
                <select
                  className="field-select"
                  value={editForm.role}
                  onChange={(e) => handleEditChange("role", e.target.value)}
                  style={getFieldStyle("editRole")}
                  {...getFieldHandlers("editRole")}
                >
                  <option value="">Pilih role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {editErrors.role ? <p style={errorStyle}>{editErrors.role}</p> : null}
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Batal" variant="sekunder" onClick={() => setIsEditOpen(false)} />
                <Tombol label={isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"} onClick={saveEdit} disabled={isSavingEdit} />
              </div>
            </div>
          }
        />
      ) : null}

      {deleteTarget ? (
        <Modal
          judul="Hapus Akun"
          onTutup={() => setDeleteTarget(null)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Akun{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{deleteTarget.nama}</strong>
                {" "}({deleteTarget.username}) akan dihapus secara permanen. Data aksi login dan aktivitas yang tercatat tetap tersimpan di log.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Batal" variant="sekunder" onClick={() => setDeleteTarget(null)} />
                <Tombol
                  label={isDeleting ? "Menghapus..." : "Ya, Hapus Akun"}
                  variant="bahaya"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                />
              </div>
            </div>
          }
        />
      ) : null}

      {resetTarget ? (
        <Modal
          judul="Reset Kata Sandi"
          onTutup={() => setResetTarget(null)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Setel kata sandi baru untuk akun{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{resetTarget.nama}</strong>
                {" "}({resetTarget.username}). Pengguna dapat langsung masuk dengan kata sandi baru ini.
              </p>

              <label style={labelStyle}>
                <span style={fieldLabelTextStyle}>Kata Sandi Baru</span>
                <input
                  type={showResetPassword ? "text" : "password"}
                  value={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.value);
                    if (resetError) setResetError("");
                  }}
                  placeholder="Minimal 6 karakter"
                  style={getFieldStyle("resetPassword")}
                  {...getFieldHandlers("resetPassword")}
                />
                {resetError ? <p style={errorStyle}>{resetError}</p> : null}
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={showResetPassword}
                  onChange={(e) => setShowResetPassword(e.target.checked)}
                  style={{ accentColor: "var(--color-primary)" }}
                />
                Tampilkan kata sandi
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Batal" variant="sekunder" onClick={() => setResetTarget(null)} />
                <Tombol
                  label={isResetting ? "Menyimpan..." : "Reset Kata Sandi"}
                  onClick={confirmResetPassword}
                  disabled={isResetting}
                />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default ManajemenAkun;
