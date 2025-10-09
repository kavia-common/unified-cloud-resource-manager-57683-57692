import React, { useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import {
  MultiSeriesLineChart,
  StackedBarChart,
  CLOUD_COLORS,
} from "../../components/ui/Charts";
import SimplePieChart from "../../components/ui/SimplePieChart";
import SimpleBarChart from "../../components/ui/SimpleBarChart";

/**
 * PUBLIC_INTERFACE
 * Costs page renders a minimalist Cost & Billing dashboard consisting of:
 * 1) Multi-Cloud Spend Summary (total monthly spend and distribution by provider)
 * 2) Trend & Usage Analytics (time series and top services/resources)
 * 3) Budgets, Invoices & Alerts (budget control mock UI, invoices list, alerts)
 *
 * Notes:
 * - Uses placeholder/mock data for demo purposes.
 * - Uses Recharts via shared components in components/ui/Charts.jsx.
 * - Styling follows Pure White minimal theme with cards/panels from theme.css.
 */
export default function Costs() {
  // Controls for trend resolution (Monthly | Yearly)
  const [trendRange, setTrendRange] = useState("Monthly");

  // Mock multi-cloud spend totals (USD)
  const monthlyTotals = useMemo(
    () => ({
      AWS: 12450,
      Azure: 10320,
      GCP: 6810,
    }),
    []
  );

  const grandTotal = useMemo(
    () => monthlyTotals.AWS + monthlyTotals.Azure + monthlyTotals.GCP,
    [monthlyTotals]
  );

  // Pie data for provider share
  const providerPieData = useMemo(
    () => [
      { name: "AWS", value: monthlyTotals.AWS, color: CLOUD_COLORS.AWS },
      { name: "Azure", value: monthlyTotals.Azure, color: CLOUD_COLORS.Azure },
      { name: "GCP", value: monthlyTotals.GCP, color: CLOUD_COLORS.GCP },
    ],
    [monthlyTotals]
  );

  // Trend data (Monthly and Yearly) multi-series line chart mock
  const monthlyTrend = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i];
        const aws = 900 + (i % 5) * 120 + (i > 5 ? 200 : 0);
        const az = 780 + (i % 4) * 110 + (i > 6 ? 150 : 0);
        const gcp = 520 + (i % 3) * 90 + (i > 8 ? 180 : 0);
        return { date: month, aws, azure: az, gcp };
      }),
    []
  );

  const yearlyTrend = useMemo(
    () =>
      [
        { date: "2021", aws: 9200, azure: 8600, gcp: 5400 },
        { date: "2022", aws: 10400, azure: 9300, gcp: 5900 },
        { date: "2023", aws: 11350, azure: 9720, gcp: 6200 },
        { date: "2024", aws: 12450, azure: 10320, gcp: 6810 },
      ],
    []
  );

  const trendData = trendRange === "Monthly" ? monthlyTrend : yearlyTrend;

  // PUBLIC_INTERFACE
  // Adapter: Build monthly totals for SimpleBarChart using available monthlyTrend
  function buildMonthlyTotalsForBarChart() {
    if (!Array.isArray(monthlyTrend) || monthlyTrend.length === 0) {
      // mock-safe fallback: 6 months placeholder
      const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      return labels.map((m, i) => ({ label: m, value: 4000 + i * 500 }));
    }
    // Sum across providers for monthly total
    return monthlyTrend.map((row) => ({
      label: row.date,
      value: (row.aws || 0) + (row.azure || 0) + (row.gcp || 0),
    }));
  }

  // Top cost-driving services/resources mock
  const topServices = useMemo(
    () => [
      { name: "Compute/VM", aws: 7800, azure: 6600, gcp: 4200 },
      { name: "Storage", aws: 2100, azure: 1950, gcp: 1380 },
      { name: "Database", aws: 1650, azure: 1280, gcp: 720 },
      { name: "Networking", aws: 900, azure: 820, gcp: 510 },
    ],
    []
  );

  // Stacked bars: show AWS + Azure (primary clouds in this app) for simple comparison
  const stackedKeys = ["aws", "azure"];
  const stackedColors = ["#000000", "#1a237e"];

  // Budget mock state
  const [teamBudget, setTeamBudget] = useState(25000); // USD/month
  const [projectBudget, setProjectBudget] = useState(12000); // USD/month

  // Alerts mock
  const alerts = useMemo(
    () => [
      {
        id: "a1",
        level: grandTotal > teamBudget ? "error" : "success",
        title:
          grandTotal > teamBudget
            ? "Team budget threshold exceeded"
            : "Team budget within limits",
        detail:
          grandTotal > teamBudget
            ? `Current total $${formatNum(grandTotal)} > budget $${formatNum(teamBudget)}`
            : `Current total $${formatNum(grandTotal)} <= budget $${formatNum(teamBudget)}`,
      },
      {
        id: "a2",
        level: monthlyTotals.AWS > projectBudget * 0.6 ? "warning" : "success",
        title:
          monthlyTotals.AWS > projectBudget * 0.6
            ? "AWS project nearing allocation"
            : "AWS project on track",
        detail: `AWS spend $${formatNum(monthlyTotals.AWS)} vs project budget $${formatNum(projectBudget)}`,
      },
    ],
    [grandTotal, teamBudget, projectBudget, monthlyTotals]
  );

  // Invoices mock
  const invoices = useMemo(
    () => [
      { id: "inv-2024-09-aws", provider: "AWS", period: "Sep 2024", total: 12140, link: "#" },
      { id: "inv-2024-09-azure", provider: "Azure", period: "Sep 2024", total: 10130, link: "#" },
      { id: "inv-2024-09-gcp", provider: "GCP", period: "Sep 2024", total: 6680, link: "#" },
    ],
    []
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header stats */}
      <div className="card-grid">
        <StatCard title="Total Monthly Spend" value={`$${formatNum(grandTotal)}`} />
        <StatCard title="AWS" value={`$${formatNum(monthlyTotals.AWS)}`} />
        <StatCard title="Azure" value={`$${formatNum(monthlyTotals.Azure)}`} />
        <StatCard title="GCP" value={`$${formatNum(monthlyTotals.GCP)}`} />
      </div>

      {/* 1) Multi-Cloud Spend Summary */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Multi-Cloud Spend Summary</div>
          <div className="text-subtle" style={{ fontSize: 12 }}>
            Visual breakdown by cloud provider
          </div>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 420px) 1fr",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            <div>
              <div className="text-subtle" style={{ marginBottom: 6, fontSize: 12 }}>
                Provider Share
              </div>
              <SimplePieChart
                data={[
                  { label: "AWS", value: monthlyTotals.AWS, amount: monthlyTotals.AWS, color: CLOUD_COLORS.AWS },
                  { label: "Azure", value: monthlyTotals.Azure, amount: monthlyTotals.Azure, color: CLOUD_COLORS.Azure },
                  { label: "GCP", value: monthlyTotals.GCP, amount: monthlyTotals.GCP, color: CLOUD_COLORS.GCP },
                ]}
                width={380}
                height={220}
                legendPosition="right"
                ariaLabel="Multi-cloud provider share"
                showLabels
                labelType="percent"
                chartOffsetX={-12}
                minLabelPercent={3}
                labelColor="auto"
              />
            </div>
            <div>
              <div className="text-subtle" style={{ marginBottom: 6, fontSize: 12 }}>
                Monthly Total by Month
              </div>
              <SimpleBarChart
                data={buildMonthlyTotalsForBarChart()}
                width={520}
                height={240}
                ariaLabel="Monthly totals by month"
                color="#374151"
              />
              <div className="text-xs" style={{ color: "var(--muted)", marginTop: 6 }}>
                <span data-testid="horizontal-bar-chart-active">Horizontal bar chart enforced</span>
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 1020px) {
              .panel-body > div {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </div>
      </div>

      {/* 2) Trend & Usage Analytics */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Trend & Usage Analytics</div>
          <div style={{ display: "inline-grid", gridAutoFlow: "column", gap: 8 }}>
            <select
              className="select"
              value={trendRange}
              onChange={(e) => setTrendRange(e.target.value)}
              aria-label="Select trend range"
              style={{ minWidth: 140 }}
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div className="panel-body" style={{ display: "grid", gap: 16 }}>
          <div>
            <div className="text-subtle" style={{ marginBottom: 6, fontSize: 12 }}>
              Cost Trend Over Time
            </div>
            <MultiSeriesLineChart
              data={trendData}
              xKey="date"
              series={[
                { key: "aws", label: "AWS", color: CLOUD_COLORS.AWS },
                { key: "azure", label: "Azure", color: CLOUD_COLORS.Azure },
                { key: "gcp", label: "GCP", color: CLOUD_COLORS.GCP },
              ]}
              height={260}
              showLegend
            />
          </div>

          <div>
            <div className="text-subtle" style={{ marginBottom: 6, fontSize: 12 }}>
              Top Cost-Driving Services
            </div>
            <StackedBarChart
              data={topServices}
              keys={stackedKeys}
              colors={stackedColors}
              xKey="name"
              height={260}
              legend
            />
          </div>
        </div>
      </div>

      {/* 3) Budgets, Invoices & Alerts */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Budgets, Invoices & Alerts</div>
          <div className="text-subtle" style={{ fontSize: 12 }}>
            Monitor budgets, view invoices, and receive alerts
          </div>
        </div>
        <div className="panel-body" style={{ display: "grid", gap: 16 }}>
          {/* Budgets */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>Budgets</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <BudgetControl
                  label="Team Budget (Monthly)"
                  amount={teamBudget}
                  onChange={setTeamBudget}
                  currentSpend={grandTotal}
                />
                <BudgetControl
                  label="Project Budget (Monthly)"
                  amount={projectBudget}
                  onChange={setProjectBudget}
                  currentSpend={monthlyTotals.AWS}
                />
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Invoices</div>
              <div className="table-wrapper">
                <table role="table" aria-label="Cloud invoices">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Provider</th>
                      <th>Period</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.id}</td>
                        <td>{inv.provider}</td>
                        <td>{inv.period}</td>
                        <td>${formatNum(inv.total)}</td>
                        <td>
                          <a href={inv.link} className="btn secondary" style={{ fontSize: 12, padding: "6px 10px" }}>
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Alerts</div>
              <div style={{ display: "grid", gap: 10 }}>
                {alerts.map((a) => (
                  <AlertItem key={a.id} level={a.level} title={a.title} detail={a.detail} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// PUBLIC_INTERFACE
function BudgetControl({ label, amount, onChange, currentSpend }) {
  const over = currentSpend > amount;
  return (
    <div className="surface" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div className="text-subtle" style={{ fontSize: 12 }}>
          Current: ${formatNum(currentSpend)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          aria-label={`${label} amount`}
          style={{ padding: "8px 10px" }}
        />
        <button className="btn primary" style={{ padding: "8px 12px" }} onClick={() => { /* noop mock */ }}>
          Save
        </button>
      </div>
      <div
        className="badge"
        style={{
          marginTop: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: over ? "#FEF2F2" : "#ECFDF5",
          borderColor: over ? "#FECACA" : "#A7F3D0",
          color: over ? "#DC2626" : "#059669",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: over ? "#EF4444" : "#10B981",
          }}
        />
        {over ? "Over budget" : "Within budget"}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function AlertItem({ level = "info", title, detail }) {
  const palette =
    level === "error"
      ? { bg: "#FEF2F2", bd: "#FECACA", fg: "#B91C1C", dot: "#EF4444" }
      : level === "warning"
      ? { bg: "#FFFBEB", bd: "#FDE68A", fg: "#92400E", dot: "#F59E0B" }
      : { bg: "#EFF6FF", bd: "#BFDBFE", fg: "#1E40AF", dot: "#3B82F6" };

  return (
    <div
      role="status"
      className="surface"
      style={{
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${palette.bd}`,
        background: palette.bg,
        color: palette.fg,
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: palette.dot }} />
        {title}
      </div>
      <div className="text-subtle" style={{ color: palette.fg }}>{detail}</div>
    </div>
  );
}

function formatNum(n) {
  try {
    return Number(n).toLocaleString();
  } catch {
    return String(n);
  }
}
