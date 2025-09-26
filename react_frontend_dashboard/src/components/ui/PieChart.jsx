import React, { useMemo, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * DonutChart component renders a minimalist donut (ring) chart with external labels,
 * styled per assets/donut_chart_design_notes.md.
 *
 * Props:
 *  - data: Array<{ label: string, value: number, color?: string }>
 *  - size?: number (px) - width/height of square canvas (default 320)
 *  - className?: string
 *
 * Behavior and styling:
 *  - No center content; hollow ring.
 *  - External two-line labels: first line = label, second = percentage.
 *  - No separate legend block (labels act as legend).
 *  - Start at 12 o'clock and proceed clockwise.
 *
 * Usage:
 *  <PieChart data={[{label:'Apples', value:30},{label:'Pears', value:20},{label:'Oranges', value:50}]} />
 *  Note: The file retains default export name PieChart for backward compatibility in imports.
 */
export default function PieChart({
  data,
  size = 320,
  className = "",
}) {
  // Normalize data: ensure array, non-negative values
  const safe = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((d) => d && typeof d.value === "number" && d.value >= 0 && d.label)
        .map((d) => ({
          ...d,
          // Fallback to CSS variables if no color provided
          color:
            d.color ||
            (d.label === "Apples"
              ? "var(--chart-apples)"
              : d.label === "Pears"
              ? "var(--chart-pears)"
              : d.label === "Oranges"
              ? "var(--chart-oranges)"
              : "#9CA3AF"),
        })),
    [data]
  );

  const total = useMemo(
    () => safe.reduce((s, d) => s + d.value, 0),
    [safe]
  );

  // Empty state ring when no data/zero total
  const hasData = total > 0 && safe.length > 0;

  // Design notes: outer ≈ 48% of min dim, inner ≈ 28%
  const outerR = Math.round((Math.min(size, size) * 0.48));
  const innerR = Math.round((Math.min(size, size) * 0.28));
  const ringThickness = Math.max(outerR - innerR, 12);
  const cx = size / 2;
  const cy = size / 2;

  // Label offset outside outer radius (8–12px)
  const labelOffset = Math.max(8, Math.round(size * 0.03));

  // Angles: start at 12 o'clock; proceed clockwise
  // We'll compute endAngle cumulatively with fractions of 360
  let acc = 0;
  const segments = (hasData ? safe : [{ label: "No data", value: 1, color: "var(--chart-empty,#E5E7EB)" }]).map(
    (d) => {
      const frac = hasData ? d.value / total : 1;
      const startDeg = acc * 360;
      const endDeg = (acc + frac) * 360;
      acc += frac;
      return { ...d, frac, startDeg, endDeg };
    }
  );

  // Convert polar angle (degrees, 0 at 3 o'clock) to cartesian
  const toXY = (r, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180; // shift so 0=12 o'clock
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    // NOTE: We won't invert direction here; we'll set path arc sweep accordingly.
  };

  // Build donut paths as two arcs forming a ring segment (outer + inner back)
  const buildPath = (rOuter, rInner, startDeg, endDeg) => {
    const large = endDeg - startDeg > 180 ? 1 : 0;

    // Outer arc (clockwise from start to end)
    const p1 = toXY(rOuter, startDeg);
    const p2 = toXY(rOuter, endDeg);

    // Inner arc (counter-clockwise from end back to start)
    const p3 = toXY(rInner, endDeg);
    const p4 = toXY(rInner, startDeg);

    return [
      "M", p1.x, p1.y,
      "A", rOuter, rOuter, 0, large, 1, p2.x, p2.y,
      "L", p3.x, p3.y,
      "A", rInner, rInner, 0, large, 0, p4.x, p4.y,
      "Z",
    ].join(" ");
  };

  // External labels: position at middle angle of each segment, just outside the ring
  const labelFor = (seg) => {
    const mid = (seg.startDeg + seg.endDeg) / 2;
    const p = toXY(outerR + labelOffset, mid);
    const percent = hasData ? Math.round(seg.frac * 100) : 0;

    // Alignment rule: if label is on the right half (angle in [-90,90]), left-align; else right-align
    const normalizedMid = ((mid % 360) + 360) % 360; // 0..359
    const rightSide = normalizedMid <= 90 || normalizedMid >= 270;

    const styleWrap = {
      position: "absolute",
      left: p.x,
      top: p.y,
      transform: `translate(${rightSide ? "0" : "-100%"}, -50%)`,
      textAlign: rightSide ? "left" : "right",
      pointerEvents: "none",
      color: "var(--chart-label-text)",
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      lineHeight: 1.15,
      letterSpacing: "0.2px",
      whiteSpace: "nowrap",
    };

    const catFont = {
      fontSize: size >= 480 ? 14 : size < 320 ? 11 : 12,
      fontWeight: 400,
    };
    const pctFont = {
      fontSize: size >= 480 ? 18 : size < 320 ? 14 : 16,
      fontWeight: 600,
    };

    return (
      <div key={`label-${seg.label}-${mid.toFixed(2)}`} style={styleWrap} aria-hidden>
        <div style={catFont}>{seg.label}</div>
        <div style={pctFont}>{percent}%</div>
      </div>
    );
  };

  // Optional hover emphasis (slight white stroke). Keep subtle per notes.
  const [hoverIdx, setHoverIdx] = useState(null);

  // Accessibility summary
  const ariaSummary = hasData
    ? `Donut chart showing ${safe.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(", ")}.`
    : "Donut chart with no data.";

  // Ensure order to match design if apples/pears/oranges are provided:
  // Pears (top), then Oranges, then Apples clockwise.
  const SEG_PRIORITY = { Pears: 0, Oranges: 1, Apples: 2 };
  const orderedSegments = [...segments].sort((a, b) => {
    const pa = SEG_PRIORITY[a.label] ?? 99;
    const pb = SEG_PRIORITY[b.label] ?? 99;
    return pa - pb;
  });

  // Recompute start/end after ordering to impose visual sequence
  let acc2 = 0;
  const finalSegments = orderedSegments.map((s) => {
    const startDeg = acc2 * 360;
    const endDeg = (acc2 + s.frac) * 360;
    acc2 += s.frac;
    return { ...s, startDeg, endDeg };
  });

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        padding: 16, // prevent clipping
        background: "var(--chart-bg, #FFFFFF)",
      }}
      role="img"
      aria-label={ariaSummary}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <title>Donut breakdown</title>
        <g transform={`translate(0, 0)`}>
          {/* Draw ring segments */}
          {finalSegments.map((seg, idx) => (
            <path
              key={`${seg.label}-${idx}`}
              d={buildPath(outerR, innerR, seg.startDeg, seg.endDeg)}
              fill={seg.color}
              stroke={hoverIdx === idx ? "#FFFFFF" : "none"}
              strokeWidth={hoverIdx === idx ? 1 : 0}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ transition: "stroke 120ms ease" }}
            />
          ))}
        </g>
      </svg>

      {/* External labels */}
      {hasData && finalSegments.map(labelFor)}
    </div>
  );
}
