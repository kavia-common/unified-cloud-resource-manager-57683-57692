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
  AWS: "#4cc9f0",
  Azure: "#7209b7",
  GCP: "#b545ff",
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
    { key: "aws", label: "AWS", color: "#d1d6de" },
    { key: "azure", label: "Azure", color: "#64a9ff" },
    { key: "gcp", label: "GCP", color: "#23c78a" },
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
    { key: "series2", label: "AWS", color: "#d1d6de" },
    { key: "series1", label: "Azure", color: "#64a9ff" },
    { key: "series3", label: "GCP", color: "#23c78a" },
  ],
  height = 260,
  xTickFormatter,
  xAxisLabel = "",
  yAxisLabel = "Spend ($)",
  yDomain = [0, 50],
  yTicks = [0, 10, 20, 30, 40, 50],
  // PUBLIC_INTERFACE
  // Force horizontal bars: ignore external overrides to avoid regressions from callers.
  // In Recharts, BarChart layout="vertical" => horizontal bars with categories on Y axis.
  // We intentionally do NOT expose a 'layout' prop to callers.
}) {
  // Card styling for Pure White minimalist theme
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

  // Number formatting with thousands separators
  const formatNumber = (n) => {
    try {
      return Number(n).toLocaleString();
    } catch {
      return String(n);
    }
  };

  return (
    <div className="chart-card" style={cardStyle} role="figure" aria-label="Overview bar chart: Series comparison by cloud provider" data-testid="overview-chart-wrapper">
      <div style={layoutStyle}>
        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height={height}>
            {/* Horizontal orientation: layout='vertical', categories on Y axis */}
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 12, right: 24, bottom: 12, left: 72 }} // extra left for long labels, right for values
              data-testid="overview-horizontal-bar-chart"
            >
              {/* Gridlines removed for clean look per dark theme requirement */}
              {/* Intentionally no CartesianGrid to avoid dotted/contrasting lines on dark */}

              {/* Categories on Y axis */}
              <YAxis
                dataKey={xKey}
                type="category"
                width={64}
                tick={{
                  fill: "var(--axis-text)",
                  fontSize: 12,
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
                tickFormatter={xTickFormatter}
                tickLine={false}
                axisLine={false}
                label={
                  xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: "insideLeft",
                        offset: -8,
                        fill: "var(--axis-text)",
                        fontSize: 12,
                      }
                    : undefined
                }
              />

              {/* Values on X axis */}
              <XAxis
                type="number"
                domain={yDomain}
                ticks={yTicks}
                tick={{
                  fill: "var(--axis-text)",
                  fontSize: 12,
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
                tickFormatter={(v) => formatNumber(v)}
                tickLine={false}
                axisLine={false}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        position: "insideBottomRight",
                        offset: -4,
                        fill: "var(--axis-text)",
                        fontSize: 12,
                      }
                    : undefined
                }
              />

              <Tooltip
                formatter={(value, name) => formatNumber(value)}
                contentStyle={{ fontSize: 12, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                cursor={false}
              />

              {/* Bars - keep API stable, just orientation change applies automatically */}
              {seriesOrder.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[0, 3, 3, 0]} // round right edges in horizontal layout
                  barSize={Math.max(10, 24 - seriesOrder.length * 2)}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Removed debug caption near chart to keep UI clean */}
        <div style={{ display: "none" }}>
          <span data-testid="horizontal-bar-chart-active" />
        </div>

        {/* Side legend kept consistent with minimalist theme */}
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
export function StackedBarChart({
  data,
  keys,
  colors,
  xKey = "name",
  height = 260,
  legend = true,
  // PUBLIC_INTERFACE: Optional layout override; default horizontal (vertical layout).
  layout = "vertical",
}) {
  const isHorizontal = layout === "vertical";
  return (
    <div className="card surface" style={{ padding: 8 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={layout} data-testid="stacked-horizontal-bar-chart">
          {/* Grid removed to eliminate dotted lines; axis ticks retain contrast via CSS vars */}
          {isHorizontal ? (
            <>
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} type="category" tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
              <YAxis type="number" tick={{ fontSize: 12, fill: "var(--axis-text)" }} />
            </>
          )}
          <Tooltip />
          {legend && <Legend />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="a" fill={colors?.[i] || "#9CA3AF"} radius={isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]} />
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
export function PieBreakdownChart({
  data,
  dataKey = "value",
  nameKey = "name",
  colors = DEFAULT_COLORS,
  // Increase default height to better accommodate centered labels
  height = 300,
  // Increase innerRadius to create donut center space for the value label
  innerRadius = 72,
}) {
  // Ensure provider name fallback (AWS/Azure/GCP)
  const normalizedData = Array.isArray(data)
    ? data.map((d, i) => {
        const idxMap = { 0: "AWS", 1: "Azure", 2: "GCP" };
        const providerName =
          d?.[nameKey] ?? d?.name ?? d?.label ?? (i in idxMap ? idxMap[i] : `Item ${i + 1}`);
        return { ...d, [nameKey]: providerName, name: providerName };
      })
    : [];

  const formatNumber = (n) => {
    try {
      return Number(n).toLocaleString();
    } catch {
      return String(n);
    }
  };

  // PUBLIC_INTERFACE
  // Centered label renderer that places the total/value text inside the donut at (cx, cy).
  // This ensures values like "$12,450" never overflow the card.
  const renderCenterLabel = ({ cx, cy, value }) => {
    const valueFormatted = formatNumber(value);
    const fontSize = 13; // reduced for safety on smaller cards
    return (
      <g pointerEvents="none">
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text, #111827)"
          fontSize={fontSize}
          fontWeight={700}
        >
          ${valueFormatted}
        </text>
      </g>
    );
  };

  // Add outer margins so labels are not clipped; increase on small screens
  const chartMargin = { top: 20, right: 36, bottom: 20, left: 36 };

  return (
    <div
      className="card surface"
      style={{
        padding: 16,
        // Ensure enough vertical space for labels and prevent clipping
        minHeight: Math.max(280, height),
        // Important: contain visuals while keeping a clean look
        overflow: "hidden",
        position: "relative",
        // Thicker border and slightly larger radius for prominence
        border: "2px solid var(--color-border, #E5E7EB)",
        borderRadius: 12,
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RPieChart margin={chartMargin}>
          <Tooltip />
          <Pie
            data={normalizedData}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            // Slightly reduce outer radius growth to keep more inner space
            outerRadius={Math.max(innerRadius + 36, 92)}
            // Force inner centered label and no label lines
            labelLine={false}
            label={renderCenterLabel}
            isAnimationActive={false}
          >
            {normalizedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </RPieChart>
      </ResponsiveContainer>
      <style>{`
        /* Ensure any text inside the chart wraps/clamps visually and stays in bounds */
        .card.surface svg text {
          font-size: 12px;
        }
        @media (max-width: 640px) {
          .card.surface:has(svg) { padding: 12px !important; min-height: 260px; }
          .card.surface svg text { font-size: 11px !important; }
        }
        @media (max-width: 520px) {
          .card.surface:has(svg) { padding: 10px !important; min-height: 240px; }
          .card.surface svg text { font-size: 10px !important; }
        }
      `}</style>
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
