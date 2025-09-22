import React from "react";

/**
 * PUBLIC_INTERFACE
 * PieChart component renders a simple SVG-based pie chart with legend.
 * Props:
 *  - data: Array<{ label: string, value: number, color: string }>
 *  - size?: number (px) - width/height of the chart (square)
 *  - strokeWidth?: number - gap thickness between slices (visual separation)
 *  - className?: string - additional classes for outer container
 *
 * Usage:
 *  <PieChart data={[{label:'AWS', value: 40, color:'#000000'}]} />
 */
export default function PieChart({
  data,
  size = 200,
  strokeWidth = 2,
  className = "",
}) {
  // Guard for empty or invalid data
  const safeData = Array.isArray(data) ? data.filter(d => d && typeof d.value === "number" && d.value >= 0) : [];
  const total = safeData.reduce((sum, d) => sum + d.value, 0);
  const radius = (size / 2) - strokeWidth;
  const center = size / 2;

  // If total is 0, render an empty state ring for visual consistency.
  const slices = total > 0 ? safeData : [{ label: "No data", value: 1, color: "#E5E7EB" }];

  // Compute paths for each slice using polar coords to cartesian
  let cumulative = 0;

  const polarToCartesian = (cx, cy, r, angle) => {
    const radians = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
      "L", cx, cy,
      "Z"
    ].join(" ");
  };

  const paths = slices.map((d, idx) => {
    const value = d.value;
    const fraction = total > 0 ? value / total : 1;
    const startAngle = cumulative * 360;
    const endAngle = (cumulative + fraction) * 360;
    cumulative += fraction;

    const pathD = describeArc(center, center, radius, startAngle, endAngle);
    return (
      <path
        key={`${d.label}-${idx}`}
        d={pathD}
        fill={d.color}
        stroke="#FFFFFF"
        strokeWidth={strokeWidth}
        shapeRendering="geometricPrecision"
      />
    );
  });

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Cloud spend share pie chart"
        >
          <title>Cloud spend share</title>
          {paths}
        </svg>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2">
          {safeData.map((d, idx) => (
            <div key={`${d.label}-legend-${idx}`} className="flex items-center gap-3">
              <span
                className="inline-block rounded-sm"
                style={{ width: 12, height: 12, backgroundColor: d.color }}
                aria-hidden
              />
              <div className="text-sm text-gray-700">
                <span className="font-medium">{d.label}</span>{" "}
                {total > 0 ? (
                  <span className="text-gray-500">
                    {((d.value / total) * 100).toFixed(1)}% (${d.value.toLocaleString()})
                  </span>
                ) : (
                  <span className="text-gray-500">0%</span>
                )}
              </div>
            </div>
          ))}
          {safeData.length === 0 && (
            <div className="text-sm text-gray-500">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
