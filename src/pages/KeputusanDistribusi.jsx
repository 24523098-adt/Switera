import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import store from "../store";
import { computeRekomendasiDistribusi, getLocalDateKey, parseDate } from "../utils/distribusi";
import { formatTonase } from "../utils/format";

// AI-2: card rekomendasi keputusan naratif — pola yang sama dengan
// RingkasanAI di Laporan.jsx (state lokal, komponen shared).
function RekomendasiAI() {
  const [rekomendasi, setRekomendasi] = useState("");
  const [rekomendasiError, setRekomendasiError] = useState("");
  const [isMemintaRekomendasi, setIsMemintaRekomendasi] = useState(false);

  const handleMintaRekomendasi = async () => {
    setIsMemintaRekomendasi(true);
    setRekomendasiError("");
    try {
      const hasil = await store.buatRekomendasiKeputusanAi();
      setRekomendasi(hasil?.rekomendasi ?? "");
    } catch (error) {
      setRekomendasiError(error.message || "Gagal meminta rekomendasi. Coba lagi.");
    } finally {
      setIsMemintaRekomendasi(false);
    }
  };

  return (
    <Card style={{ animationDelay: "40ms" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <SectionHeader>
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "6px" }}
          >
            auto_awesome
          </span>
          Rekomendasi AI
        </SectionHeader>
        <Tombol
          label={rekomendasi ? "Minta Ulang" : "Minta Rekomendasi AI"}
          variant="sekunder"
          onClick={handleMintaRekomendasi}
          isLoading={isMemintaRekomendasi}
        />
      </div>

      {rekomendasiError ? (
        <p
          style={{
            margin: 0,
            color: "var(--color-danger)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
          }}
        >
          {rekomendasiError}
        </p>
      ) : rekomendasi ? (
        <div style={{ animation: "fadeInUp 300ms var(--ease-smooth) both" }}>
          {rekomendasi.split(/\n+/).map((baris, index) => (
            <p
              key={index}
              style={{
                margin: index === 0 ? 0 : "0.6rem 0 0",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.7,
              }}
            >
              {baris}
            </p>
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
          }}
        >
          {isMemintaRekomendasi
            ? "AI sedang menganalisis stok, permintaan, dan keputusan aktif…"
            : "Minta saran AI: kota mana yang layak diprioritaskan, volumenya, dan risikonya — berdasarkan skor dan alokasi di halaman ini."}
        </p>
      )}
    </Card>
  );
}

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

  useEffect(() => {
    store.loadKeputusan();
    store.loadRiwayatKeputusan();
    store.loadKota();
    store.loadPermintaan();
    store.loadStok();
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

  const saveKeputusan = async (targetKota, alasan) => {
    if (!targetKota) {
      return;
    }

    const existingDecision = (snapshot.keputusan ?? []).find(
      (item) => item.kota_tujuan === targetKota.kota && item.status !== "selesai"
    );

    if (existingDecision) {
      showToast({
        type: "warning",
        message: `Kota ${targetKota.kota} sudah memiliki keputusan distribusi aktif.`,
      });
      return;
    }

    try {
      await store.addKeputusan({
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
    } catch {
      // runMutation already Toasted the server's error message.
    }
  };

  const confirmCancelLast = async () => {
    if (!keputusanAktifTerakhir) {
      return;
    }

    const keputusanDibatalkan = keputusanAktifTerakhir;

    try {
      await store.removeKeputusan(keputusanDibatalkan.id);
      setIsCancelOpen(false);
      showToast({
        type: "success",
        message: "Keputusan aktif terakhir berhasil dibatalkan.",
        action: {
          label: "Urungkan",
          onClick: async () => {
            try {
              await store.restoreKeputusan(keputusanDibatalkan);
              showToast({ type: "info", message: "Keputusan distribusi dikembalikan." });
            } catch {
              // runMutation already Toasted the server's error message.
            }
          },
        },
      });
    } catch {
      // runMutation already Toasted the server's error message; keep the
      // confirm modal open so the user can retry.
    }
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
          {/* Kartu rekomendasi unggulan ala keputusan_distribusi_switera:
              panel kiri (badge + kota + 2 kotak stat) | panel kanan (aksi). */}
          <Card
            className="app-grid-2"
            style={{
              padding: "var(--space-8)",
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "var(--space-8)",
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "fit-content",
                  backgroundColor: "rgba(0, 134, 86, 0.1)",
                  border: "1px solid rgba(0, 106, 67, 0.2)",
                  color: "var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px 12px",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: "16px", lineHeight: 1 }}>stars</span>
                Rekomendasi Utama
              </span>
              <div>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  Rekomendasi Distribusi Selanjutnya
                </h2>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-4xl)",
                    fontWeight: "var(--font-weight-bold)",
                    letterSpacing: "var(--tracking-tight)",
                    color: "var(--color-primary)",
                  }}
                >
                  {rekomendasi.kota}
                </span>
              </div>
              <div className="app-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>Volume Alokasi</p>
                  <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                    {formatTonase(rekomendasi.alokasi)}
                  </p>
                </div>
                <div style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>Skor Kelayakan</p>
                  <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-primary)" }}>
                    {rekomendasi.skor} <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: "var(--color-on-surface-variant)" }}>/ 100</span>
                  </p>
                </div>
              </div>
            </div>

            <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-3)", minWidth: 0 }} className="keputusan-aksi-panel">
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                Aksi Keputusan
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
                Permintaan {formatTonase(rekomendasi.totalPermintaan)} dari kapasitas{" "}
                {formatTonase(rekomendasi.kapasitas)}. Alokasi disarankan{" "}
                <strong style={{ color: "var(--color-on-surface)" }}>{formatTonase(rekomendasi.alokasi)}</strong>
                {!rekomendasi.terpenuhiPenuh
                  ? rekomendasi.dibatasiKapasitas
                    ? " (dibatasi oleh kapasitas kota)."
                    : " (dibatasi oleh ketersediaan stok TBS)."
                  : "."}{" "}
                Menyetujui rekomendasi ini akan mencatat keputusan dan mengurangi stok TBS secara otomatis.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
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
            </div>
          </Card>

          <RekomendasiAI />

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
              animationDelay: "80ms",
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
