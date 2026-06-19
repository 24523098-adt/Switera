import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import Tabel from "../components/Tabel";
import store from "../store";
import { roleOptions } from "../utils/navigation";

const formatterWaktu = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatWaktu = (value) => formatterWaktu.format(new Date(value));

const cocokRentangTanggal = (waktuIso, dariTanggal, sampaiTanggal) => {
  const tanggalLog = waktuIso.slice(0, 10);

  if (dariTanggal && tanggalLog < dariTanggal) {
    return false;
  }

  if (sampaiTanggal && tanggalLog > sampaiTanggal) {
    return false;
  }

  return true;
};

function RiwayatAktivitas({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [filterRole, setFilterRole] = useState("");
  const [dariTanggal, setDariTanggal] = useState("");
  const [sampaiTanggal, setSampaiTanggal] = useState("");
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const activityLog = useMemo(
    () =>
      [...(snapshot.activityLog ?? [])].sort(
        (first, second) => new Date(second.waktu) - new Date(first.waktu)
      ),
    [snapshot.activityLog]
  );

  const filteredLog = useMemo(
    () =>
      activityLog.filter((item) => {
        if (filterRole && item.role !== filterRole) {
          return false;
        }

        return cocokRentangTanggal(item.waktu, dariTanggal, sampaiTanggal);
      }),
    [activityLog, filterRole, dariTanggal, sampaiTanggal]
  );

  const tableRows = filteredLog.map((item) => ({
    id: item.id,
    waktu: formatWaktu(item.waktu),
    aktor: item.aktor,
    role: item.role,
    aksi: item.aksi,
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

  return (
    <Layout
      title="Switera"
      roleAwal="Admin"
      menuAwal="riwayat-aktivitas"
      onMenuChange={onNavigate}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
              }}
            >
              Riwayat Aktivitas
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Jejak audit seluruh aksi penting pengguna pada sistem, dari yang
              terbaru.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={labelStyle}>
              <span>Role</span>
              <select
                value={filterRole}
                onFocus={() => setFocusedField("role")}
                onBlur={() => setFocusedField("")}
                onChange={(event) => setFilterRole(event.target.value)}
                style={getFieldStyle("role")}
              >
                <option value="">Semua Role</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div style={labelStyle}>
              <span>Dari Tanggal</span>
              <input
                type="date"
                value={dariTanggal}
                onFocus={() => setFocusedField("dari")}
                onBlur={() => setFocusedField("")}
                onChange={(event) => setDariTanggal(event.target.value)}
                style={getFieldStyle("dari")}
              />
            </div>

            <div style={labelStyle}>
              <span>Sampai Tanggal</span>
              <input
                type="date"
                value={sampaiTanggal}
                onFocus={() => setFocusedField("sampai")}
                onBlur={() => setFocusedField("")}
                onChange={(event) => setSampaiTanggal(event.target.value)}
                style={getFieldStyle("sampai")}
              />
            </div>
          </div>
        </Card>

        {tableRows.length > 0 ? (
          <Tabel
            kolom={[
              { key: "waktu", label: "Waktu" },
              { key: "aktor", label: "Aktor" },
              { key: "role", label: "Role" },
              { key: "aksi", label: "Aksi" },
            ]}
            data={tableRows}
          />
        ) : (
          <EmptyState pesan="Tidak ada aktivitas yang cocok dengan filter saat ini." />
        )}
      </div>
    </Layout>
  );
}

export default RiwayatAktivitas;
