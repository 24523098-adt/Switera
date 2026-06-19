export const CHART_PALETTE = [
  "#2d6a4f",
  "#40916c",
  "#f2a71b",
  "#3b82f6",
  "#e5484d",
  "#30a46c",
  "#f59e0b",
  "#8b5cf6",
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
    color: "#9b9b9b",
    font: { size: 11, family: "Inter" },
  },
};

export const chartTooltipDefaults = {
  backgroundColor: "#161616",
  borderColor: "#2a2a2a",
  borderWidth: 1,
  titleColor: "#f0f0f0",
  bodyColor: "#9b9b9b",
  padding: 10,
  cornerRadius: 8,
};

export const chartGridDefaults = { color: "rgba(255,255,255,0.04)" };

export const chartTickDefaults = { color: "#5a5a5a", font: { size: 11 } };

export const chartDatasetDefaults = {
  borderWidth: 2,
  tension: 0.4,
};
