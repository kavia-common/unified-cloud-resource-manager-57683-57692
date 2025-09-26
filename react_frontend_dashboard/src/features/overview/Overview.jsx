import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import { MultiSeriesOverviewChart } from "../../components/ui/Charts";
import Banner from "../../components/ui/Banner";
import PieChart from "../../components/ui/PieChart";
import { CLOUD_COLORS } from "../../components/ui/Charts";
import CostAnomalyAlert from "../../components/ui/CostAnomalyAlert";
import { Modal } from "../../components/ui/Modal";
import AddCloudAccountModal from "../../components/ui/AddCloudAccountModal";
import { useToast } from "../../components/ui/Toast";
import { createLinkedAccount, getLinkedAccounts } from "../../services/api";

// PUBLIC_INTERFACE
export default function Overview() {
  /** 
   * Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design.
   * Enhancement: Dynamic axes/labels for Daily/Monthly/Yearly with mock data.
   */
  // Dashboard stats state - initialize with mock baseline
  const [stats, setStats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [mode, setMode] = useState("Monthly"); // Daily | Monthly | Yearly
  const [chartData, setChartData] = useState([]);

  // Local modal states for the four stat cards
  const [showAccounts, setShowAccounts] = useState(false);
  const [showAddCloudModal, setShowAddCloudModal] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [showResources, setShowResources] = useState(false);
  const [showDailySpend, setShowDailySpend] = useState(false);
  const [showRecs, setShowRecs] = useState(false);

  // One-click action modal states (removed: Add Account, Discover, Optimize)
  // const [showAddAccount, setShowAddAccount] = useState(false);
  // const [showDiscover, setShowDiscover] = useState(false);
  // const [showOptimize, setShowOptimize] = useState(false);

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

  // Initialize with Monthly mock data and fetch linked accounts
  const toast = useToast();

  useEffect(() => {
    setChartData(buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`));
    // Fetch linked accounts from backend
    (async () => {
      try {
        const accounts = await getLinkedAccounts();
        setExistingAccounts(accounts);
        // Reflect counts in stats
        setStats((prev) => ({
          ...prev,
          accounts: accounts.length,
        }));
      } catch (err) {
        console.warn("Failed to load linked accounts:", err?.message || err);
        // Non-blocking: show info toast
        toast.info("Could not load linked accounts.", 2500);
      }
    })();
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

  // Styles for action buttons (reference CSS variables in theme.css)
  const actionBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
    padding: "10px 14px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .05s ease",
  };
  const iconTileBase = {
    width: 36,
    height: 36,
    minWidth: 36,
    display: "grid",
    placeItems: "center",
    background: "var(--tile-bg)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 10,
    marginRight: 12,
  };
  const actionLabelStyle = {
    fontFamily: "\"Helvetica Neue\", Arial, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    color: "var(--text-primary)",
    marginRight: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  };
  const chipBase = {
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: 999,
    background: "var(--chip-neutral)",
    color: "var(--text-secondary)",
  };

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

      {/* Action bar removed to streamline layout per request */}

      {/* Prominent Cost Anomaly Alert */}
      <div style={{ marginTop: 8 }}>
        <CostAnomalyAlert
          provider="Azure"
          message="Cost spike detected on Azure: +27% week-on-week"
        />
      </div>

      <div className="card-grid" aria-label="Key metrics" style={{ marginTop: 4 }}>
        <StatCard
          label="Linked Accounts"
          value={stats.accounts}
          variant="violet"
          onClick={() => setShowAccounts(true)}
        />
        <StatCard
          label="Discovered Resources"
          value={stats.resources}
          variant="mint"
          onClick={() => setShowResources(true)}
        />
        <StatCard
          label="Daily Spend"
          value={`$${Number(stats.daily).toFixed(2)}`}
          variant="blue"
          onClick={() => setShowDailySpend(true)}
        />
        <StatCard
          label="Open Recommendations"
          value={stats.recs}
          variant="amber"
          onClick={() => setShowRecs(true)}
        />
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

      {/* Spend share chart with right-aligned vertical actions per design notes */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="panel-header">
          <div className="panel-title">Spend Share</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Interval: {mode}</div>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 360px)",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Left column: Pie chart container */}
            <div
              style={{
                background: "var(--surface, #FFFFFF)",
                border: "1px solid var(--border, #E5E7EB)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <PieChart data={pieData} size={280} strokeWidth={2} />
            </div>

            {/* Right column: Actions stack */}
            <div
              className="actionsStack"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
              }}
            >
              {/* Add Cloud Account */}
              <button
                type="button"
                className="actionBtn pop-hover"
                aria-label="Add Cloud Account"
                style={actionBtnStyle}
                onClick={() => setShowAddCloudModal(true)}
              >
                <div className="iconTile" aria-hidden="true" style={{ ...iconTileBase, color: "#22C55E" }}>
                  {/* cloud-plus icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true">
                    <path d="M7 17h8a4 4 0 0 0 0-8 5 5 0 0 0-9.58 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11v6M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="label" style={actionLabelStyle}>Add Cloud Account</span>
                {/* chevron-right (consistent with other buttons) */}
                <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" style={{ color: "var(--icon-muted, #8C939A)" }}>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Discover Resources */}
              <button
                type="button"
                className="actionBtn pop-hover"
                aria-label="Discover Resources"
                style={actionBtnStyle}
                onClick={() => setShowResources(true)}
              >
                <div className="iconTile" aria-hidden="true" style={{ ...iconTileBase, color: "#A78BFA" }}>
                  {/* magnifier icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="label" style={actionLabelStyle}>Discover Resources</span>
                {/* chevron-right */}
                <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" style={{ color: "var(--icon-muted, #8C939A)" }}>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Run Optimization */}
              <button
                type="button"
                className="actionBtn pop-hover"
                aria-label="Run Optimization"
                style={actionBtnStyle}
                onClick={() => setShowRecs(true)}
              >
                <div className="iconTile" aria-hidden="true" style={{ ...iconTileBase, color: "#60A5FA" }}>
                  {/* rocket icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true">
                    <path d="M5 19s2-1 4-1 4 1 4 1 0-3 2-5 5-2 5-2 0-3-2-5-5-2-5-2-0 3-2 5-5 2-5 2 1 2-1 4-4 3-4 3 1-3 3-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 10l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="label" style={actionLabelStyle}>Run Optimization</span>
                <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" style={{ color: "var(--icon-muted, #8C939A)" }}>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Responsive stacking for mobile: buttons below chart */}
          <style>{`
            @media (max-width: 860px) {
              .panel-body > div {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
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
          Connected accounts summary:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {existingAccounts.map((acc, idx) => (
            <li key={idx}>{acc.provider}: {acc.name} ({acc.account_id})</li>
          ))}
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
            <button
              className="btn"
              style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
              onClick={() => setShowDailySpend(false)}
            >
              View Costs
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "#000000" }}>
          <div className="badge" style={{ color: "#000000" }}>AWS: $242.12</div>
          <div className="badge" style={{ color: "#000000" }}>Azure: $138.44</div>
          <div className="badge" style={{ color: "#000000" }}>GCP: $31.76</div>
          <div className="badge success" style={{ color: "#000000" }}>Anomaly checks: OK</div>
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
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Rightsize 12 VMs — est. save $420/mo</li>
          <li>Shut down 4 idle instances — est. save $180/mo</li>
          <li>Move 3 DBs to reserved — est. save $210/mo</li>
        </ul>
      </Modal>

      {/* Add Cloud Account Modal for the action button */}
      <AddCloudAccountModal
        open={showAddCloudModal}
        onClose={() => setShowAddCloudModal(false)}
        existingAccounts={existingAccounts}
        onSubmit={async (payload) => {
          try {
            // Persist via Edge Function
            const res = await createLinkedAccount({
              provider: payload.provider,
              name: payload.name,
              credentials: payload.credentials,
            });
            // Refresh from backend to ensure list reflects saved accounts
            const accounts = await getLinkedAccounts();
            setExistingAccounts(accounts);

            // Update stats: real account count; simulate the rest for UX
            const randInRange = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
            const addedResources = randInRange(20, 60);
            const addedDailySpend = randInRange(20, 80);
            const addedRecs = randInRange(1, 3);
            setStats((prev) => ({
              accounts: accounts.length,
              resources: (prev.resources || 0) + addedResources,
              daily: Number(prev.daily || 0) + addedDailySpend,
              recs: (prev.recs || 0) + addedRecs,
            }));

            // Success toast
            toast.success("Account has been created successfully", 3500);
          } catch (err) {
            console.error("Create account failed:", err);
            // Error toast
            toast.error("Invalid Credentials, try again.", 4000);
            throw err; // keep rejection for modal if needed
          }
        }}
      />
    </div>
  );
}
