import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import IkonDaun from "./IkonDaun";
import Modal from "./Modal";
import Tombol from "./Tombol";
import CommandPalette from "./CommandPalette";
import store from "../store";
import { menuByRole, roleOptions } from "../utils/navigation";
import { formatWaktuRelatif } from "../utils/waktu";
import useRipple, { RippleSpans } from "../hooks/useRipple";

const HEADER_HEIGHT = "52px";
const SIDEBAR_WIDTH = "220px";

const tipeColor = {
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  success: "var(--color-success)",
};

const dropdownItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  border: "none",
  background: "transparent",
  color: "var(--color-text-secondary)",
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

const iconStyle = {
  width: "16px",
  height: "16px",
  flexShrink: 0,
};

function IkonBel({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0v4.5l1.5 2.5a1 1 0 0 1-.86 1.5H5.36a1 1 0 0 1-.86-1.5L6 13.5V9Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19a2.5 2.5 0 0 0 5 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IkonHamburger({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6H20M4 12H20M4 18H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonSearch({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <path d="M20 20L16.5 16.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonMatahari({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 2V5M12 19V22M4.2 4.2L6.3 6.3M17.7 17.7L19.8 19.8M2 12H5M19 12H22M4.2 19.8L6.3 17.7M17.7 6.3L19.8 4.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IkonBulan({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IkonMenu({ type, color }) {
  switch (type) {
    case "input":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path
            d="M12 5V19M5 12H19"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <ellipse cx="12" cy="6" rx="7" ry="3" stroke={color} strokeWidth="1.5" />
          <path
            d="M5 6V17C5 18.6569 8.13401 20 12 20C15.866 20 19 18.6569 19 17V6"
            stroke={color}
            strokeWidth="1.5"
          />
          <path
            d="M5 11C5 12.6569 8.13401 14 12 14C15.866 14 19 12.6569 19 11"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path d="M5 19H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 16V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 16V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 16V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "decision":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path d="M12 4V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M12 8H18L16 11L18 14H12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 15H6L8 18L6 21"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "truck":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path d="M3 7H14V16H3V7Z" stroke={color} strokeWidth="1.5" />
          <path d="M14 10H18L21 13V16H14V10Z" stroke={color} strokeWidth="1.5" />
          <circle cx="7.5" cy="17.5" r="1.5" fill={color} />
          <circle cx="17.5" cy="17.5" r="1.5" fill={color} />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path
            d="M7 4H14L18 8V20H7V4Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 4V8H18" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 12H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 16H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path d="M4 4H10V10H4V4Z" stroke={color} strokeWidth="1.5" />
          <path d="M14 4H20V10H14V4Z" stroke={color} strokeWidth="1.5" />
          <path d="M4 14H10V20H4V14Z" stroke={color} strokeWidth="1.5" />
          <path d="M14 14H20V20H14V14Z" stroke={color} strokeWidth="1.5" />
        </svg>
      );
  }
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

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
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

  const confirmReset = () => {
    store.reset();
    setIsResetOpen(false);
  };

  const handleLogout = () => {
    store.logout();
  };

  return (
    <>
      <header
        className="app-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          backgroundColor: "var(--color-elevated-glass)",
          backdropFilter: "blur(14px) saturate(160%)",
          WebkitBackdropFilter: "blur(14px) saturate(160%)",
          borderBottom: "1px solid var(--color-border-mid)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
          zIndex: "var(--z-sticky)",
          padding: "0 var(--space-6)",
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
              width: "32px",
              height: "32px",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            <IkonHamburger />
          </button>

          <a
            href="/"
            className="app-logo-link"
            onClick={(event) => {
              event.preventDefault();
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              minWidth: 0,
            }}
          >
            <IkonDaun />
            <span
              style={{
                fontSize: "var(--text-md)",
                fontWeight: "var(--font-weight-bold)",
                letterSpacing: "-0.03em",
                color: "var(--color-text-primary)",
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          </a>
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
              border: "1px solid var(--color-border-mid)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-surface-2)",
              color: "var(--color-text-muted)",
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              width: "200px",
              transition:
                "border-color var(--transition-fast), color var(--transition-fast), width var(--transition-slow)",
            }}
          >
            <IkonSearch />
            <span style={{ flex: 1, textAlign: "left" }}>Cari...</span>
            <span
              style={{
                fontSize: "var(--text-2xs)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xs)",
                padding: "1px 5px",
                color: "var(--color-text-muted)",
              }}
            >
              ⌘K
            </span>
          </button>

          <button
            type="button"
            aria-label="Ganti tema"
            className="app-header-icon-btn icon-tema"
            onClick={() => store.toggleTema()}
            onMouseDown={(event) => onRippleDown(event, "tema")}
          >
            {snapshot.tema === "dark" ? <IkonMatahari /> : <IkonBulan />}
            <RippleSpans
              ripples={ripples}
              removeRipple={removeRipple}
              groupId="tema"
            />
          </button>

          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Notifikasi"
              className={`app-header-icon-btn${isNotifOpen ? " is-active" : ""}`}
              onClick={() => setIsNotifOpen((value) => !value)}
              onMouseDown={(event) => onRippleDown(event, "notifikasi")}
            >
              <IkonBel />
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
                    backgroundColor: "var(--color-danger)",
                    color: "#fff",
                    fontSize: "0.625rem",
                    fontWeight: "var(--font-weight-semibold)",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid var(--color-bg)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
              <RippleSpans
                ripples={ripples}
                removeRipple={removeRipple}
                groupId="notifikasi"
              />
            </button>

            {isNotifOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "340px",
                  maxHeight: "400px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-mid)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  overflow: "hidden",
                  zIndex: "var(--z-dropdown)",
                  animation: "fadeInUp 150ms var(--ease-smooth) both",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
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
                      color:
                        unreadCount === 0
                          ? "var(--color-text-muted)"
                          : "var(--color-primary)",
                      cursor: unreadCount === 0 ? "default" : "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      padding: "4px 6px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    Tandai semua dibaca
                    <RippleSpans
                      ripples={ripples}
                      removeRipple={removeRipple}
                      groupId="tandai-semua"
                    />
                  </button>
                </div>

                <div style={{ overflowY: "auto", flex: 1 }}>
                  {notifikasiList.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Tidak ada notifikasi.
                    </p>
                  ) : (
                    notifikasiList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="app-press"
                        onClick={() => store.tandaiDibaca(item.id)}
                        style={{
                          display: "flex",
                          width: "100%",
                          textAlign: "left",
                          gap: "0.6rem",
                          border: "none",
                          borderLeft: `2px solid ${tipeColor[item.tipe] ?? "var(--color-border)"}`,
                          borderBottom: "1px solid var(--color-border)",
                          backgroundColor: item.dibaca
                            ? "transparent"
                            : "var(--color-primary-subtle)",
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "background-color var(--transition-fast)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            marginTop: "6px",
                            width: "6px",
                            height: "6px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: item.dibaca
                              ? "transparent"
                              : "var(--color-info)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.2rem",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "var(--font-weight-semibold)",
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {item.judul}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-secondary)",
                              lineHeight: 1.4,
                            }}
                          >
                            {item.pesan}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {formatWaktuRelatif(item.waktu)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={avatarRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="app-press"
              onClick={() => setIsAvatarOpen((value) => !value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                padding: "5px 12px 5px 6px",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--color-primary-subtle)",
                  color: "var(--color-primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  flexShrink: 0,
                }}
              >
                {getInisial(snapshot.userAktif?.nama)}
              </span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {snapshot.userAktif?.nama ?? "Pengguna"}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {roleAktif}
                </span>
              </span>
            </button>

            {isAvatarOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "180px",
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border-mid)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  overflow: "hidden",
                  zIndex: "var(--z-dropdown)",
                  animation: "fadeInUp 150ms var(--ease-smooth) both",
                }}
              >
                <button
                  type="button"
                  className="app-dropdown-item app-press"
                  onClick={() => {
                    setIsResetOpen(true);
                    setIsAvatarOpen(false);
                  }}
                  style={dropdownItemStyle}
                >
                  Reset Data
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="app-logout-btn app-press"
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "5px 10px",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-body)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
            }}
          >
            Keluar
          </button>
        </div>
      </header>

      <div
        className={`app-sidebar-backdrop${isSidebarOpen ? " is-open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          top: HEADER_HEIGHT,
          backgroundColor: "var(--color-overlay)",
          zIndex: "calc(var(--z-sticky) - 1)",
        }}
      />

      <aside
        className={`app-sidebar${isSidebarOpen ? " is-open" : ""}`}
        style={{
          position: "fixed",
          top: HEADER_HEIGHT,
          left: 0,
          width: SIDEBAR_WIDTH,
          height: `calc(100vh - ${HEADER_HEIGHT})`,
          backgroundColor: "var(--color-elevated)",
          borderRight: "1px solid var(--color-border-mid)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          zIndex: "var(--z-sticky)",
        }}
      >
        <div
          style={{
            padding: "var(--space-4) var(--space-3) var(--space-2)",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-disabled)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          Menu
        </div>
        <div
          style={{
            padding: "0 var(--space-3) var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
          }}
        >
        {menuItems.map((item) => {
          const active = item.key === menuAktif;

          return (
            <button
              key={item.key}
              type="button"
              className={`app-sidebar-menu-item${active ? " is-active" : ""}`}
              onClick={() => handleMenuChange(item.key)}
              onMouseDown={(event) => onRippleDown(event, item.key)}
            >
              <IkonMenu type={item.icon} color={active ? "var(--color-primary)" : "currentColor"} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              <RippleSpans
                ripples={ripples}
                removeRipple={removeRipple}
                groupId={item.key}
              />
            </button>
          );
        })}
        </div>
      </aside>

      <main
        key={menuAktif}
        className="content-main app-main"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          marginTop: HEADER_HEIGHT,
          padding: "var(--space-8)",
          minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
          animation: "pageEnter var(--transition-page) both",
        }}
      >
        {children ?? (
          <Card>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary)",
                fontSize: "0.98rem",
              }}
            >
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
                Semua perubahan pada data demo akan dikembalikan ke kondisi
                awal. Tindakan ini cocok digunakan saat ingin mengulang simulasi.
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
                  onClick={() => setIsResetOpen(false)}
                />
                <Tombol
                  label="Ya, Reset"
                  variant="bahaya"
                  onClick={confirmReset}
                />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default Layout;
