// Palet Catalyst (light): primary hijau, secondary biru, tertiary oranye.
export const CHART_PALETTE = [
  "#006a43",
  "#008656",
  "#994100",
  "#00668a",
  "#ba1a1a",
  "#40c2fd",
  "#c05400",
  "#70dba2",
];

export function withOpacity(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const chartLegendDefaults = {
  labels: {
    color: "#3e4941",
    font: { size: 11, family: "Inter" },
  },
};

export const chartTooltipDefaults = {
  backgroundColor: "#0b1c30",
  borderColor: "#213145",
  borderWidth: 1,
  titleColor: "#ffffff",
  bodyColor: "#eaf1ff",
  padding: 10,
  cornerRadius: 8,
};

export const chartGridDefaults = { color: "rgba(11, 28, 48, 0.06)" };

export const chartTickDefaults = { color: "#6e7a71", font: { size: 11 } };

export const chartDatasetDefaults = {
  borderWidth: 2,
  tension: 0.4,
};

export const chartAnimationDefaults = {
  duration: 800,
  easing: "easeOutQuart",
  delay(context) {
    return context.type === "data" ? context.dataIndex * 80 : 0;
  },
};
