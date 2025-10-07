import React from 'react';

/**
 * PUBLIC_INTERFACE
 * RadarResourceChart
 * Minimalist circular labels visualization replacing the radar chart.
 * Renders only the four category names at top/right/bottom/left around an invisible circle.
 * No lines, axes, polygons, or markers.
 *
 * Props:
 *  - data: Array<{ category: string; value?: number }>  // category names used in order; value ignored
 *  - height?: number (default 280)                       // container square dimension (height = width)
 *
 * Styling per assets/radar_circular_labels_design_notes.md:
 *  - Color: #6B7280
 *  - Font: "Helvetica Neue", Arial, sans-serif, 12px, regular
 *  - Labels positioned at radius ~40% of size, with outward 6px nudge
 */
const RadarResourceChart = ({ data, height = 280 }) => {
  const defaultCats = ['Computers', 'Storage', 'Databases', 'Networking'];
  const labels = Array.isArray(data) && data.length
    ? data.map(d => d.category)
    : defaultCats;

  // Radius scale (fraction of half-viewBox), outward offset in px units of SVG
  const radiusScale = 0.4; // 40% of half-box as per design notes
  const R = 100 * radiusScale; // since viewBox is -100..100
  const OUT = 6; // outward nudge

  const positions = [
    { text: labels[0] || defaultCats[0], x: 0,   y: -R, anchor: 'middle', dx: 0,   dy: -OUT }, // top
    { text: labels[1] || defaultCats[1], x: R,   y: 0,   anchor: 'start',  dx: OUT, dy: 0    }, // right
    { text: labels[2] || defaultCats[2], x: 0,   y: R,   anchor: 'middle', dx: 0,   dy: OUT + 6 }, // bottom (extra dy to sit below baseline)
    { text: labels[3] || defaultCats[3], x: -R,  y: 0,   anchor: 'end',    dx: -OUT,dy: 0    }, // left
  ];

  // Outer container: square and responsive, using height prop for both dims
  const wrapperStyle = {
    width: '100%',
    height,
    display: 'grid',
    placeItems: 'center',
    background: 'var(--bg-canvas, #FFFFFF)',
    border: '1px solid var(--border, #E5E7EB)',
    borderRadius: 12,
    padding: 12,
  };

  // Maintain square area inside wrapper using aspect-ratio
  const squareStyle = {
    width: '100%',
    aspectRatio: '1 / 1',
  };

  const labelStyle = {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontSize: 12,
    fontWeight: 400,
    fill: '#6B7280',
  };

  return (
    <div style={wrapperStyle} role="img" aria-label="Category overview: Computers, Storage, Databases, Networking">
      <svg viewBox="-100 -100 200 200" style={squareStyle} preserveAspectRatio="xMidYMid meet">
        <title>Category overview: Computers, Storage, Databases, Networking</title>
        <g style={labelStyle}>
          {positions.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor={p.anchor}
              dominantBaseline="middle"
              dx={p.dx}
              dy={p.dy}
            >
              {p.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default RadarResourceChart;
