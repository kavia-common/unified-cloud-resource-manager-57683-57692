import React, { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { MultiSeriesLineChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";

// PUBLIC_INTERFACE
export default function Overview() {
  /** Overview dashboard with a curved-edge banner header, key stats, and a synthetic spend trend. */
  const [stats, setStats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    // Build 30 days of placeholder per-provider spend (AWS, Azure, GCP)
    const n = 30;
    const seedAws = stats.daily * 0.45;
    const seedAzure = stats.daily * 0.35;
    const seedGcp = stats.daily * 0.20;

    const series = new Array(n).fill(0).map((_, i) => {
      const date = new Date(Date.now() - (n - i - 1) * 86400000)
        .toISOString()
        .slice(5, 10);
      const aws = Number((seedAws * (0.9 + Math.random() * 0.2)).toFixed(2));
      const azure = Number((seedAzure * (0.9 + Math.random() * 0.2)).toFixed(2));
      const gcp = Number((seedGcp * (0.9 + Math.random() * 0.2)).toFixed(2));
      return { date, aws, azure, gcp };
    });
    setTrend(series);
  }, [stats.daily]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Banner
        title="Welcome back!"
        subtitle="Manage, monitor, and optimize your cloud with ease"
        align="left"
      />

      <div className="card-grid">
        <StatCard label="Linked Accounts" value={stats.accounts} />
        <StatCard label="Discovered Resources" value={stats.resources} />
        <StatCard label="Daily Spend" value={`$${Number(stats.daily).toFixed(2)}`} />
        <StatCard label="Open Recommendations" value={stats.recs} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Daily Spend Trend</div>
          <div className="badge">Last 30 days</div>
        </div>
        <div className="panel-body">
          <MultiSeriesLineChart
            data={trend}
            xKey="date"
            series={[
              { key: "aws", label: "AWS", color: "#F59E0B" },   // amber
              { key: "azure", label: "Azure", color: "#3B82F6" }, // blue
              { key: "gcp", label: "GCP", color: "#10B981" },   // emerald
            ]}
            height={260}
            showLegend
          />
        </div>
      </div>
    </div>
  );
}
