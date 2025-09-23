import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';

/**
 * PUBLIC_INTERFACE
 * RadarResourceChart
 * A minimalist radar chart to visualize resource categories (Computers, Storage, Databases, Networking).
 * Props:
 *  - data: Array<{ category: string; value: number }>
 *  - height?: number (default 280)
 *  - colors?: string[] (defaults to violet-accented palette)
 */
const RadarResourceChart = ({ data, height = 280, colors }) => {
  /** Minimalist Pure White theme with violet accent */
  const palette =
    colors && colors.length
      ? colors
      : ['#7C3AED', '#0EA5E9', '#10B981', '#7C3AED']; // violet, sky, emerald, repeat violet

  // Map categories to colors deterministically
  const categoryColor = {};
  data.forEach((d, idx) => {
    categoryColor[d.category] = palette[idx % palette.length];
  });

  // Recharts RadarChart expects one or more Radar elements. We create one Radar per category color
  // by transforming data into a single series with fill/ stroke set via a resolver.
  // Since RadarChart typically overlays one or more series across the same axes,
  // we can render a single Radar for combined values and rely on angle axis categories.
  // However, to meet "each in a different color", we render multiple Radars with masked data.
  const categories = data.map((d) => d.category);

  const series = categories.map((category) => {
    return data.map((d) => ({
      ...d,
      // value only for the matching category, otherwise 0 to prevent drawing in other angles
      valueMasked: d.category === category ? d.value : 0,
    }));
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the real value for the hovered category
      const item = data.find((d) => d.category === label);
      return (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            padding: '8px 10px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(17, 24, 39, 0.06)',
            color: '#111827',
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div>
            Value: <strong>{item ? item.value : 0}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 12,
      }}
      role="region"
      aria-label="Resource Radar Chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke="#E5E7EB"
            gridType="polygon"
            radialLines={false}
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            stroke="#F3F4F6"
          />
          {series.map((s, idx) => (
            <Radar
              key={`radar-${categories[idx]}`}
              name={categories[idx]}
              dataKey="valueMasked"
              data={s}
              stroke={categoryColor[categories[idx]]}
              fill={categoryColor[categories[idx]]}
              fillOpacity={0.25}
              dot={false}
              isAnimationActive={true}
              animationDuration={500}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={24}
            iconType="circle"
            wrapperStyle={{
              fontSize: 12,
              color: '#6B7280',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarResourceChart;
