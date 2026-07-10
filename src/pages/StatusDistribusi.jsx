import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import store from "../store";
import { getLocalDateKey, parseDate } from "../utils/distribusi";
import { formatDate, formatTonase } from "../utils/format";

const HARI_MS = 24 * 60 * 60 * 1000;

const statusOptions = ["menunggu", "dalam-pengiriman", "selesai"];
const statusLabels = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};

function StatusDistribusi({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [selectedKeputusan, setSelectedKeputusan] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("menunggu");
  const [armada, setArmada] = useState("");
  const [eta, setEta] = useState("");
  const [isSelectFocused, setIsSelectFocused] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  const errorStyle = { margin: "6px 0 0", color: "var(--color-danger)", fontSize: "0.85rem", lineHeight: 1.5 };

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    store.loadKeputusan();
    store.loadRiwayatKeputusan();
  }, []);

  const keputusanAktif = useMemo(
    () =>
      [...(snapshot.keputusan ?? [])].sort(
        (first, second) =>
          parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
      ),
    [snapshot.keputusan]
  );

  const ringkasanStatus = useMemo(() => {
    const counts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
    keputusanAktif.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });
    return counts;
  }, [keputusanAktif]);

  const hariIni = parseDate(getLocalDateKey());

  // Sorotan otomatis (MIS): ETA terlewat dan lebih dari 7 hari tanpa update.
  const isEtaTerlewat = (item) =>
    item.status === "dalam-pengiriman" && item.eta && parseDate(item.eta) < hariIni;
  const isStale = (item) => {
    if (item.status === "selesai") return false;
    const waktu = item.status === "dalam-pengiriman" ? item.waktu_dalam_pengiriman : item.waktu_menunggu;
    if (!waktu) return false;
    return (Date.now() - new Date(waktu).getTime()) / HARI_MS > 7;
  };

  const ringkasanOperasional = useMemo(() => {
    const todayKey = getLocalDateKey();
    const totalAktif = keputusanAktif.filter((item) => item.status !== "selesai").length;
    const selesaiHariIni = keputusanAktif.filter(
      (item) => item.status === "selesai" && item.waktu_selesai && getLocalDateKey(new Date(item.waktu_selesai)) === todayKey
    ).length;
    const etaTerlewat = keputusanAktif.filter((item) => isEtaTerlewat(item)).length;
    return { totalAktif, selesaiHariIni, etaTerlewat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keputusanAktif]);

  const rows = keputusanAktif.map((item) => ({
    id: item.id,
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    armada: item.armada ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}` : "-",
    tanggalKeputusan: formatDate(item.tanggal_keputusan),
    status: <Badge status={item.status} />,
  }));

  const openStatusModal = (item) => {
    setModalErrors({});
    setSelectedKeputusan(item);
    setSelectedStatus(item.status);
    setArmada(item.armada ?? "");
    setEta(item.eta ?? "");
  };

  const validateModalForm = () => {
    const nextErrors = {};

    if (selectedStatus === "dalam-pengiriman") {
      if (!armada.trim()) {
        nextErrors.armada = "Armada / Sopir wajib diisi saat status Dalam Pengiriman.";
      }
      if (!eta) {
        nextErrors.eta = "Estimasi Tiba (ETA) wajib dipilih saat status Dalam Pengiriman.";
      }
    }

    return nextErrors;
  };

  const saveStatus = async () => {
    if (!selectedKeputusan) {
      return;
    }

    const nextErrors = validateModalForm();
    setModalErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const updates = { status: selectedStatus };
    if (selectedStatus === "dalam-pengiriman") {
      updates.armada = armada.trim();
      updates.eta = eta;
    }

    try {
      await store.updateKeputusan(selectedKeputusan.id, updates);
      // Success UI strictly after the await (LOGIC-02): on a 409 conflict
      // the await throws before reaching here, so the modal never closes
      // on a false success — the catch below leaves it open instead.
      setModalErrors({});
      setSelectedKeputusan(null);
    } catch {
      // runMutation already Toasted the server's conflict/error message
      // (e.g. the LOGIC-02 409 "Status keputusan sudah diperbarui oleh
      // proses lain..."); keep the modal open so the user sees it and can
      // retry against the now-current server state.
    }
  };

  return (
    <>
      <PageHeader
        judul="Status Distribusi Aktif"
        deskripsi="Pantau dan perbarui progres distribusi tanpa perlu memuat ulang halaman."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Ringkasan operasional (MIS) di atas kanban. */}
        <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
          {[
            { label: "Total Aktif", nilai: ringkasanOperasional.totalAktif, warna: "var(--color-on-surface)", bg: "var(--color-surface)" },
            { label: "Selesai Hari Ini", nilai: ringkasanOperasional.selesaiHariIni, warna: "var(--color-success-text)", bg: "var(--color-surface)" },
            { label: "ETA Terlewat", nilai: ringkasanOperasional.etaTerlewat, warna: ringkasanOperasional.etaTerlewat > 0 ? "var(--color-danger-text)" : "var(--color-on-surface)", bg: ringkasanOperasional.etaTerlewat > 0 ? "var(--color-danger-bg)" : "var(--color-surface)" },
          ].map((box) => (
            <div key={box.label} style={{ border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)", backgroundColor: box.bg, boxShadow: "var(--shadow-sm)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>{box.label}</p>
              <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: box.warna }}>{box.nilai}</p>
            </div>
          ))}
        </div>

        <div
          className="stagger-children app-grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            label="Menunggu"
            nilai={String(ringkasanStatus.menunggu)}
            accent="warning"
          />
          <MetricCard
            label="Dalam Pengiriman"
            nilai={String(ringkasanStatus["dalam-pengiriman"])}
            accent="info"
          />
          <MetricCard
            label="Selesai"
            nilai={String(ringkasanStatus.selesai)}
            accent="success"
          />
        </div>

        {rows.length > 0 ? (
          /* Papan kanban 3 kolom ala Stitch — satu kolom per status. */
          <div
            className="app-grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
              gap: "var(--space-4)",
              alignItems: "start",
            }}
          >
            {statusOptions.map((statusKey) => {
              const kolomWarna = {
                menunggu: { dot: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
                "dalam-pengiriman": { dot: "var(--color-info-text)", bg: "var(--color-info-bg)" },
                selesai: { dot: "var(--color-success-text)", bg: "var(--color-success-bg)" },
              }[statusKey];
              const itemsKolom = keputusanAktif.filter((item) => item.status === statusKey);

              return (
                <div
                  key={statusKey}
                  style={{
                    backgroundColor: "var(--color-surface-container-low)",
                    border: "2px solid #000000",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                    padding: "var(--space-3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    minHeight: "180px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px" }}>
                    <span
                      className={statusKey !== "selesai" ? "animate-pulse-dot" : undefined}
                      style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: kolomWarna.dot }}
                    />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                      {statusLabels[statusKey]}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", backgroundColor: kolomWarna.bg, color: kolomWarna.dot, border: "2px solid #000000", borderRadius: "var(--radius-full)", padding: "2px 8px" }}>
                      {itemsKolom.length}
                    </span>
                  </div>

                  {itemsKolom.length === 0 ? (
                    <p style={{ margin: 0, padding: "16px 8px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-disabled)" }}>
                      Tidak ada kiriman.
                    </p>
                  ) : (
                    itemsKolom.map((item) => (
                      <div
                        key={item.id}
                        className="app-card app-card-hoverable"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          borderRadius: "var(--radius-lg)",
                          border: `2px solid ${isEtaTerlewat(item) ? "var(--color-danger)" : isStale(item) ? "var(--color-warning-text)" : "#000000"}`,
                          borderLeft: `8px solid ${isEtaTerlewat(item) ? "var(--color-danger)" : isStale(item) ? "var(--color-warning-text)" : "#000000"}`,
                          padding: "var(--space-4)",
                          boxShadow: "var(--shadow-sm)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <strong style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", color: "var(--color-on-surface)" }}>
                            {item.kota_tujuan}
                          </strong>
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
                            {formatTonase(item.volume_tbs)}
                          </span>
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span>{item.armada ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}` : "Armada belum ditetapkan"}</span>
                          <span>Keputusan: {formatDate(item.tanggal_keputusan)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openStatusModal(item)}
                          style={{
                            marginTop: "4px",
                            alignSelf: "flex-start",
                            border: "2px solid #000000",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--color-lime)",
                            color: "#000000",
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-weight-bold)",
                            padding: "6px 14px",
                            boxShadow: "var(--shadow-sm)",
                            cursor: "pointer",
                            transition: "background-color var(--transition-fast), border-color var(--transition-fast)",
                          }}
                        >
                          Perbarui Status
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card style={{ animationDelay: "80ms" }}>
            <EmptyState pesan="Belum ada distribusi aktif untuk dipantau saat ini." />
          </Card>
        )}
      </div>

      {selectedKeputusan ? (
        <Modal
          judul="Perbarui status distribusi"
          onTutup={() => setSelectedKeputusan(null)}
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
                Pilih status terbaru untuk distribusi menuju{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {selectedKeputusan.kota_tujuan}
                </strong>
                .
              </p>
              <select
                aria-label="Pilih status terbaru"
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);
                  setModalErrors({});
                }}
                onFocus={() => setIsSelectFocused(true)}
                onBlur={() => setIsSelectFocused(false)}
                style={{
                  width: "100%",
                  border: "2px solid #000000",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: isSelectFocused ? "var(--color-pastel)" : "#ffffff",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  padding: "10px 14px",
                  outline: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "background-color var(--transition-input)",
                }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              {selectedStatus === "dalam-pengiriman" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Armada / Sopir
                    </span>
                    <input
                      type="text"
                      value={armada}
                      onChange={(event) => {
                        setArmada(event.target.value);
                        setModalErrors({ ...modalErrors, armada: undefined });
                      }}
                      placeholder="Contoh: Truk B-1234-XY / Andi"
                      style={{
                        width: "100%",
                        border: modalErrors.armada
                          ? "2px solid var(--color-danger)"
                          : "2px solid #000000",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "#ffffff",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "10px 14px",
                        outline: "none",
                        boxShadow: "var(--shadow-sm)",
                        boxSizing: "border-box",
                      }}
                    />
                    {modalErrors.armada ? <p style={errorStyle}>{modalErrors.armada}</p> : null}
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Estimasi Tiba (ETA)
                    </span>
                    <input
                      type="date"
                      value={eta}
                      onChange={(event) => {
                        setEta(event.target.value);
                        setModalErrors({ ...modalErrors, eta: undefined });
                      }}
                      style={{
                        width: "100%",
                        border: modalErrors.eta
                          ? "2px solid var(--color-danger)"
                          : "2px solid #000000",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "#ffffff",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "10px 14px",
                        outline: "none",
                        boxShadow: "var(--shadow-sm)",
                        boxSizing: "border-box",
                      }}
                    />
                    {modalErrors.eta ? <p style={errorStyle}>{modalErrors.eta}</p> : null}
                  </label>
                </div>
              ) : null}

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
                  onClick={() => setSelectedKeputusan(null)}
                />
                <Tombol label="Simpan Status" onClick={saveStatus} />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default StatusDistribusi;
