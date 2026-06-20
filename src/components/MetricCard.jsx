import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import Sparkline from "./Sparkline";

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

function MetricCard({ label, nilai, ikon, accent = "primary", shimmer = false, size = "md", trend, valueFontSize, sparkline, style, children }) {
  const colors = accentColors[accent] ?? accentColors.primary;
  const parsed = useMemo(() => parseNilai(nilai), [nilai]);
  const animatedNumber = useCountUp(parsed.isNumeric ? parsed.number : 0, 800);
  const displayValue = parsed.isNumeric
    ? `${formatterAngka.format(Math.round(animatedNumber))}${parsed.suffix}`
    : String(nilai);
  const isLarge = size === "lg";
  const iconBoxSize = isLarge ? "44px" : "40px";
  const iconSize = isLarge ? "22px" : "20px";

  if (!isLarge) {
    return (
      <Card
        hoverable
        shimmer={shimmer}
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
              width: iconBoxSize,
              height: iconBoxSize,
              flexShrink: 0,
              borderRadius: "var(--radius-md)",
              backgroundColor: colors.subtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ width: iconSize, height: iconSize, display: "flex", color: colors.solid }}>
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
          {trend ? (
            <p
              style={{
                margin: 0,
                marginTop: "var(--space-2)",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              {trend}
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card
      hoverable
      shimmer={shimmer}
      style={{
        padding: "var(--space-5) var(--space-6)",
        minHeight: "120px",
        boxSizing: "border-box",
        borderTop: "1px solid var(--color-border-mid)",
        borderRight: "1px solid var(--color-border-mid)",
        borderBottom: "1px solid var(--color-border-mid)",
        borderLeft: `3px solid ${colors.solid}`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: colors.solid,
          opacity: 0.12,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        {ikon ? (
          <div
            style={{
              width: iconBoxSize,
              height: iconBoxSize,
              flexShrink: 0,
              borderRadius: "var(--radius-md)",
              backgroundColor: colors.subtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ width: iconSize, height: iconSize, display: "flex", color: colors.solid }}>
              {ikon}
            </span>
          </div>
        ) : (
          <span />
        )}
        <p
          style={{
            margin: 0,
            fontSize: valueFontSize ?? "var(--text-2xl)",
            fontWeight: "var(--font-weight-bold)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            textAlign: "right",
          }}
        >
          {displayValue}
        </p>
      </div>

      {children ? <div style={{ position: "relative", flex: 1 }}>{children}</div> : null}

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          {label}
        </p>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
          {sparkline ? <Sparkline data={sparkline} color={colors.solid} width={56} height={18} /> : null}
          {trend ? (
            <span
              style={{
                fontSize: "var(--text-2xs)",
                backgroundColor: colors.subtle,
                color: colors.solid,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontWeight: "var(--font-weight-semibold)",
                whiteSpace: "nowrap",
              }}
            >
              {trend}
            </span>
          ) : null}
        </span>
      </div>
    </Card>
  );
}

export default MetricCard;
