import React, { useMemo } from "react";

/**
 * PUBLIC_INTERFACE
 * Minimal SVG Pie Chart (no external libs).
 * Design reference: attachments/20251009_065413_Screenshot_2025-10-09_122334.png
 * Accessible and responsive-friendly with Pure White theme styling.
 *
 * Props:
 * - data: Array<{ label: string, value: number, color?: string, amount?: number }>
 *   Note: value is used for slice size; amount can be provided for legend amounts.
 * - width?: number (default 320)
 * - height?: number (default 240)
 * - legendPosition?: 'right' | 'bottom' (default 'right')
 * - ariaLabel?: string (accessible name)
 * - colors?: string[] fallback palette
 *
 * Behavior:
 * - Renders solid slices without a center label.
 * - Legend shows provider label + amount and percentage. Legend stacks on small widths.
 * - Pure White minimalist styling: surfaces (#F9FAFB), text colors per CSS vars.
 */
// PUBLIC_INTERFACE
export default function SimplePieChart({
  data,
  width = 320,
  height = 240,
  legendPosition = "right",
  ariaLabel = "Pie chart",
  colors = ["#000000", "#1a237e", "var(--series-3)", "#9CA3AF", "#F59E0B", "#10B981"],
  // New props to control labels and positioning
  chartOffsetX = 0, // px shift for the pie group to nudge left/right
  showLabels = false,
  labelType = "percent", // 'percent' | 'value'
  labelColor = "auto", // 'auto' | CSS color string
  minLabelPercent = 3, // threshold below which labels render outside with leader lines
}) {
  const safe = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return arr
      .filter((d) => d && typeof d.value === "number" && d.value >= 0)
      .map((d, i) => ({
        label: d.label ?? `Item ${i + 1}`,
        value: d.value,
        amount: typeof d.amount === "number" ? d.amount : d.value,
        color: d.color || colors[i % colors.length],
      }));
  }, [data, colors]);

  const total = useMemo(() => safe.reduce((s, d) => s + d.value, 0), [safe]);
  const hasData = total > 0 && safe.length > 0;

  // Drawing area
  const padding = 8;
  const svgW = width;
  const svgH = height;
  const r = Math.max(40, Math.min(svgW, svgH) / 2 - padding);
  const cx = svgW / 2;
  const cy = svgH / 2;

  let acc = 0;
  const segments = (hasData ? safe : [{ label: "No data", value: 1, amount: 0, color: "#E5E7EB" }]).map((d) => {
    const frac = hasData ? d.value / total : 1;
    const start = acc * 2 * Math.PI;
    const end = (acc + frac) * 2 * Math.PI;
    acc += frac;
    return { ...d, frac, start, end };
  });

  const arcPath = (cx, cy, r, start, end) => {
    const x1 = cx + r * Math.cos(start - Math.PI / 2);
    const y1 = cy + r * Math.sin(start - Math.PI / 2);
    const x2 = cx + r * Math.cos(end - Math.PI / 2);
    const y2 = cy + r * Math.sin(end - Math.PI / 2);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Compute mid point on arc at radius 'rr'
  const midPoint = (seg, rr = r * 0.62) => {
    const mid = (seg.start + seg.end) / 2;
    const x = cx + rr * Math.cos(mid - Math.PI / 2);
    const y = cy + rr * Math.sin(mid - Math.PI / 2);
    return { x, y, mid };
  };

  // Relative luminance for contrast and auto text color
  const hexToRgb = (hex) => {
    try {
      const h = hex.replace('#', '');
      const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    } catch { return { r: 0, g: 0, b: 0 }; }
  };
  const relLum = ({ r, g, b }) => {
    const toLin = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const R = toLin(r), G = toLin(g), B = toLin(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const autoTextColorForBg = (bgHex) => {
    const lum = relLum(hexToRgb(bgHex || '#ffffff'));
    // Return dark text when background is light, else white with outline
    return lum > 0.5 ? '#111827' : '#ffffff';
  };

  const formatPercent = (frac) => `${Math.max(0, Math.round(frac * 100))}%`;
  const formatValue = (n) => {
    try { return `$${Number(n).toLocaleString()}`; } catch { return `$${n}`; }
  };

  const legendItems = hasData
    ? safe.map((d) => ({
        label: d.label,
        color: d.color,
        percent: total ? Math.round((d.value / total) * 100) : 0,
        amount: d.amount,
      }))
    : [{ label: "No data", color: "#E5E7EB", percent: 0, amount: 0 }];

  const Legend = () => (
    <div
      role="list"
      aria-label="Chart legend"
      style={{
        display: "grid",
        gap: 8,
        alignContent: "start",
        color: "var(--color-text)",
      }}
    >
      {legendItems.map((it, idx) => (
        <button
          key={`${it.label}-${idx}`}
          role="listitem"
          className="legend-item"
          tabIndex={0}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "6px 8px",
            cursor: "default",
            textAlign: "left",
          }}
          aria-label={`${it.label}: ${formatCurrency(it.amount)} (${it.percent} percent)`}
        >
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: it.color,
            }}
          />
          <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{it.label}</span>
          <span style={{ fontWeight: 700, fontSize: 12 }}>
            {formatCurrency(it.amount)} · {it.percent}%
          </span>
        </button>
      ))}
    </div>
  );

  const ChartSvg = () => (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <title>Pie breakdown</title>
      <g transform={`translate(${chartOffsetX}, 0)`}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, seg.start, seg.end)}
            fill={seg.color}
            role="img"
            aria-label={`${seg.label}: ${labelType === "percent" ? formatPercent(seg.frac) : formatValue(seg.amount)} (${formatPercent(seg.frac)})`}
          />
        ))}

        {/* Labels */}
        {showLabels &&
          hasData &&
          segments.map((seg, i) => {
            const pct = seg.frac * 100;
            const useOutside = pct < minLabelPercent;
            const mid = midPoint(seg, useOutside ? r + 10 : r * 0.62);
            const isRight = ((mid.mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < Math.PI; // right half if angle < 180deg

            // Leader line points for small slices
            const pInner = midPoint(seg, r * 0.9);
            const pOuter = midPoint(seg, r + 8);
            const lineEndX = pOuter.x + (isRight ? 12 : -12);
            const labelX = lineEndX + (isRight ? 4 : -4);

            const textValue = labelType === "percent" ? formatPercent(seg.frac) : formatValue(seg.amount);
            const txtFill = labelColor === "auto" ? autoTextColorForBg(seg.color) : labelColor;

            const textShadow =
              txtFill === "#ffffff"
                ? "0 0 2px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.6)"
                : "0 0 2px rgba(255,255,255,0.25)";

            return (
              <g key={`label-${i}`} aria-hidden="true">
                {useOutside ? (
                  <>
                    {/* Leader line */}
                    <polyline
                      points={`${pInner.x},${pInner.y} ${pOuter.x},${pOuter.y} ${lineEndX},${pOuter.y}`}
                      fill="none"
                      stroke="var(--axis-text, #6B7280)"
                      strokeWidth="1"
                    />
                    {/* Outside label */}
                    <text
                      x={labelX}
                      y={pOuter.y}
                      textAnchor={isRight ? "start" : "end"}
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill="var(--color-text)"
                      style={{ paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 3 }}
                    >
                      {`${seg.label} · ${textValue}`}
                    </text>
                  </>
                ) : (
                  // Inside label
                  <text
                    x={mid.x}
                    y={mid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill={txtFill}
                    style={{
                      textShadow,
                    }}
                  >
                    {textValue}
                  </text>
                )}
              </g>
            );
          })}
      </g>
    </svg>
  );

  if (legendPosition === "bottom") {
    return (
      <figure
        role="figure"
        aria-label={ariaLabel}
        style={{ display: "grid", gap: 10, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 10, overflow: "visible" }}
      >
        <ChartSvg />
        <Legend />
      </figure>
    );
  }

  // right-side legend layout (default)
  return (
    <figure
      role="figure"
      aria-label={ariaLabel}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr minmax(160px, 40%)",
        gap: 12,
        alignItems: "center",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 10,
        overflow: "visible",
      }}
    >
      <ChartSvg />
      <Legend />
      <style>{`
        @media (max-width: 720px) {
          figure[aria-label="${ariaLabel}"] {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </figure>
  );
}

function formatCurrency(n) {
  try {
    return `$${Number(n).toLocaleString()}`;
  } catch {
    return `$${n}`;
  }
}
