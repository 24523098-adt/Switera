import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";

const accentColors = {
  primary: { subtle: "var(--color-primary-subtle)", solid: "var(--color-primary)" },
  accent: { subtle: "var(--color-accent-subtle)", solid: "var(--color-accent)" },
  info: { subtle: "var(--color-info-subtle)", solid: "var(--color-info)" },
  success: { subtle: "var(--color-success-subtle)", solid: "var(--color-success)" },
  warning: { subtle: "var(--color-warning-subtle)", solid: "var(--color-warning)" },
  danger: { subtle: "var(--color-danger-subtle)", solid: "var(--color-danger)" },
};

const formatterAngka = new Intl.NumberFormat("id-ID");

function parseNilai(raw) {
  const text = String(raw ?? "");
  const match = text.match(/^(-?[\d.,]+)(.*)$/);

  if (!match) {
    return { isNumeric: false };
  }

  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    return { isNumeric: false };
  }

  return { isNumeric: true, number, suffix: match[2] };
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(target);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      setValue(target);
      return undefined;
    }

    hasAnimatedRef.current = true;
    let frameId;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

function MetricCard({ label, nilai, ikon, accent = "primary" }) {
  const colors = accentColors[accent] ?? accentColors.primary;
  const parsed = useMemo(() => parseNilai(nilai), [nilai]);
  const animatedNumber = useCountUp(parsed.isNumeric ? parsed.number : 0, 800);
  const displayValue = parsed.isNumeric
    ? `${formatterAngka.format(Math.round(animatedNumber))}${parsed.suffix}`
    : String(nilai);

  return (
    <Card
      hoverable
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        padding: "var(--space-5)",
      }}
    >
      {ikon ? (
        <div
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "var(--radius-md)",
            backgroundColor: colors.subtle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ width: "20px", height: "20px", display: "flex", color: colors.solid }}>
            {ikon}
          </span>
        </div>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            marginBottom: "var(--space-1)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--font-weight-bold)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "var(--tracking-tight)",
            color: "var(--color-text-primary)",
          }}
        >
          {displayValue}
        </p>
      </div>
    </Card>
  );
}

export default MetricCard;
