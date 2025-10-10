import React, { useMemo } from "react";

/**
 * PUBLIC_INTERFACE
 * Minimal SVG Pie Chart (no external libs).
 * Accessible and responsive-friendly with Pure White theme styling, with outside labels and leader lines.
 *
 * Props:
 * - data: Array<{ label: string, value: number, color?: string, amount?: number }>
 * - width?: number (default 320)
 * - height?: number (default 240)
 * - legendPosition?: 'right' | 'bottom' (default 'right')
 * - ariaLabel?: string
 * - colors?: string[] fallback palette
 * - chartOffsetX?: number shift for pie position
 * - showLabels?: boolean
 * - labelType?: 'percent' | 'value'
 * - labelColor?: 'auto' | CSS color
 * - minLabelPercent?: number threshold for outside labels (use 100 to force all outside)
 */
// PUBLIC_INTERFACE
export default function SimplePieChart({
  data,
  width = 320,
  height = 240,
  legendPosition = "right",
  ariaLabel = "Pie chart",
  colors = ["#000000", "#1a237e", "var(--series-3)", "#9CA3AF", "#F59E0B", "#10B981"],
  chartOffsetX = 0,
  showLabels = true,
  labelType = "value",
  labelColor = "auto",
  minLabelPercent = 100,
}) {
  const safe = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    const idxMap = { 0: "AWS", 1: "Azure", 2: "GCP" };
    return arr
      .filter((d) => d && typeof d.value === "number" && d.value >= 0)
      .map((d, i) => {
        const providerName = d.label ?? (i in idxMap ? idxMap[i] : `Item ${i + 1}`);
        return {
          label: providerName,
          value: d.value,
          amount: typeof d.amount === "number" ? d.amount : d.value,
          color: d.color || colors[i % colors.length],
        };
      });
  }, [data, colors]);

  const total = useMemo(() => safe.reduce((s, d) => s + d.value, 0), [safe]);
  const hasData = total > 0 && safe.length > 0;

  const padding = 14; // increased padding to reduce clipping
  const svgW = width;
  const svgH = height;
  const r = Math.max(44, Math.min(svgW, svgH) / 2 - padding);
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

  const midPoint = (seg, rr = r * 0.62) => {
    const mid = (seg.start + seg.end) / 2;
    const x = cx + rr * Math.cos(mid - Math.PI / 2);
    const y = cy + rr * Math.sin(mid - Math.PI / 2);
    return { x, y, mid };
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
        <div
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
        </div>
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

        {/* Outside labels with leader lines per reference */}
        {showLabels &&
          hasData &&
          segments.map((seg, i) => {
            const pct = seg.frac * 100;
            const useOutside = pct < minLabelPercent;
            const mid = midPoint(seg, useOutside ? r + 12 : r * 0.62);
            const isRight = ((mid.mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < Math.PI;

            const pInner = midPoint(seg, r * 0.92);
            const pOuter = midPoint(seg, r + 10);
            const lineEndX = pOuter.x + (isRight ? 16 : -16);
            const labelX = lineEndX + (isRight ? 6 : -6);
            const labelText =
              labelType === "percent"
                ? formatPercent(seg.frac)
                : formatValue(seg.amount);

            return (
              <g key={`label-${i}`} aria-hidden="true">
                <polyline
                  points={`${pInner.x},${pInner.y} ${pOuter.x},${pOuter.y} ${lineEndX},${pOuter.y}`}
                  fill="none"
                  stroke="var(--axis-text, #6B7280)"
                  strokeWidth="1"
                />
                <circle cx={lineEndX} cy={pOuter.y} r="2" fill="var(--axis-text, #6B7280)" />
                <text
                  x={labelX}
                  y={pOuter.y}
                  textAnchor={isRight ? "start" : "end"}
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--color-text)"
                  style={{ paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 3 }}
                >
                  {labelText}
                </text>
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
        style={{ display: "grid", gap: 12, background: "var(--color-surface)", border: "2px solid var(--color-border)", borderRadius: 12, padding: 12, overflow: "hidden" }}
      >
        <ChartSvg />
        <Legend />
      </figure>
    );
  }

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
        border: "2px solid var(--color-border)",
        borderRadius: 12,
        padding: 12,
        overflow: "hidden",
      }}
    >
      <ChartSvg />
      <Legend />
      <style>{`
        @media (max-width: 720px) {
          figure[aria-label="${ariaLabel}"] { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
          figure[aria-label="${ariaLabel}"] text { font-size: 11px !important; }
        }
      `}</style>
    </figure>
  );
}

 // PUBLIC_INTERFACE
function formatCurrency(n) {
  try {
    return `$${Number(n).toLocaleString()}`;
  } catch {
    return `$${n}`;
  }
}
