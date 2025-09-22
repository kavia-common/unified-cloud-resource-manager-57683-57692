import React, { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { MultiSeriesOverviewChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";

// PUBLIC_INTERFACE
export default function Overview() {
  /** Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design. */
  const [stats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Build 5 categories "Item 1".."Item 5" with values within 0..50 per design notes.
    const names = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"];
    const rand = (min, max) => Math.round(min + Math.random() * (max - min));
    const data = names.map((name, i) => ({
      name,
      // Ensure reasonable variation and remain within 0..50
      series1: rand(10, 40), // medium gray, middle
      series2: rand(5, 35),  // light gray, back
      series3: rand(15, 50), // magenta, front/highlight
    }));
    setChartData(data);
  }, []);

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
          <div className="panel-title">Series Comparison</div>
          <div className="badge">Overview</div>
        </div>
        <div className="panel-body">
          <MultiSeriesOverviewChart
            data={chartData}
            xKey="name"
            seriesOrder={[
              { key: "series2", label: "Series 2", color: "var(--series-2)" }, // back
              { key: "series1", label: "Series 1", color: "var(--series-1)" }, // middle
              { key: "series3", label: "Series 3", color: "var(--series-3)" }, // front
            ]}
            height={260}
          />
        </div>
      </div>
    </div>
  );
}
