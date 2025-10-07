import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * PUBLIC_INTERFACE
 * Shared chart color palette for cloud providers to ensure visual consistency
 * across chart types (bar, pie, etc).
 */
export const CLOUD_COLORS = {
  AWS: "#000000",      // black
  Azure: "#1a237e",    // dark blue
  GCP: "var(--series-3)", // token for GCP
};

/**
 * PUBLIC_INTERFACE
 * Minimal trend line chart. data: [{date, value}]
 */
export function TrendLineChart({ data, dataKey = "value", xKey = "date", color = "#64a9ff", gradient = false, height = 220 }) {
  return (
    <div className="card surface" style={{ padding: 8, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height}>
        {gradient ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#trendGradient)" />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Multi-series line chart with legend. Expects data like:
 * [{ date: '09-01', aws: 12, azure: 10, gcp: 8 }, ...]
 */
export function MultiSeriesLineChart({
  data,
  xKey = "date",
  series = [
    { key: "aws", label: "AWS", color: "#d1d6de" },   // light gray on dark
    { key: "azure", label: "Azure", color: "#64a9ff" }, // light blue
    { key: "gcp", label: "GCP", color: "#23c78a" },   // emerald
  ],
  height = 260,
  showLegend = true,
}) {
  return (
    <div className="card surface" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
          <Tooltip />
          {showLegend && <Legend />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="linear"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Multi-series Overview bar chart styled for dark theme.
 * Expects data like: [{ name: "Item 1", series1: 10, series2: 22, series3: 14 }, ...]
 */
export function MultiSeriesOverviewChart({
  data,
  xKey = "name",
  seriesOrder = [
    { key: "series2", label: "AWS", color: "#d1d6de" },  // back
    { key: "series1", label: "Azure", color: "#64a9ff" },// middle
    { key: "series3", label: "GCP", color: "#23c78a" },  // front
  ],
  height = 260,
  xTickFormatter,
  xAxisLabel = "",
  yAxisLabel = "Spend ($)",
  yDomain = [0, 50],
  yTicks = [0, 10, 20, 30, 40, 50],
}) {
  const cardStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: 16,
    color: "var(--color-text)",
  };
  const layoutStyle = { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "stretch", gap: 16 };
  const chartContainerStyle = { minWidth: 0 };
  const sideLegendStyle = { display: "grid", alignContent: "start", gap: 8, padding: "4px 0", width: "min(140px, 35vw)" };
  const legendItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--legend-text)",
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
  const colorDot = (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color });

  return (
    <div className="chart-card" style={cardStyle} role="figure" aria-label="Overview bar chart: Series comparison by cloud provider">
      <div style={layoutStyle}>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 16, right: 12, bottom: 36, left: 48 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} strokeWidth={1} />
              <XAxis
                dataKey={xKey}
                tick={{ fill: "var(--axis-text)", fontSize: 12, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                tickFormatter={xTickFormatter}
                tickLine={false}
                axisLine={false}
                label={
                  xAxisLabel
                    ? { value: xAxisLabel, position: "insideBottom", offset: -4, fill: "var(--axis-text)", fontSize: 12 }
                    : undefined
                }
              />
              <YAxis
                domain={yDomain}
                ticks={yTicks}
                tick={{ fill: "var(--axis-text)", fontSize: 12, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                tickLine={false}
                axisLine={false}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", offset: 12, fill: "var(--axis-text)", fontSize: 12 } : undefined}
              />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {seriesOrder.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[3, 3, 0, 0]}
                  barSize={Math.max(8, 24 - seriesOrder.length * 2)}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div aria-label="Chart legend" style={sideLegendStyle}>
          {seriesOrder.map((s) => (
            <div key={s.key} className="legend-item" style={legendItemStyle}>
              <span aria-hidden="true" style={colorDot(s.color)} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Stacked bar chart for cost by provider/service. keys: ['aws','azure']
 */
export function StackedBarChart({ data, keys, colors, xKey = "name", height = 260, legend = true }) {
  return (
    <div className="card surface" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
          <Tooltip />
          {legend && <Legend />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="a" fill={colors?.[i] || "#9CA3AF"} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DEFAULT_COLORS = ["#64a9ff", "#d1d6de", "#23c78a", "#ff5d5d", "#5fb3ff", "#f8b84b"];

/**
 * PUBLIC_INTERFACE
 * Pie breakdown chart for category shares. data: [{name, value}]
 */
export function PieBreakdownChart({ data, dataKey = "value", nameKey = "name", colors = DEFAULT_COLORS, height = 260, innerRadius = 60 }) {
  return (
    <div className="card surface" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <RPieChart>
          <Tooltip />
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={Math.max(innerRadius + 40, 90)} innerRadius={innerRadius}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </RPieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Default simple Charts wrapper (kept for compatibility with prior usage).
 */
export default function Charts() {
  return (
    <div className="Charts surface" style={{ padding: 12, color: 'var(--color-text-muted)' }}>
      Charts
    </div>
  );
}
