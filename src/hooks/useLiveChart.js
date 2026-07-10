import { useEffect, useRef, useState } from "react";

// Membuat instance Chart.js SEKALI lalu memperbarui datanya DI TEMPAT
// (chart.update("none") — tanpa animasi) setiap kali `sig` berubah, bukan
// destroy() + new Chart() pada tiap re-render. Ini menghapus "kedip"/animasi
// ulang saat store re-render karena polling, sambil tetap memutar animasi
// masuk satu kali ketika grafik pertama tampil.
//
// - sig: string sidik jari data; update di tempat hanya jalan saat nilainya
//   benar-benar berubah (referensi array baru tiap tick polling tidak cukup).
// - canDraw: apakah ada data untuk digambar (mis. ranking.length > 0).
// - buildConfig(ctx, Chart, canvas): config Chart.js lengkap dengan data
//   terkini di-bake di dalamnya, dipakai sekali saat pembuatan agar animasi
//   masuk memantulkan nilai aktual.
// - applyData(chart): menulis ulang chart.data dari nilai terkini; dipakai
//   untuk update di tempat pada perubahan berikutnya.
// - errorMessage: pesan ketika Chart.js gagal dimuat.
export default function useLiveChart({ sig, canDraw, buildConfig, applyData, errorMessage }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Selalu pegang closure terbaru tanpa menjadikannya dependency efek, agar
  // efek tidak jalan ulang hanya karena identitas fungsi berubah tiap render.
  const buildRef = useRef(buildConfig);
  const applyRef = useRef(applyData);
  buildRef.current = buildConfig;
  applyRef.current = applyData;

  useEffect(() => {
    if (!canvasRef.current || !canDraw || typeof window === "undefined") {
      return undefined;
    }

    // Chart sudah ada: perbarui di tempat tanpa animasi — jangan destroy.
    if (chartRef.current) {
      applyRef.current(chartRef.current);
      chartRef.current.update("none");
      return undefined;
    }

    // Pertama kali: buat sekali (dengan animasi masuk dari buildConfig).
    let isActive = true;
    setIsReady(false);

    import("chart.js/auto")
      .then((module) => {
        if (!isActive || !canvasRef.current || chartRef.current) {
          return;
        }
        const Chart = module.default;
        const ctx = canvasRef.current.getContext("2d");
        chartRef.current = new Chart(ctx, buildRef.current(ctx, Chart, canvasRef.current));
        setError("");
        setIsReady(true);
      })
      .catch(() => {
        if (isActive) {
          setError(errorMessage ?? "Grafik tidak dapat dimuat karena Chart.js belum tersedia.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [sig, canDraw, errorMessage]);

  // Destroy hanya saat unmount, bukan tiap perubahan data.
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return { canvasRef, error, isReady };
}
