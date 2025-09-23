import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { MultiSeriesOverviewChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";
import PieChart from "../../components/ui/PieChart";
import { CLOUD_COLORS } from "../../components/ui/Charts";
import CostAnomalyAlert from "../../components/ui/CostAnomalyAlert";
import { Modal } from "../../components/ui/Modal";

// PUBLIC_INTERFACE
export default function Overview() {
  /** 
   * Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design.
   * Enhancement: Dynamic axes/labels for Daily/Monthly/Yearly with mock data.
   */
  const [stats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [mode, setMode] = useState("Monthly"); // Daily | Monthly | Yearly
  const [chartData, setChartData] = useState([]);

  // Local modal states for the four stat cards
  const [showAccounts, setShowAccounts] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showDailySpend, setShowDailySpend] = useState(false);
  const [showRecs, setShowRecs] = useState(false);

  // X-axis categories per mode
  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => h), []);
  const daysInMonth = useMemo(() => Array.from({ length: 31 }, (_, d) => d + 1), []);
  const months = useMemo(() => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], []);

  function rand(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  // Build data rows for current x-domain (will map into { name, series1, series2, series3 })
  function buildSeriesFor(xValues, ranges, nameFormatter = (x) => String(x)) {
    return xValues.map((x) => ({
      name: nameFormatter(x),
      series1: rand(ranges.s1[0], ranges.s1[1]),
      series2: rand(ranges.s2[0], ranges.s2[1]),
      series3: rand(ranges.s3[0], ranges.s3[1]),
    }));
  }

  // Compute axis configuration for the chart based on mode
  function computeAxisConfig(selectedMode) {
    if (selectedMode === "Daily") {
      return {
        xTickFormatter: (v) => `${v}:00`,
        xLabel: "Hour of Day",
        yLabel: "Spend ($)",
        yDomain: [0, 25],
        yTicks: [0, 5, 10, 15, 20, 25],
      };
    }
    if (selectedMode === "Monthly") {
      return {
        xTickFormatter: (v) => `${v}`,
        xLabel: "Day of Month",
        yLabel: "Spend ($)",
        yDomain: [0, 60],
        yTicks: [0, 10, 20, 30, 40, 50, 60],
      };
    }
    // Yearly
    return {
      xTickFormatter: (v) => v,
      xLabel: "Month",
      yLabel: "Spend ($)",
      yDomain: [0, 120],
      yTicks: [0, 20, 40, 60, 80, 100, 120],
    };
  }

  // Initialize with Monthly mock data
  useEffect(() => {
    setChartData(buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when mode changes
  useEffect(() => {
    if (mode === "Daily") {
      setChartData(buildSeriesFor(hours, { s1: [2, 16], s2: [1, 14], s3: [3, 20] }, (h) => `${h}`));
    } else if (mode === "Monthly") {
      setChartData(buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`));
    } else if (mode === "Yearly") {
      setChartData(buildSeriesFor(months, { s1: [25, 90], s2: [20, 80], s3: [30, 100] }, (m) => m));
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

  // Axis config for current mode
  const axis = computeAxisConfig(mode);

  // Mock spend totals for pie chart by interval
  const pieTotals = useMemo(() => {
    switch (mode) {
      case "Daily":
        return { AWS: 420, Azure: 350, GCP: 230 };
      case "Yearly":
        return { AWS: 42000, Azure: 36000, GCP: 26000 };
      case "Monthly":
      default:
        return { AWS: 8200, Azure: 6900, GCP: 5200 };
    }
  }, [mode]);

  const pieData = useMemo(() => ([
    { label: "AWS", value: pieTotals.AWS, color: CLOUD_COLORS.AWS },
    { label: "Azure", value: pieTotals.Azure, color: CLOUD_COLORS.Azure },
    { label: "GCP", value: pieTotals.GCP, color: CLOUD_COLORS.GCP },
  ]), [pieTotals]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Banner
        title="Welcome back!"
        subtitle="Manage, monitor, and optimize your cloud with ease"
        align="left"
      />

      {/* Prominent Cost Anomaly Alert */}
      <div style={{ marginTop: 4 }}>
        <CostAnomalyAlert
          provider="Azure"
          message="Cost spike detected on Azure: +27% week-on-week"
        />
      </div>

      <div className="card-grid">
        <StatCard label="Linked Accounts" value={stats.accounts} onClick={() => setShowAccounts(true)} />
        <StatCard label="Discovered Resources" value={stats.resources} onClick={() => setShowResources(true)} />
        <StatCard label="Daily Spend" value={`$${Number(stats.daily).toFixed(2)}`} onClick={() => setShowDailySpend(true)} />
        <StatCard label="Open Recommendations" value={stats.recs} onClick={() => setShowRecs(true)} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Cost Overview</div>
          <div style={selectStyles}>
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
              { key: "series2", label: "AWS", color: "#000000" },         // AWS bar black
              { key: "series1", label: "Azure", color: "#1a237e" },       // Azure dark blue
              { key: "series3", label: "GCP", color: "var(--series-3)" }, // GCP original color token
            ]}
            height={260}
            xTickFormatter={axis.xTickFormatter}
            xAxisLabel={axis.xLabel}
            yAxisLabel={axis.yLabel}
            yDomain={axis.yDomain}
            yTicks={axis.yTicks}
          />
        </div>
      </div>

      {/* Spend share pie chart */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="panel-header">
          <div className="panel-title">Spend Share by Provider</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Interval: {mode}</div>
        </div>
        <div className="panel-body">
          <PieChart data={pieData} size={240} strokeWidth={2} />
        </div>
      </div>

      {/* Modals for each stat card with placeholder content */}
      <Modal
        title="Linked Accounts"
        open={showAccounts}
        onClose={() => setShowAccounts(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowAccounts(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowAccounts(false)}>Manage Accounts</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Placeholder: View and link AWS/Azure accounts. Show connected accounts, add/remove actions.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>AWS: 1 account connected</li>
          <li>Azure: 1 subscription connected</li>
        </ul>
      </Modal>

      <Modal
        title="Discovered Resources"
        open={showResources}
        onClose={() => setShowResources(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowResources(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowResources(false)}>Open Inventory</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Placeholder: Summary of resource types discovered across clouds. Click to open full inventory.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Compute: 58</li>
          <li>Storage: 42</li>
          <li>Databases: 16</li>
          <li>Networking: 12</li>
        </ul>
      </Modal>

      <Modal
        title="Daily Spend"
        open={showDailySpend}
        onClose={() => setShowDailySpend(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowDailySpend(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowDailySpend(false)}>View Costs</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Placeholder: Expanded spend insights for today with small trend sparkline and breakdown.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="badge">AWS: $242.12</div>
          <div className="badge">Azure: $138.44</div>
          <div className="badge">GCP: $31.76</div>
          <div className="badge success">Anomaly checks: OK</div>
        </div>
      </Modal>

      <Modal
        title="Open Recommendations"
        open={showRecs}
        onClose={() => setShowRecs(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowRecs(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowRecs(false)}>View Recommendations</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Placeholder: List of optimization recommendations with potential monthly savings.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Rightsize 12 VMs — est. save $420/mo</li>
          <li>Shut down 4 idle instances — est. save $180/mo</li>
          <li>Move 3 DBs to reserved — est. save $210/mo</li>
        </ul>
      </Modal>
    </div>
  );
}
