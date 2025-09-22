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
