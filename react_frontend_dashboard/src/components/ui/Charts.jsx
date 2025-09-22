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
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Small toolkit of charts using Recharts for the minimalist Pure White theme.
 * These components are intentionally simple to keep bundle size and complexity small.
 */

// PUBLIC_INTERFACE
export function TrendLineChart({ data, dataKey = "value", xKey = "date", color = "#374151", gradient = false, height = 220 }) {
  /** Minimal trend line chart. data: [{date, value}] */
  return (
    <div className="card" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        {gradient ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#trendGradient)" />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
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
// PUBLIC_INTERFACE
export function MultiSeriesLineChart({
  data,
  xKey = "date",
  series = [
    { key: "aws", label: "AWS", color: "#F59E0B" },   // amber
    { key: "azure", label: "Azure", color: "#3B82F6" }, // blue
    { key: "gcp", label: "GCP", color: "#10B981" },   // emerald
  ],
  height = 260,
  showLegend = true,
}) {
  /** Minimal multi-series line chart for provider trends with legend. */
  return (
    <div className="card" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
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
 * Multi-series Overview chart styled to match assets/overview_graph_design_notes.md
 * Expects data like: [{ name: "Item 1", s1: 10, s2: 22, s3: 14 }, ...]
 */
export function MultiSeriesOverviewChart({
  data,
  xKey = "name",
  seriesOrder = [
    // Renamed labels to cloud providers by default
    { key: "series2", label: "AWS", color: "var(--series-2)" },   // back
    { key: "series1", label: "Azure", color: "var(--series-1)" }, // middle
    { key: "series3", label: "GCP", color: "var(--series-3)" },   // front
  ],
  height = 260,
  // New dynamic axis props
  xTickFormatter,
  xAxisLabel = "",
  yAxisLabel = "Spend ($)",
  yDomain = [0, 50],
  yTicks = [0, 10, 20, 30, 40, 50],
}) {
  /** Styled multi-series line chart with right-aligned legend [graph | legend] layout. */
  const cardStyle = {
    background: "var(--bg-canvas)",
    border: "2px solid var(--accent-outline)",
    borderRadius: 8,
    padding: 16,
  };

  // Container for horizontal layout
  const layoutStyle = {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "stretch",
    gap: 16,
  };

  const chartContainerStyle = {
    minWidth: 0,
  };

  // Right-side legend: stacked vertically with minimalist typography
  const sideLegendStyle = {
    display: "grid",
    alignContent: "start",
    gap: 8,
    padding: "4px 0 4px 0",
    minWidth: 120,
  };

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

  const colorDot = (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
  });

  return (
    <div className="chart-card" style={cardStyle} role="figure" aria-label="Overview line chart: Series comparison by cloud provider">
      <div style={layoutStyle}>
        {/* Graph area (left) */}
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 16, right: 12, bottom: 36, left: 48 }}
            >
              <CartesianGrid stroke="var(--gridline)" vertical={false} strokeWidth={1} />
              <XAxis
                dataKey={xKey}
                tick={{ fill: "var(--axis-text)", fontSize: 12, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                tickFormatter={xTickFormatter}
                tickLine={false}
                axisLine={false}
                label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -4, fill: "var(--axis-text)", fontSize: 12 } : undefined}
              />
              <YAxis
                domain={yDomain}
                ticks={yTicks}
                tick={{ fill: "var(--axis-text)", fontSize: 12, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                tickLine={false}
                axisLine={false}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", offset: 12, fill: "var(--axis-text)", fontSize: 12 } : undefined}
              />
              {/* Tooltip retained for accessibility */}
              <Tooltip contentStyle={{ fontSize: 12 }} />

              {/* Render order matters: back -> front */}
              {seriesOrder.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                  activeDot={{ r: 4 }}
                  opacity={s.label === "AWS" || s.key === "series2" ? 0.9 : 1}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend area (right) */}
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

// PUBLIC_INTERFACE
export function StackedBarChart({ data, keys, colors, xKey = "name", height = 260, legend = true }) {
  /** Stacked bar chart for cost by provider/service. keys: ['aws','azure'] */
  return (
    <div className="card" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {legend && <Legend />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="a" fill={colors[i] || "#9CA3AF"} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DEFAULT_COLORS = ["#374151", "#9CA3AF", "#10B981", "#EF4444", "#3B82F6", "#F59E0B"];

// PUBLIC_INTERFACE
export function PieBreakdownChart({ data, dataKey = "value", nameKey = "name", colors = DEFAULT_COLORS, height = 260, innerRadius = 60 }) {
  /** Pie breakdown chart for category shares. data: [{name, value}] */
  return (
    <div className="card" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip />
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={Math.max(innerRadius + 40, 90)} innerRadius={innerRadius}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
