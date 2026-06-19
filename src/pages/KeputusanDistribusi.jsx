import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Tombol from "../components/Tombol";
import store from "../store";
import { aggregatePermintaanRanking, getLocalDateKey, parseDate } from "../utils/distribusi";

const formatterAngka = new Intl.NumberFormat("id-ID");

const formatTonase = (value) => `${formatterAngka.format(value)} ton`;

function KeputusanDistribusi({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [isCustomSelection, setIsCustomSelection] = useState(false);
  const [selectedKota, setSelectedKota] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
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

  const ranking = useMemo(
    () => aggregatePermintaanRanking(snapshot.permintaan ?? []),
    [snapshot.permintaan]
  );

  const rekomendasi = ranking[0];
  const pilihanManual = ranking.find((item) => item.kota === selectedKota);
  const keputusanAktifTerakhir = useMemo(() => {
    const sorted = [...(snapshot.keputusan ?? [])].sort((first, second) => {
      const byDate =
        parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan);

      if (byDate !== 0) {
        return byDate;
      }

      return second.id.localeCompare(first.id, "id-ID");
    });

    return sorted[0];
  }, [snapshot.keputusan]);

  const saveKeputusan = (targetKota, alasan) => {
    if (!targetKota) {
      return;
    }

    store.addKeputusan({
      kota_tujuan: targetKota.kota,
      volume_tbs: targetKota.totalPermintaan,
      tanggal_keputusan: getLocalDateKey(),
      diputuskan_oleh: "Manajer Distribusi",
      status: "menunggu",
      alasan,
    });

    setToastMessage(`Keputusan distribusi untuk ${targetKota.kota} berhasil disimpan.`);
    setIsCustomSelection(false);
    setSelectedKota("");
  };

  const confirmCancelLast = () => {
    if (!keputusanAktifTerakhir) {
      return;
    }

    store.removeKeputusan(keputusanAktifTerakhir.id);
    setIsCancelOpen(false);
    setToastMessage("Keputusan aktif terakhir berhasil dibatalkan.");
  };

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

  return (
    <Layout
      title="Switera"
      roleAwal="Manajer Distribusi"
      menuAwal="keputusan-distribusi"
      onMenuChange={onNavigate}
    >
      <PageHeader
        judul="Keputusan Distribusi"
        deskripsi="Tetapkan kota tujuan distribusi berdasarkan data permintaan."
      />
      {ranking.length === 0 ? (
        <EmptyState pesan="Belum ada data permintaan. Silakan hubungi Admin." />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <Card
            style={{
              background: "linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface-3) 100%)",
              border: "1px solid var(--color-border-mid)",
              borderTop: "2px solid var(--color-primary)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-8)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--color-primary-subtle)",
                  border: "1px solid rgba(45,106,79,0.25)",
                  color: "var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                  padding: "3px 10px",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Rekomendasi Sistem
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: "var(--font-weight-bold)",
                  letterSpacing: "var(--tracking-tight)",
                  color: "var(--color-text-primary)",
                }}
              >
                {rekomendasi.kota}
              </h2>
              <p
                style={{
                  margin: "0.45rem 0 0",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Permintaan tertinggi pada periode ini dengan total{" "}
                {formatTonase(rekomendasi.totalPermintaan)}.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Tombol
                label="Setujui Rekomendasi"
                onClick={() =>
                  saveKeputusan(
                    rekomendasi,
                    "Permintaan tertinggi pada periode ini"
                  )
                }
              />
              <Tombol
                label="Pilih Kota Lain"
                variant="sekunder"
                onClick={() => setIsCustomSelection((current) => !current)}
              />
            </div>
          </Card>

          {isCustomSelection ? (
            <Card
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: "1.2rem",
                  }}
                >
                  Pilih kota alternatif
                </h2>
                <p
                  style={{
                    margin: "0.4rem 0 0",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  Gunakan daftar ranking untuk menetapkan tujuan distribusi secara manual.
                </p>
              </div>

              <select
                value={selectedKota}
                onChange={(event) => setSelectedKota(event.target.value)}
                style={fieldStyle}
              >
                <option value="">Pilih kota dari ranking</option>
                {ranking.map((item) => (
                  <option key={item.kota} value={item.kota}>
                    {item.kota} - {formatTonase(item.totalPermintaan)}
                  </option>
                ))}
              </select>

              {pilihanManual ? (
                <Card
                  style={{
                    backgroundColor: "var(--color-bg)",
                    boxShadow: "none",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Ringkasan keputusan
                  </p>
                  <p
                    style={{
                      margin: "0.35rem 0 0",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.4rem",
                      fontWeight: 800,
                    }}
                  >
                    {pilihanManual.kota}
                  </p>
                  <p
                    style={{
                      margin: "0.45rem 0 0",
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    Total permintaan {formatTonase(pilihanManual.totalPermintaan)}. Kota
                    ini dipilih manual oleh Manajer Distribusi.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "1rem",
                    }}
                  >
                    <Tombol
                      label="Simpan Keputusan"
                      onClick={() =>
                        saveKeputusan(
                          pilihanManual,
                          "Dipilih manual oleh Manajer Distribusi"
                        )
                      }
                    />
                  </div>
                </Card>
              ) : null}
            </Card>
          ) : null}

          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "1.2rem",
                }}
              >
                Batalkan keputusan aktif terakhir
              </h2>
              <p
                style={{
                  margin: "0.4rem 0 0",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Keputusan dibatalkan akan hilang dari daftar aktif, tetapi riwayatnya tetap tersimpan.
              </p>
            </div>
            <Tombol
              label="Batalkan Keputusan Terakhir"
              variant="bahaya"
              onClick={() => setIsCancelOpen(true)}
            />
          </Card>
        </div>
      )}

      {isCancelOpen ? (
        <Modal
          judul="Batalkan keputusan terakhir"
          onTutup={() => setIsCancelOpen(false)}
          konten={
            keputusanAktifTerakhir ? (
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
                  Keputusan terakhir untuk kota{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {keputusanAktifTerakhir.kota_tujuan}
                  </strong>{" "}
                  dengan volume {formatTonase(keputusanAktifTerakhir.volume_tbs)} akan
                  dibatalkan dari daftar aktif.
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
                    onClick={() => setIsCancelOpen(false)}
                  />
                  <Tombol
                    label="Ya, Batalkan"
                    variant="bahaya"
                    onClick={confirmCancelLast}
                  />
                </div>
              </div>
            ) : (
              <EmptyState pesan="Belum ada keputusan aktif yang bisa dibatalkan." />
            )
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

export default KeputusanDistribusi;
