import React, { useMemo } from "react";

/**
 * PUBLIC_INTERFACE
 * Minimal SVG Bar Chart (no external libs).
 * Design reference: attachments/20251009_065413_Screenshot_2025-10-09_122334.png
 * Accessible, responsive, Pure White styling. Subtle gridlines and axis ticks.
 *
 * Props:
 * - data: Array<{ label: string, value: number }>
 * - width?: number (default 520)
 * - height?: number (default 240)
 * - ariaLabel?: string
 * - color?: string (default #1a237e)
 * - grid?: boolean (default true)
 * - yTicks?: number (default 4) number of grid/tick lines
 */
// PUBLIC_INTERFACE
export default function SimpleBarChart({
  data,
  width = 520,
  height = 240,
  ariaLabel = "Bar chart",
  color = "#1a237e",
  grid = true,
  yTicks = 4,
}) {
  const safe = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return arr
      .filter((d) => d && typeof d.value === "number" && d.value >= 0)
      .map((d, i) => ({ label: d.label ?? `Item ${i + 1}`, value: d.value }));
  }, [data]);

  const maxV = useMemo(() => {
    const m = safe.reduce((mx, d) => Math.max(mx, d.value), 0);
    // round up to a pleasant number
    const pow = Math.pow(10, String(Math.floor(m)).length - 1 || 1);
    return m === 0 ? 1 : Math.ceil(m / pow) * pow;
  }, [safe]);

  const padding = { top: 12, right: 12, bottom: 28, left: 36 };
  const innerW = Math.max(10, width - padding.left - padding.right);
  const innerH = Math.max(10, height - padding.top - padding.bottom);
  const barGap = 8;
  const barW = safe.length ? (innerW - barGap * (safe.length - 1)) / safe.length : 0;

  const x = (i) => padding.left + i * (barW + barGap);
  const y = (v) => padding.top + innerH - (v / maxV) * innerH;

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxV / yTicks) * i));

  return (
    <figure
      role="figure"
      aria-label={ariaLabel}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <svg width={width} height={height} aria-hidden style={{ display: "block" }}>
        <title>Monthly totals</title>

        {/* Gridlines */}
        {grid &&
          ticks.map((t, i) => {
            const yy = y(t);
            return (
              <line
                key={`g-${i}`}
                x1={padding.left}
                y1={yy}
                x2={padding.left + innerW}
                y2={yy}
                stroke="var(--gridline, #E5E7EB)"
                strokeWidth="1"
                opacity={i === 0 ? 1 : 0.9}
              />
            );
          })}

        {/* Axes (minimal lines) */}
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="var(--color-border)"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          stroke="transparent"
        />

        {/* Bars */}
        {safe.map((d, i) => {
          const h = innerH - (y(d.value) - padding.top);
          return (
            <g key={`b-${i}`}>
              <rect
                x={x(i)}
                y={y(d.value)}
                width={Math.max(2, barW)}
                height={Math.max(1, h)}
                rx="3"
                fill={color}
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {safe.map((d, i) => (
          <text
            key={`xl-${i}`}
            x={x(i) + barW / 2}
            y={padding.top + innerH + 18}
            textAnchor="middle"
            fontSize="11"
            fill="var(--axis-text, #6B7280)"
          >
            {d.label}
          </text>
        ))}

        {/* Y-axis ticks/labels */}
        {ticks.map((t, i) => (
          <text
            key={`yl-${i}`}
            x={padding.left - 6}
            y={y(t)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="11"
            fill="var(--axis-text, #6B7280)"
          >
            {formatShortCurrency(t)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

function formatShortCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  try {
    return `$${Number(n).toLocaleString()}`;
  } catch {
    return `$${n}`;
  }
}
