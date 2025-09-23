import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

/**
 * PUBLIC_INTERFACE
 * RadarResourceChart
 * Minimalist radar framework that renders only axes and category labels (no data, no legend/tooltip).
 * Props:
 *  - data: Array<{ category: string; value?: number }>  // value ignored
 *  - height?: number (default 280)
 */
const RadarResourceChart = ({ data, height = 280 }) => {
  // Enforce exact categories order if provided; otherwise fallback to defaults
  const defaultCats = ['Computers', 'Storage', 'Databases', 'Networking'];
  const categories = Array.isArray(data) && data.length
    ? data.map((d) => d.category)
    : defaultCats;

  // Build a data array that Recharts can consume for angle axis labels only.
  // Values are constant and minimal, and we hide radius ticks/axis to avoid visual data regions.
  const axisOnlyData = categories.map((c) => ({ category: c, value: 1 }));

  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#FFFFFF',
        border: '1px solid var(--border, #E5E7EB)',
        borderRadius: 12,
        padding: 12,
      }}
      role="img"
      aria-label="Resource categories: Computers, Storage, Databases, Networking"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={axisOnlyData}>
          {/* Polygon frame only, no radial lines to keep it clean */}
          <PolarGrid
            stroke="var(--gridline, #EDEFF2)"
            gridType="polygon"
            radialLines={false}
          />
          {/* Category labels around the circle */}
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fill: 'var(--axis-text, #6B6F75)',
              fontSize: 12,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
            tickLine={false}
          />
          {/* Hide radius ticks and line to avoid suggesting any data values */}
          <PolarRadiusAxis
            tick={false}
            axisLine={false}
            tickLine={false}
            stroke="transparent"
          />
          {/* Intentionally no Radar, Tooltip, or Legend -> no data regions/lines/dots */}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarResourceChart;
