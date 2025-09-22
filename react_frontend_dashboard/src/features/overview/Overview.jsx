import React, { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { TrendLineChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";

// PUBLIC_INTERFACE
export default function Overview() {
  /** Overview dashboard with a curved-edge banner header, key stats, and a synthetic spend trend. */
  const [stats, setStats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    const n = 30;
    const base = stats.daily;
    const t = new Array(n).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (n - i - 1) * 86400000).toISOString().slice(5, 10),
      value: Number((base * (0.9 + Math.random() * 0.2)).toFixed(2)),
    }));
    setTrend(t);
  }, [stats.daily]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Banner
        // Show only a friendly welcome message; no app/project name
        title="Welcome back!"
        subtitle=""
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
          <TrendLineChart data={trend} dataKey="value" xKey="date" gradient color="#3B82F6" />
        </div>
      </div>
    </div>
  );
}
