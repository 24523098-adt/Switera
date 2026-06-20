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
import { parseDate } from "../utils/distribusi";
import { formatDate, formatTonase } from "../utils/format";

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

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
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

  const rows = keputusanAktif.map((item) => ({
    id: item.id,
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    armada: item.armada ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}` : "-",
    tanggalKeputusan: formatDate(item.tanggal_keputusan),
    status: <Badge status={item.status} />,
  }));

  const openStatusModal = (item) => {
    setSelectedKeputusan(item);
    setSelectedStatus(item.status);
    setArmada(item.armada ?? "");
    setEta(item.eta ?? "");
  };

  const saveStatus = () => {
    if (!selectedKeputusan) {
      return;
    }

    const updates = { status: selectedStatus };
    if (selectedStatus === "dalam-pengiriman") {
      updates.armada = armada.trim();
      updates.eta = eta;
    }

    store.updateKeputusan(selectedKeputusan.id, updates);
    setSelectedKeputusan(null);
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

        <Card>
          <SectionHeader>Daftar Distribusi Aktif</SectionHeader>
          {rows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "kotaTujuan", label: "Kota Tujuan" },
                { key: "volume", label: "Volume", numeric: true },
                { key: "armada", label: "Armada / ETA" },
                { key: "tanggalKeputusan", label: "Tanggal Keputusan" },
                { key: "status", label: "Status" },
              ]}
              data={rows}
              aksi={(baris) => {
                const item = keputusanAktif.find(
                  (keputusanItem) => keputusanItem.id === baris.id
                );

                return (
                  <Tombol
                    label="Perbarui Status"
                    variant="sekunder"
                    onClick={() => openStatusModal(item)}
                  />
                );
              }}
            />
          ) : (
            <EmptyState pesan="Belum ada distribusi aktif untuk dipantau saat ini." />
          )}
        </Card>
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
                onChange={(event) => setSelectedStatus(event.target.value)}
                onFocus={() => setIsSelectFocused(true)}
                onBlur={() => setIsSelectFocused(false)}
                style={{
                  width: "100%",
                  border: `1px solid ${isSelectFocused ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  padding: "9px 12px",
                  outline: "none",
                  boxShadow: isSelectFocused ? "0 0 0 3px var(--color-primary-subtle)" : "none",
                  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
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
                      onChange={(event) => setArmada(event.target.value)}
                      placeholder="Contoh: Truk B-1234-XY / Andi"
                      style={{
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
                      }}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Estimasi Tiba (ETA)
                    </span>
                    <input
                      type="date"
                      value={eta}
                      onChange={(event) => setEta(event.target.value)}
                      style={{
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
                      }}
                    />
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
