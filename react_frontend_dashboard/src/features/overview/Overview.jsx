import React, { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { TrendLineChart } from "../../components/ui/Charts";

// PUBLIC_INTERFACE
export default function Overview() {
  /** Overview dashboard showing a friendly welcome, key stats, and a synthetic spend trend. */
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
      {/* Minimalist greeting — Pure White style */}
      <section
        aria-label="Welcome"
        style={{
          background: "var(--bg)",
          padding: "4px 2px 6px",
          borderRadius: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1.2,
            fontWeight: 800,
            color: "#374151",
            letterSpacing: 0.2,
          }}
        >
          Cross-Cloud Resource Manager
        </h1>
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: 15,
            lineHeight: 1.6,
            color: "#9CA3AF",
            maxWidth: 880,
          }}
        >
          Unified visibility and control for AWS and Azure—link accounts, explore inventory, track real-time spend,
          act on AI-driven recommendations, and automate operations with rules. Built for a clean, focused workflow.
        </p>
      </section>

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
