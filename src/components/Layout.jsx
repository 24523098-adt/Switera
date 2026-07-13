import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import Modal from "./Modal";
import Tombol from "./Tombol";
import CommandPalette from "./CommandPalette";
import store from "../store";
import { getMisTindakanMendesak } from "../api/apiClient";
import { menuByRole, roleOptions } from "../utils/navigation";
import { formatWaktuRelatif } from "../utils/waktu";
import useRipple, { RippleSpans } from "../hooks/useRipple";

const HEADER_HEIGHT = "64px";
const SIDEBAR_WIDTH = "280px";

// Material Symbols per tipe notifikasi dan warna teks/bg (Neo-Brutalism).
const notifStyle = {
  kritis: { ikon: "error", warna: "var(--color-danger-text)", bg: "var(--color-danger-bg)" },
  perhatian: { ikon: "warning", warna: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  info: { ikon: "info", warna: "var(--color-info-text)", bg: "var(--color-info-bg)" },
  warning: { ikon: "warning", warna: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  success: { ikon: "check_circle", warna: "var(--color-success-text)", bg: "var(--color-success-bg)" },
};

// Peringkat keparahan untuk mengurutkan notifikasi: kritis di atas, lalu
// perhatian, lalu informasi (info/success).
const NOTIF_RANK = { kritis: 0, perhatian: 1, warning: 1, info: 2, success: 2 };

// Nama ikon Material Symbols per `icon` pada menuByRole (navigation.js).
const menuIconByType = {
  dashboard: "dashboard",
  input: "add_circle",
  database: "database",
  city: "location_city",
  user: "manage_accounts",
  report: "description",
  chart: "trending_up",
  decision: "gavel",
  truck: "local_shipping",
};

const dropdownItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  border: "none",
  background: "transparent",
  color: "var(--color-on-surface-variant)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  transition: "background-color var(--transition-fast)",
};

const getInisial = (nama) => {
  if (!nama) {
    return "?";
  }

  const bagian = nama.trim().split(/\s+/);
  const huruf = bagian.slice(0, 2).map((kata) => kata[0]?.toUpperCase() ?? "");
  return huruf.join("") || "?";
};

// Ikon Material Symbols — pengganti seluruh SVG inline (migrasi penuh).
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

function Layout({ children, title = "Switera", menuAktif: menuAktifProp, onMenuChange }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notifRef = useRef(null);
  const avatarRef = useRef(null);
  const { ripples, onMouseDown: onRippleDown, removeRipple } = useRipple();
  const roleAktif = roleOptions.includes(snapshot.roleAktif)
    ? snapshot.roleAktif
    : "Admin";

  const menuItems = useMemo(
    () => menuByRole[roleAktif] ?? menuByRole.Admin,
    [roleAktif]
  );

  const menuAktif = menuItems.some((item) => item.key === menuAktifProp)
    ? menuAktifProp
    : menuItems[0]?.key ?? "";

  const judulHalaman = menuItems.find((item) => item.key === menuAktif)?.label ?? title;

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  // Layout selalu mount untuk setiap halaman terautentikasi — muat notifikasi
  // saat mount agar badge/dropdown mencerminkan state server.
  useEffect(() => {
    store.loadNotifikasi();
  }, []);

  // Indikator kesehatan sistem MIS di header. Sumbernya /mis/tindakan-mendesak
  // yang khusus Manajer Distribusi, jadi dot hanya diambil dan ditampilkan
  // untuk peran itu; peran lain tidak menampilkan indikator. Hijau bila tidak
  // ada kondisi, kuning bila ada perhatian, merah bila ada kondisi kritis.
  const [statusKesehatan, setStatusKesehatan] = useState(null);
  useEffect(() => {
    if (roleAktif !== "Manajer Distribusi") {
      setStatusKesehatan(null);
      return undefined;
    }
    let aktif = true;
    const muat = async () => {
      try {
        const tindakan = await getMisTindakanMendesak();
        if (!aktif) return;
        if (tindakan.some((item) => item.tingkat === "kritis")) setStatusKesehatan("kritis");
        else if (tindakan.some((item) => item.tingkat === "perhatian")) setStatusKesehatan("perhatian");
        else setStatusKesehatan("aman");
      } catch {
        // diamkan; indikator sekadar tidak tampil bila gagal
      }
    };
    muat();
    const id = window.setInterval(muat, 15000);
    return () => {
      aktif = false;
      window.clearInterval(id);
    };
  }, [roleAktif]);

  const warnaKesehatan = {
    aman: "var(--color-status-success)",
    perhatian: "var(--color-status-warning)",
    kritis: "var(--color-status-error)",
  }[statusKesehatan];

  useEffect(() => {
    if (!isNotifOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  useEffect(() => {
    if (!isAvatarOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setIsAvatarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAvatarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dikelompokkan menurut keparahan (kritis di atas, lalu perhatian, lalu
  // informasi), dan di dalam tiap kelompok terbaru dulu.
  const notifikasiList = useMemo(
    () =>
      [...(snapshot.notifikasi ?? [])].sort((first, second) => {
        const rankFirst = NOTIF_RANK[first.tipe] ?? 2;
        const rankSecond = NOTIF_RANK[second.tipe] ?? 2;
        if (rankFirst !== rankSecond) return rankFirst - rankSecond;
        return new Date(second.waktu) - new Date(first.waktu);
      }),
    [snapshot.notifikasi]
  );
  const unreadCount = notifikasiList.filter((item) => !item.dibaca).length;
  // Badge merah hanya untuk notifikasi kritis yang belum dibaca.
  const unreadKritis = notifikasiList.filter((item) => !item.dibaca && item.tipe === "kritis").length;

  const handleMenuChange = (key) => {
    setIsSidebarOpen(false);
    if (onMenuChange) {
      onMenuChange(key);
    }
  };

  const goHome = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const confirmReset = () => {
    // store.reset() adalah async re-hydrate (09-05) — fire-and-forget.
    store.reset();
    setIsResetOpen(false);
  };

  const handleLogout = () => {
    store.logout();
  };

  return (
    <>
      {/* ===== Sidebar ===== */}
      <aside
        className={`app-sidebar${isSidebarOpen ? " is-open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: SIDEBAR_WIDTH,
          height: "100vh",
          backgroundColor: "var(--color-surface-container-lowest)",
          borderRight: "2px solid #000000",
          boxShadow: "4px 0px 0px 0px #000000",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-6) var(--space-4)",
          zIndex: "var(--z-sticky)",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          className="app-logo-link"
          onClick={goHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-8)",
            padding: "0 var(--space-2)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "44px",
              height: "44px",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              backgroundColor: "var(--color-lime)",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Ikon name="eco" size={26} fill style={{ color: "#000000" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--text-xl)",
                letterSpacing: "var(--tracking-tight)",
                color: "#000000",
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--color-on-surface-variant)" }}>
              Manajemen Sawit
            </span>
          </span>
        </a>

        {/* Menu */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {menuItems.map((item) => {
            const active = item.key === menuAktif;

            return (
              <button
                key={item.key}
                type="button"
                className={`app-sidebar-menu-item${active ? " is-active" : ""}`}
                onClick={() => handleMenuChange(item.key)}
              >
                <Ikon name={menuIconByType[item.icon] ?? "circle"} size={20} fill={active} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: avatar + nama + role + logout */}
        <div
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-pastel)",
              border: "2px solid #000000",
              color: "#000000",
              display: "grid",
              placeItems: "center",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-bold)",
              flexShrink: 0,
            }}
          >
            {getInisial(snapshot.userAktif?.nama)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, lineHeight: 1.3 }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-on-surface)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {snapshot.userAktif?.nama ?? "Pengguna"}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-primary)" }}>
              {roleAktif}
            </span>
          </span>
          <button
            type="button"
            className="app-logout-btn app-press"
            aria-label="Keluar"
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              flexShrink: 0,
              backgroundColor: "var(--color-surface)",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              boxShadow: "var(--shadow-sm)",
              color: "#000000",
              cursor: "pointer",
            }}
          >
            <Ikon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      <div
        className={`app-sidebar-backdrop${isSidebarOpen ? " is-open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--color-overlay)",
          zIndex: "calc(var(--z-sticky) - 1)",
        }}
      />

      {/* ===== Header ===== */}
      <header
        className="app-header"
        style={{
          position: "fixed",
          top: 0,
          left: SIDEBAR_WIDTH,
          right: 0,
          height: HEADER_HEIGHT,
          backgroundColor: "var(--color-surface-container-lowest)",
          borderBottom: "2px solid #000000",
          boxShadow: "0px 4px 0px 0px #000000",
          zIndex: "calc(var(--z-sticky) - 1)",
          padding: "0 var(--space-8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
          <button
            type="button"
            className="app-sidebar-toggle"
            aria-label="Buka menu"
            onClick={() => setIsSidebarOpen((value) => !value)}
            style={{
              display: "none",
              width: "38px",
              height: "38px",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-sm)",
              color: "#000000",
              cursor: "pointer",
            }}
          >
            <Ikon name="menu" size={20} />
          </button>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-bold)",
              letterSpacing: "var(--tracking-tight)",
              color: "var(--color-on-surface)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {judulHalaman}
          </h1>
          {warnaKesehatan ? (
            <button
              type="button"
              aria-label={`Kesehatan sistem: ${statusKesehatan}`}
              title={`Kesehatan sistem: ${statusKesehatan}. Klik untuk buka dashboard.`}
              onClick={() => handleMenuChange("dashboard")}
              style={{
                flexShrink: 0,
                width: "16px",
                height: "16px",
                padding: 0,
                borderRadius: "var(--radius-full)",
                border: "2px solid #000000",
                backgroundColor: warnaKesehatan,
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
              }}
            />
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button
            type="button"
            className="app-header-search"
            onClick={() => setIsPaletteOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-sm)",
              color: "var(--color-text-secondary)",
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-medium)",
              width: "220px",
            }}
          >
            <Ikon name="search" size={16} style={{ color: "#000000" }} />
            <span style={{ flex: 1, textAlign: "left" }}>Cari...</span>
            <span
              style={{
                fontSize: "var(--text-2xs)",
                border: "1px solid #000000",
                borderRadius: "var(--radius-full)",
                padding: "1px 7px",
                fontWeight: "var(--font-weight-bold)",
                color: "#000000",
                backgroundColor: "var(--color-pastel)",
              }}
            >
              ⌘K
            </span>
          </button>

          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Notifikasi"
              className={`app-header-icon-btn${isNotifOpen ? " is-active" : ""}`}
              onClick={() => setIsNotifOpen((value) => !value)}
              onMouseDown={(event) => onRippleDown(event, "notifikasi")}
            >
              <Ikon name="notifications" size={20} />
              {unreadCount > 0 ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "1px",
                    right: "1px",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 3px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: unreadKritis > 0 ? "var(--color-error)" : "var(--color-lime)",
                    color: unreadKritis > 0 ? "#fff" : "#000000",
                    fontSize: "0.625rem",
                    fontWeight: "var(--font-weight-bold)",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid #000000",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
              <RippleSpans ripples={ripples} removeRipple={removeRipple} groupId="notifikasi" />
            </button>

            {isNotifOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "min(360px, calc(100vw - 24px))",
                  maxHeight: "400px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  border: "2px solid #000000",
                  borderRadius: "var(--radius-2xl)",
                  boxShadow: "var(--shadow-lg)",
                  overflow: "hidden",
                  zIndex: "var(--z-dropdown)",
                  animation: "scaleIn 150ms var(--ease-out) both",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "14px 16px",
                    borderBottom: "2px solid #000000",
                    backgroundColor: "var(--color-lime)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "var(--text-md)",
                      letterSpacing: "var(--tracking-tight)",
                      color: "var(--color-on-primary-container)",
                    }}
                  >
                    Notifikasi
                  </span>
                  <button
                    type="button"
                    className="app-press"
                    onClick={() => store.tandaiSemuaDibaca()}
                    onMouseDown={(event) => onRippleDown(event, "tandai-semua")}
                    disabled={unreadCount === 0}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      border: "none",
                      background: "transparent",
                      color: unreadCount === 0 ? "rgba(20, 31, 0, 0.4)" : "var(--color-on-primary-container)",
                      cursor: unreadCount === 0 ? "default" : "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-bold)",
                      padding: "4px 6px",
                      borderRadius: "var(--radius-full)",
                      textDecoration: unreadCount === 0 ? "none" : "underline",
                    }}
                  >
                    Tandai semua dibaca
                    <RippleSpans ripples={ripples} removeRipple={removeRipple} groupId="tandai-semua" />
                  </button>
                </div>

                <div style={{ overflowY: "auto", flex: 1 }}>
                  {notifikasiList.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "var(--color-outline)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Tidak ada notifikasi.
                    </p>
                  ) : (
                    notifikasiList.map((item) => {
                      const gaya = notifStyle[item.tipe] ?? notifStyle.info;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="app-press"
                          onClick={() => store.tandaiDibaca(item.id)}
                          style={{
                            display: "flex",
                            width: "100%",
                            textAlign: "left",
                            gap: "0.75rem",
                            border: "none",
                            borderBottom: "2px solid #000000",
                            backgroundColor: item.dibaca ? "transparent" : "var(--color-pastel)",
                            padding: "12px 16px",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            transition: "background-color var(--transition-fast)",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: "36px",
                              height: "36px",
                              flexShrink: 0,
                              borderRadius: "var(--radius-full)",
                              border: "2px solid #000000",
                              backgroundColor: gaya.bg,
                              color: gaya.warna,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Ikon name={gaya.ikon} size={18} fill />
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
                            <span
                              style={{
                                fontWeight: "var(--font-weight-semibold)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-on-surface)",
                              }}
                            >
                              {item.judul}
                            </span>
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-on-surface-variant)",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.pesan}
                            </span>
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-outline)" }}>
                              {formatWaktuRelatif(item.waktu)}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={avatarRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="app-press"
              aria-label="Menu akun"
              onClick={() => setIsAvatarOpen((value) => !value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--color-surface)",
                border: "2px solid #000000",
                borderRadius: "var(--radius-full)",
                boxShadow: "var(--shadow-sm)",
                padding: "4px 8px 4px 4px",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--color-lime)",
                  border: "2px solid #000000",
                  color: "#000000",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-bold)",
                  flexShrink: 0,
                }}
              >
                {getInisial(snapshot.userAktif?.nama)}
              </span>
              <Ikon name="expand_more" size={18} style={{ color: "#000000" }} />
            </button>

            {isAvatarOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "min(210px, calc(100vw - 24px))",
                  backgroundColor: "var(--color-surface)",
                  border: "2px solid #000000",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "var(--shadow-md)",
                  overflow: "hidden",
                  zIndex: "var(--z-dropdown)",
                  animation: "scaleIn 150ms var(--ease-out) both",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "2px solid #000000",
                    backgroundColor: "var(--color-pastel-card)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                    {snapshot.userAktif?.nama ?? "Pengguna"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-primary)" }}>
                    {roleAktif}
                  </p>
                </div>
                <button
                  type="button"
                  className="app-dropdown-item app-press"
                  onClick={() => {
                    setIsResetOpen(true);
                    setIsAvatarOpen(false);
                  }}
                  style={{ ...dropdownItemStyle, display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Ikon name="restart_alt" size={18} />
                  Reset Data
                </button>
                <button
                  type="button"
                  className="app-dropdown-item app-press"
                  onClick={handleLogout}
                  style={{ ...dropdownItemStyle, display: "flex", alignItems: "center", gap: "10px", color: "var(--color-error)" }}
                >
                  <Ikon name="logout" size={18} />
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main
        key={menuAktif}
        className="content-main app-main"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: HEADER_HEIGHT,
          padding: "var(--space-8)",
          minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
          animation: "fadeInUp var(--transition-page) both",
        }}
      >
        {children ?? (
          <Card>
            <p style={{ margin: 0, color: "var(--color-on-surface-variant)", fontSize: "0.98rem" }}>
              Konten utama akan ditampilkan di area ini.
            </p>
          </Card>
        )}
      </main>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        menuItems={menuItems}
        onNavigate={handleMenuChange}
      />

      {isResetOpen ? (
        <Modal
          judul="Reset data demo"
          onTutup={() => setIsResetOpen(false)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
                Semua perubahan pada data demo akan dikembalikan ke kondisi awal.
                Tindakan ini cocok digunakan saat ingin mengulang simulasi.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Batal" variant="sekunder" onClick={() => setIsResetOpen(false)} />
                <Tombol label="Ya, Reset" variant="bahaya" onClick={confirmReset} />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default Layout;
