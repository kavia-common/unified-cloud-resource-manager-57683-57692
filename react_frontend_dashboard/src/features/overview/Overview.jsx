import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { MultiSeriesOverviewChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";

// PUBLIC_INTERFACE
export default function Overview() {
  /** 
   * Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design.
   * Enhancement: Replaces the static "Monthly" label with a drop-down (Daily/Monthly/Yearly) that updates the chart with mock data.
   */
  const [stats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [mode, setMode] = useState("Monthly"); // Daily | Monthly | Yearly
  const [chartData, setChartData] = useState([]);

  // Helpers: generate mock data by mode
  const namesDaily = useMemo(() => Array.from({ length: 7 }, (_ , i) => `Day ${i + 1}`), []);
  const namesMonthly = useMemo(() => ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"], []);
  const namesYearly = useMemo(() => ["Y1", "Y2", "Y3", "Y4", "Y5"], []);

  function rand(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function buildSeriesFor(names, ranges) {
    // ranges: { s1:[min,max], s2:[min,max], s3:[min,max] }
    return names.map((name) => ({
      name,
      series1: rand(ranges.s1[0], ranges.s1[1]),
      series2: rand(ranges.s2[0], ranges.s2[1]),
      series3: rand(ranges.s3[0], ranges.s3[1]),
    }));
  }

  useEffect(() => {
    // Initialize with Monthly
    setChartData(buildSeriesFor(namesMonthly, { s1: [10, 40], s2: [5, 35], s3: [15, 50] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update data when mode changes (mock datasets per mode)
    if (mode === "Daily") {
      // smaller values for daily fluctuations; keep within 0..20
      setChartData(buildSeriesFor(namesDaily, { s1: [4, 16], s2: [2, 14], s3: [6, 20] }));
    } else if (mode === "Monthly") {
      setChartData(buildSeriesFor(namesMonthly, { s1: [10, 40], s2: [5, 35], s3: [15, 50] }));
    } else if (mode === "Yearly") {
      // larger aggregated values; keep within 0..100 for visual distinction
      setChartData(buildSeriesFor(namesYearly, { s1: [30, 80], s2: [20, 70], s3: [40, 100] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Minimalist select styling aligned with Pure White theme
  const selectStyles = {
    display: "inline-grid",
    alignItems: "center",
    gridAutoFlow: "column",
    gap: 8,
  };

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
          <div className="panel-title">Overview</div>
          <div style={selectStyles}>
            <label htmlFor="overview-mode" style={{ fontSize: 12, color: "var(--muted)" }}>
              Interval
            </label>
            <select
              id="overview-mode"
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Select time interval for overview chart"
              style={{ minWidth: 140 }}
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div className="panel-body">
          <MultiSeriesOverviewChart
            data={chartData}
            xKey="name"
            seriesOrder={[
              { key: "series2", label: "AWS", color: "var(--series-2)" },   // back
              { key: "series1", label: "Azure", color: "var(--series-1)" }, // middle
              { key: "series3", label: "GCP", color: "var(--series-3)" },   // front
            ]}
            height={260}
          />
        </div>
      </div>
    </div>
  );
}
