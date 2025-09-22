import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";
import FilterBar from "../../components/ui/Filters";
import { TrendLineChart, StackedBarChart, PieBreakdownChart } from "../../components/ui/Charts";

/** Costs analytics panel with stats, filters, trends and breakdown tables/charts. */
export default function Costs() {
  const [daily, setDaily] = useState(123.45);
  const [monthly, setMonthly] = useState(2789.12);
  const [delta, setDelta] = useState(6.3);
  const [breakdown, setBreakdown] = useState([]);

  const [filters, setFilters] = useState({
    provider: "",
    account: "",
    region: "",
    service: "",
    tag: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    // mock breakdown rows
    const rows = [
      { provider: "aws", account_name: "prod", service: "EC2", amount: 1240.22 },
      { provider: "aws", account_name: "prod", service: "RDS", amount: 320.48 },
      { provider: "azure", account_name: "shared", service: "VM", amount: 890.13 },
      { provider: "azure", account_name: "shared", service: "Storage", amount: 140.67 },
    ];
    const filtered = rows.filter(r => !filters.provider || r.provider === filters.provider);
    setBreakdown(filtered);
  }, [filters.provider]);

  const breakdownColumns = [
    { key: "provider", label: "Provider" },
    { key: "account_name", label: "Account" },
    { key: "service", label: "Service" },
    {
      key: "amount",
      label: "Monthly ($)",
      render: (v) => (v ? Number(v).toFixed(2) : 0),
    },
  ];

  const providerTotals = useMemo(() => {
    const map = {};
    for (const r of breakdown) {
      const k = r.provider || "unknown";
      map[k] = (map[k] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [breakdown]);

  const trend = useMemo(() => {
    const days = 30;
    const base = monthly / days;
    return new Array(days).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 86400000).toISOString().slice(5, 10),
      value: Number((base * (0.9 + Math.random() * 0.2)).toFixed(2)),
    }));
  }, [monthly]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card-grid">
        <StatCard
          label="Daily Spend"
          value={`$${daily.toFixed(2)}`}
          deltaLabel={`${delta.toFixed(1)}% vs 7d`}
          deltaType={delta >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Projected Month"
          value={`$${monthly.toFixed(2)}`}
          deltaLabel="Projection"
        />
        <StatCard label="High-Cost Accounts" value="3" deltaLabel="Top 10%" />
        <StatCard
          label="Idle Spend Est."
          value="$214.90"
          deltaLabel="Potential save"
        />
      </div>

      <FilterBar
        values={filters}
        onChange={setFilters}
        providerOptions={[
          { value: "aws", label: "AWS" },
          { value: "azure", label: "Azure" },
          { value: "gcp", label: "GCP" },
        ]}
      />

      <div
        className="card-grid"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      >
        <div style={{ gridColumn: "span 8" }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Daily Spend Trend</div>
              <div className="badge">Trend</div>
            </div>
            <div className="panel-body">
              <TrendLineChart data={trend} dataKey="value" xKey="date" gradient color="#3B82F6" />
            </div>
          </div>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Spend by Provider</div>
              <div className="badge">Share</div>
            </div>
            <div className="panel-body">
              <PieBreakdownChart data={providerTotals} dataKey="value" nameKey="name" />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Cost Breakdown (tabular)</div>
        </div>
        <div className="panel-body">
          <DataTable
            columns={breakdownColumns}
            rows={breakdown}
            emptyMessage="No cost data yet."
          />
        </div>
      </div>
    </div>
  );
}
