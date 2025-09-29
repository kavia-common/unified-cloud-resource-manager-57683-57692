import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";
import FilterBar from "../../components/ui/Filters";
import { TrendLineChart, PieBreakdownChart } from "../../components/ui/Charts";

/** Costs analytics panel with stats, filters, trends and breakdown tables/charts. */
export default function Costs() {
  // Central filter state: all filter changes re-compute visualizations
  const [filters, setFilters] = useState({
    provider: "",
    account: "",
    region: "",
    service: "",
    tag: "",
    from: "",
    to: "",
  });

  // Seed mock dataset (acts like fetched data) - stable reference
  const [allRows] = useState(() => [
    // provider, account, region, service, amount, tags, date
    { provider: "aws", account_name: "prod", region: "us-east-1", service: "EC2", amount: 1240.22, tags: ["env:prod", "team:core"], date: "2025-09-01" },
    { provider: "aws", account_name: "prod", region: "us-east-1", service: "RDS", amount: 320.48, tags: ["env:prod"], date: "2025-09-04" },
    { provider: "aws", account_name: "sandbox", region: "us-west-2", service: "S3", amount: 98.11, tags: ["env:dev"], date: "2025-09-06" },

    { provider: "azure", account_name: "shared", region: "eastus", service: "VM", amount: 890.13, tags: ["env:shared", "team:data"], date: "2025-09-02" },
    { provider: "azure", account_name: "shared", region: "eastus", service: "Storage", amount: 140.67, tags: ["env:shared"], date: "2025-09-05" },
    { provider: "azure", account_name: "fin", region: "westeurope", service: "SQL", amount: 210.24, tags: ["env:prod", "team:fin"], date: "2025-09-08" },

    { provider: "gcp", account_name: "analytics", region: "us-central1", service: "Compute", amount: 210.25, tags: ["env:dev", "team:ml"], date: "2025-09-03" },
    { provider: "gcp", account_name: "analytics", region: "us-central1", service: "BigQuery", amount: 348.77, tags: ["env:prod", "team:ml"], date: "2025-09-07" },
  ]);

  // Build dropdown options from full dataset for consistency
  const accountOptions = useMemo(() => {
    return Array.from(new Set(allRows.map(r => r.account_name))).map(n => ({ value: n, label: n }));
  }, [allRows]);
  const regionOptions = useMemo(() => {
    return Array.from(new Set(allRows.map(r => r.region))).map(n => ({ value: n, label: n }));
  }, [allRows]);
  const serviceOptions = useMemo(() => {
    return Array.from(new Set(allRows.map(r => r.service))).map(n => ({ value: n, label: n }));
  }, [allRows]);
  const tagOptions = useMemo(() => {
    return Array.from(new Set(allRows.flatMap(r => Array.isArray(r.tags) ? r.tags : []).filter(Boolean))).map(t => ({ value: t, label: t }));
  }, [allRows]);

  // Apply filtering across all fields including date range
  const filteredRows = useMemo(() => {
    const fromTs = filters.from ? Date.parse(filters.from) : null;
    const toTs = filters.to ? Date.parse(filters.to) : null;

    return allRows.filter(r => {
      if (filters.provider && r.provider !== filters.provider) return false;
      if (filters.account && r.account_name !== filters.account) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.service && r.service !== filters.service) return false;
      if (filters.tag && !(Array.isArray(r.tags) && r.tags.includes(filters.tag))) return false;
      if (fromTs !== null || toTs !== null) {
        const rowTs = Date.parse(r.date);
        if (Number.isFinite(fromTs) && rowTs < fromTs) return false;
        if (Number.isFinite(toTs) && rowTs > toTs) return false;
      }
      return true;
    });
  }, [allRows, filters]);

  // Stats derived from filtered rows
  const monthly = useMemo(() => filteredRows.reduce((s, r) => s + Number(r.amount || 0), 0), [filteredRows]);
  const daily = useMemo(() => {
    // Approximate: divide filtered monthly by unique days covered in filtered set (or 30 fallback)
    const days = filteredRows.length > 0
      ? new Set(filteredRows.map(r => r.date)).size
      : 30;
    return days > 0 ? monthly / days : 0;
  }, [filteredRows, monthly]);

  const delta = 6.3; // mock stable delta for now

  // Pie: totals by provider based on filtered rows
  const providerTotals = useMemo(() => {
    const map = {};
    for (const r of filteredRows) {
      const k = r.provider || "unknown";
      map[k] = (map[k] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filteredRows]);

  // Trend line: sum by day for filtered rows
  const trend = useMemo(() => {
    // Collect unique dates from filtered rows; if empty, show last 7 days with zeros
    const dateSet = new Set(filteredRows.map(r => r.date));
    let dates = Array.from(dateSet).sort();
    if (dates.length === 0) {
      const days = 7;
      dates = new Array(days).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - i - 1));
        return d.toISOString().slice(0, 10);
      });
    }
    const byDate = {};
    for (const r of filteredRows) {
      byDate[r.date] = (byDate[r.date] || 0) + Number(r.amount || 0);
    }
    return dates.map(d => ({
      date: d.slice(5, 10), // MM-DD
      value: Number((byDate[d] || 0).toFixed(2)),
    }));
  }, [filteredRows]);

  const breakdownColumns = [
    { key: "provider", label: "Provider" },
    { key: "account_name", label: "Account" },
    { key: "region", label: "Region" },
    { key: "service", label: "Service" },
    {
      key: "amount",
      label: "Monthly ($)",
      render: (v) => (v ? Number(v).toFixed(2) : 0),
    },
    { key: "date", label: "Date" },
  ];

  return (
    <div style={{ display: "grid", gap: 16, minWidth: 0, width: "100%" }}>
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
        accountOptions={accountOptions}
        regionOptions={regionOptions}
        serviceOptions={serviceOptions}
        tagOptions={tagOptions}
      />

      <div
        className="costs-grid"
      >
        <div style={{ minWidth: 0 }}>
          <div className="panel" style={{ overflow: "hidden" }}>
            <div className="panel-header">
              <div className="panel-title">Daily Spend Trend</div>
              <div className="badge">Trend</div>
            </div>
            <div className="panel-body">
              <TrendLineChart data={trend} dataKey="value" xKey="date" gradient color="#3B82F6" />
            </div>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
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

      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-header">
          <div className="panel-title">Cost Breakdown (tabular)</div>
        </div>
        <div className="panel-body" style={{ minWidth: 0 }}>
          <div style={{ width: "100%", minWidth: 0 }}>
            <DataTable
              columns={breakdownColumns}
              rows={filteredRows}
              emptyMessage="No cost data for selected filters."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
