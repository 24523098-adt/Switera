import { parseDate } from "./distribusi";

export const computeForecastPerKota = (permintaan, windowSize = 3) => {
  const grouped = permintaan.reduce((result, item) => {
    const list = result.get(item.kota) ?? [];
    list.push(item);
    result.set(item.kota, list);
    return result;
  }, new Map());

  const forecasts = [];

  grouped.forEach((items, kota) => {
    const sorted = [...items].sort(
      (a, b) => parseDate(a.tanggal_permintaan) - parseDate(b.tanggal_permintaan)
    );
    const values = sorted.map((item) => Number(item.jumlah_permintaan) || 0);
    const windowValues = values.slice(-windowSize);
    const rataRata = windowValues.reduce((sum, value) => sum + value, 0) / windowValues.length;

    let trend = "stabil";
    if (values.length >= 2) {
      const previous = values[values.length - 2];
      const latest = values[values.length - 1];
      const change = latest - previous;
      const threshold = Math.max(1, previous * 0.1);

      if (change > threshold) {
        trend = "naik";
      } else if (change < -threshold) {
        trend = "turun";
      }
    }

    forecasts.push({
      kota,
      jumlahData: values.length,
      rataRata: Math.round(rataRata * 10) / 10,
      nilaiTerakhir: values[values.length - 1],
      trend,
      riwayat: values,
    });
  });

  return forecasts.sort((a, b) => b.rataRata - a.rataRata);
};
