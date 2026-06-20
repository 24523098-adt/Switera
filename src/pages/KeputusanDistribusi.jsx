import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";
import { computeRekomendasiDistribusi, getLocalDateKey, parseDate } from "../utils/distribusi";
import { formatTonase } from "../utils/format";

function KeputusanDistribusi({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [isCustomSelection, setIsCustomSelection] = useState(false);
  const [selectedKota, setSelectedKota] = useState("");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const rekomendasiList = useMemo(
    () => computeRekomendasiDistribusi(snapshot.permintaan ?? [], snapshot.daftarKota ?? [], snapshot.stokTbs ?? 0),
    [snapshot.permintaan, snapshot.daftarKota, snapshot.stokTbs]
  );

  const rekomendasi = rekomendasiList[0];
  const pilihanManual = rekomendasiList.find((item) => item.kota === selectedKota);
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
      volume_tbs: targetKota.alokasi,
      tanggal_keputusan: getLocalDateKey(),
      diputuskan_oleh: "Manajer Distribusi",
      status: "menunggu",
      alasan,
    });

    showToast({ type: "success", message: `Keputusan distribusi untuk ${targetKota.kota} berhasil disimpan.` });
    setIsCustomSelection(false);
    setSelectedKota("");
  };

  const confirmCancelLast = () => {
    if (!keputusanAktifTerakhir) {
      return;
    }

    const keputusanDibatalkan = keputusanAktifTerakhir;
    store.removeKeputusan(keputusanDibatalkan.id);
    setIsCancelOpen(false);
    showToast({
      type: "success",
      message: "Keputusan aktif terakhir berhasil dibatalkan.",
      action: {
        label: "Urungkan",
        onClick: () => {
          store.restoreKeputusan(keputusanDibatalkan);
          showToast({ type: "info", message: "Keputusan distribusi dikembalikan." });
        },
      },
    });
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
    <>
      <PageHeader
        judul="Keputusan Distribusi"
        deskripsi="Tetapkan kota tujuan distribusi berdasarkan data permintaan."
      />
      {rekomendasiList.length === 0 ? (
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
                Rekomendasi Sistem · Skor {rekomendasi.skor}
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
                Permintaan {formatTonase(rekomendasi.totalPermintaan)} dari kapasitas{" "}
                {formatTonase(rekomendasi.kapasitas)}. Alokasi disarankan{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {formatTonase(rekomendasi.alokasi)}
                </strong>
                {!rekomendasi.terpenuhiPenuh
                  ? rekomendasi.dibatasiKapasitas
                    ? " (dibatasi oleh kapasitas kota)."
                    : " (dibatasi oleh ketersediaan stok TBS)."
                  : "."}
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
                    "Rekomendasi sistem berdasarkan skor permintaan dan kapasitas"
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
                onFocus={() => setFocusedField("kota")}
                onBlur={() => setFocusedField("")}
                style={getFieldStyle("kota")}
              >
                <option value="">Pilih kota dari ranking</option>
                {rekomendasiList.map((item) => (
                  <option key={item.kota} value={item.kota}>
                    {item.kota} - {formatTonase(item.totalPermintaan)} (skor {item.skor})
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
                    Total permintaan {formatTonase(pilihanManual.totalPermintaan)}, alokasi disarankan{" "}
                    {formatTonase(pilihanManual.alokasi)}. Kota ini dipilih manual oleh Manajer Distribusi.
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
    </>
  );
}

export default KeputusanDistribusi;
