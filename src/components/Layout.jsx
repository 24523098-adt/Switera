import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import Modal from "./Modal";
import Tombol from "./Tombol";
import CommandPalette from "./CommandPalette";
import store from "../store";
import { menuByRole, roleOptions } from "../utils/navigation";
import { formatWaktuRelatif } from "../utils/waktu";
import useRipple, { RippleSpans } from "../hooks/useRipple";

const HEADER_HEIGHT = "64px";
const SIDEBAR_WIDTH = "280px";

// Material Symbols per tipe notifikasi + warna teks/bg (design system Catalyst).
const notifStyle = {
  info: { ikon: "info", warna: "var(--color-secondary)", bg: "var(--color-info-bg)" },
  warning: { ikon: "warning", warna: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  success: { ikon: "check_circle", warna: "var(--color-success-text)", bg: "var(--color-success-bg)" },
};

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

  const notifikasiList = useMemo(
    () =>
      [...(snapshot.notifikasi ?? [])].sort(
        (first, second) => new Date(second.waktu) - new Date(first.waktu)
      ),
    [snapshot.notifikasi]
  );
  const unreadCount = notifikasiList.filter((item) => !item.dibaca).length;

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
          borderRight: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
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
          <Ikon name="eco" size={36} fill style={{ color: "var(--color-primary)" }} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--text-xl)",
                color: "var(--color-primary)",
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-on-surface-variant)" }}>
              Logistik Sawit
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
            borderTop: "1px solid var(--color-border)",
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
              backgroundColor: "var(--color-surface-container)",
              color: "var(--color-primary)",
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
              width: "34px",
              height: "34px",
              flexShrink: 0,
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-on-surface-variant)",
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
          backgroundColor: "var(--color-elevated-glass)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
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
              width: "36px",
              height: "36px",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              color: "var(--color-on-surface-variant)",
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
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-surface-container-low)",
              color: "var(--color-on-surface-variant)",
              padding: "7px 12px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              width: "220px",
            }}
          >
            <Ikon name="search" size={16} />
            <span style={{ flex: 1, textAlign: "left" }}>Cari...</span>
            <span
              style={{
                fontSize: "var(--text-2xs)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xs)",
                padding: "1px 5px",
                color: "var(--color-on-surface-variant)",
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
                    minWidth: "14px",
                    height: "14px",
                    padding: "0 3px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--color-error)",
                    color: "#fff",
                    fontSize: "0.625rem",
                    fontWeight: "var(--font-weight-semibold)",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid var(--color-surface)",
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
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "360px",
                  maxHeight: "400px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xl)",
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
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-on-surface)",
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
                      color: unreadCount === 0 ? "var(--color-outline)" : "var(--color-primary)",
                      cursor: unreadCount === 0 ? "default" : "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      padding: "4px 6px",
                      borderRadius: "var(--radius-sm)",
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
                            borderBottom: "1px solid var(--color-border)",
                            backgroundColor: item.dibaca ? "transparent" : "var(--color-surface-container-low)",
                            padding: "12px 16px",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            transition: "background-color var(--transition-fast)",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: "32px",
                              height: "32px",
                              flexShrink: 0,
                              borderRadius: "var(--radius-full)",
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
                backgroundColor: "var(--color-surface-container-low)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                padding: "4px 6px",
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
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-bold)",
                  flexShrink: 0,
                }}
              >
                {getInisial(snapshot.userAktif?.nama)}
              </span>
              <Ikon name="expand_more" size={18} style={{ color: "var(--color-on-surface-variant)" }} />
            </button>

            {isAvatarOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "200px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "var(--shadow-lg)",
                  overflow: "hidden",
                  zIndex: "var(--z-dropdown)",
                  animation: "scaleIn 150ms var(--ease-out) both",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--color-border)",
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
