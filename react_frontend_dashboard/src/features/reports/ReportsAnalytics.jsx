import React, { useMemo, useState } from "react";
import "./reports.css";
import { MultiSeriesOverviewChart, CLOUD_COLORS } from "../../components/ui/Charts";
import PieChart from "../../components/ui/PieChart";

/**
 * Reports & Analytics page aggregates multiple operational insights.
 * - Unused Resources Report: highlights unattached or dormant resources to reclaim.
 * - Tag/Label Consistency Analytics: flags resources with missing/inconsistent tags.
 * - Time to Resolution Metrics: basic stats for incidents resolution times.
 *
 * This page uses purely mocked data and local-only analytics to avoid backend coupling.
 */

const mockedResources = [
  // Storage volumes
  { id: "vol-001", provider: "AWS", type: "EBS", status: "available", attachedTo: null, monthlyCost: 12.5, tags: { Owner: "team-alpha", Env: "prod" } },
  { id: "vol-002", provider: "AWS", type: "EBS", status: "in-use", attachedTo: "i-0abc", monthlyCost: 9.1, tags: { Owner: "", Env: "dev" } },
  { id: "disk-az-01", provider: "Azure", type: "ManagedDisk", status: "unattached", attachedTo: null, monthlyCost: 15.0, tags: { owner: "team-beta", env: "stage" } },
  // Compute
  { id: "i-0abc", provider: "AWS", type: "EC2", status: "running", attachedTo: null, monthlyCost: 58.0, tags: { Owner: "team-alpha", Env: "prod", CostCenter: "C100" } },
  { id: "vm-az-123", provider: "Azure", type: "VM", status: "stopped", attachedTo: null, monthlyCost: 0.0, lastActiveDaysAgo: 37, tags: { Owner: "team-gamma" } },
  // Managed services
  { id: "rds-01", provider: "AWS", type: "RDS", status: "available", monthlyCost: 120.0, lastActiveDaysAgo: 45, connectionsLast7d: 0, tags: { Owner: "team-alpha", Env: "prod" } },
  { id: "cosmos-01", provider: "Azure", type: "CosmosDB", status: "provisioned", monthlyCost: 210.0, connectionsLast7d: 1, lastActiveDaysAgo: 20, tags: { Owner: "", Env: "prod" } },
  // Buckets / Storage accounts
  { id: "s3-logs", provider: "AWS", type: "S3", status: "active", monthlyCost: 7.2, lastWriteDaysAgo: 120, tags: { Owner: "team-ops", Env: "" } },
  { id: "stacc-01", provider: "Azure", type: "StorageAccount", status: "active", monthlyCost: 5.8, lastWriteDaysAgo: 1, tags: { Owner: "team-alpha", Env: "prod" } },
];

const mockedIncidents = [
  // times in ISO strings for determinism
  { id: "INC-1001", provider: "AWS", severity: "high", openedAt: "2025-09-14T09:15:00Z", resolvedAt: "2025-09-14T12:45:00Z" }, // 3.5h
  { id: "INC-1002", provider: "Azure", severity: "medium", openedAt: "2025-09-13T20:00:00Z", resolvedAt: "2025-09-14T02:30:00Z" }, // 6.5h
  { id: "INC-1003", provider: "AWS", severity: "low", openedAt: "2025-09-10T10:00:00Z", resolvedAt: "2025-09-11T10:00:00Z" }, // 24h
  { id: "INC-1004", provider: "Azure", severity: "high", openedAt: "2025-09-12T08:00:00Z", resolvedAt: "2025-09-12T10:00:00Z" }, // 2h
  { id: "INC-1005", provider: "AWS", severity: "low", openedAt: "2025-09-01T00:00:00Z", resolvedAt: "2025-09-03T12:00:00Z" }, // 60h
];

// PUBLIC_INTERFACE
export default function ReportsAnalytics() {
  /**
   * Derive lists for the three reports.
   */

  // 1) Unused Resources: unattached volumes/disks, dormant services/buckets, stopped-or-idle compute with cost
  const unused = useMemo(() => {
    const isUnattached = (r) =>
      ["EBS", "ManagedDisk"].includes(r.type) && (r.attachedTo === null || r.status === "unattached" || r.status === "available");

    const isDormantService = (r) => {
      // heuristics: managed services or buckets with no activity
      const dormantSignals = [
        (r.type === "RDS" || r.type === "CosmosDB") && (r.connectionsLast7d ?? 0) === 0 && (r.lastActiveDaysAgo ?? 999) > 14,
        (r.type === "S3" || r.type === "StorageAccount") && (r.lastWriteDaysAgo ?? 999) > 30,
      ];
      return dormantSignals.some(Boolean);
    };

    const isIdleComputeWithSpend = (r) =>
      (r.type === "VM" || r.type === "EC2") && (r.status === "stopped" || (r.lastActiveDaysAgo ?? 0) > 30) && (r.monthlyCost ?? 0) > 0;

    const list = mockedResources.filter((r) => isUnattached(r) || isDormantService(r) || isIdleComputeWithSpend(r));
    const monthlyWaste = list.reduce((sum, r) => sum + (r.monthlyCost || 0), 0);
    return { list, monthlyWaste: round2(monthlyWaste) };
  }, []);

  // 2) Tag Consistency: define a policy and find missing/inconsistent keys
  const tagPolicy = {
    requiredKeys: ["Owner", "Env", "CostCenter"],
    // canonical casing mapping (simple demonstration)
    canonicalize: { owner: "Owner", env: "Env", costcenter: "CostCenter" },
    allowedEnvs: ["prod", "stage", "dev", "test"],
  };

  const tagIssues = useMemo(() => {
    // helper to normalize keys by policy.canonicalize
    const normalizeTags = (tags) => {
      const norm = {};
      if (!tags) return norm;
      Object.entries(tags).forEach(([k, v]) => {
        const canonical =
          tagPolicy.canonicalize[k] ??
          tagPolicy.canonicalize[k?.toLowerCase?.()] ??
          k;
        norm[canonical] = v;
      });
      return norm;
    };

    const issues = [];
    mockedResources.forEach((r) => {
      const norm = normalizeTags(r.tags);
      const missing = [];
      const invalid = [];

      tagPolicy.requiredKeys.forEach((key) => {
        const val = norm[key];
        if (val === undefined || val === null || String(val).trim() === "") {
          missing.push(key);
        }
      });

      if (norm.Env && !tagPolicy.allowedEnvs.includes(String(norm.Env).toLowerCase())) {
        invalid.push({ key: "Env", value: norm.Env, reason: "Env must be one of " + tagPolicy.allowedEnvs.join(", ") });
      }

      // Example: CostCenter should be like C123 format if provided
      if (norm.CostCenter && !/^C\d{3,}$/.test(String(norm.CostCenter))) {
        invalid.push({ key: "CostCenter", value: norm.CostCenter, reason: "CostCenter format should be like C123" });
      }

      if (missing.length || invalid.length) {
        issues.push({
          id: r.id,
          provider: r.provider,
          type: r.type,
          tags: norm,
          missing,
          invalid,
          guidance: buildGuidance(missing, invalid),
        });
      }
    });

    return issues;
  }, []);

  // 3) TTR Metrics
  const ttr = useMemo(() => {
    const durations = mockedIncidents
      .map((i) => {
        const opened = new Date(i.openedAt).getTime();
        const resolved = new Date(i.resolvedAt).getTime();
        const hours = (resolved - opened) / (1000 * 60 * 60);
        return hours;
      })
      .filter((x) => isFinite(x) && x >= 0);

    if (durations.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

    const sum = durations.reduce((a, b) => a + b, 0);
    return {
      avg: round2(sum / durations.length),
      min: round2(Math.min(...durations)),
      max: round2(Math.max(...durations)),
      count: durations.length,
    };
  }, []);

  // Local state for Cost Overview chart controls and data (moved from Dashboard)
  const [mode, setMode] = useState("Monthly"); // Daily | Monthly | Yearly

  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => h), []);
  const daysInMonth = useMemo(() => Array.from({ length: 31 }, (_, d) => d + 1), []);
  const months = useMemo(() => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], []);

  function rand(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function buildSeriesFor(xValues, ranges, nameFormatter = (x) => String(x)) {
    return xValues.map((x) => ({
      name: nameFormatter(x),
      series1: rand(ranges.s1[0], ranges.s1[1]),
      series2: rand(ranges.s2[0], ranges.s2[1]),
      series3: rand(ranges.s3[0], ranges.s3[1]),
    }));
  }

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
    return {
      xTickFormatter: (v) => v,
      xLabel: "Month",
      yLabel: "Spend ($)",
      yDomain: [0, 120],
      yTicks: [0, 20, 40, 60, 80, 100, 120],
    };
  }

  const axis = computeAxisConfig(mode);

  // Spend share donut data (moved from Dashboard)
  const spendShareTotals = useMemo(() => {
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

  const spendShareData = useMemo(
    () => [
      { label: "AWS", value: spendShareTotals.AWS, color: CLOUD_COLORS.AWS },
      { label: "Azure", value: spendShareTotals.Azure, color: CLOUD_COLORS.Azure },
      { label: "GCP", value: spendShareTotals.GCP, color: CLOUD_COLORS.GCP },
    ],
    [spendShareTotals]
  );

  const chartData = useMemo(() => {
    if (mode === "Daily") {
      return buildSeriesFor(hours, { s1: [2, 16], s2: [1, 14], s3: [3, 20] }, (h) => `${h}`);
    } else if (mode === "Monthly") {
      return buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`);
    } else {
      return buildSeriesFor(months, { s1: [25, 90], s2: [20, 80], s3: [30, 100] }, (m) => m);
    }
  }, [mode, hours, daysInMonth, months]);

  return (
    <div className="reports-page">
      <h1 className="page-title" aria-label="Reports and Analytics page">Reports & Analytics</h1>

      {/* Spend Share (moved from Dashboard) */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2>Spend Share</h2>
          <div className="subtle">Interval: {mode}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 360px)", gap: 16, alignItems: "start" }}>
          <div
            style={{
              background: "var(--color-surface, #FFFFFF)",
              border: "1px solid var(--border-color, #E5E7EB)",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {/* PUBLIC_INTERFACE: relocated pie chart */}
            <PieChart data={spendShareData} size={300} ringThickness={64} />
          </div>

          {/* Action buttons preserved for usability */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <button type="button" className="btn secondary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>Add Cloud Account</span>
              <span aria-hidden>›</span>
            </button>
            <button type="button" className="btn secondary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>Discover Resources</span>
              <span aria-hidden>›</span>
            </button>
            <button type="button" className="btn secondary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>View Recommendations</span>
              <span aria-hidden>›</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cost Overview (moved from Dashboard) */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2>Cost Overview</h2>
          <div>
            <select
              className="select"
              aria-label="Select time interval for overview chart"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div>
          <MultiSeriesOverviewChart
            data={chartData}
            xKey="name"
            seriesOrder={[
              { key: "series2", label: "AWS", color: "#000000" },
              { key: "series1", label: "Azure", color: "#1a237e" },
              { key: "series3", label: "GCP", color: "var(--series-3)" },
            ]}
            height={260}
            xTickFormatter={axis.xTickFormatter}
            xAxisLabel={axis.xLabel}
            yAxisLabel={axis.yLabel}
            yDomain={axis.yDomain}
            yTicks={axis.yTicks}
          />
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <div className="card-header">
            <h2>Unused Resources Report</h2>
            <span className="subtle">Potential monthly waste: ${unused.monthlyWaste}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Monthly Cost</th>
                  <th>Signals</th>
                </tr>
              </thead>
              <tbody>
                {unused.list.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.provider}</td>
                    <td>{r.type}</td>
                    <td>{r.status}</td>
                    <td>${(r.monthlyCost ?? 0).toFixed(2)}</td>
                    <td>{describeUnusedSignals(r)}</td>
                  </tr>
                ))}
                {unused.list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">No unused resources detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="guidance">
            Consider snapshotting and deleting unattached volumes, scaling down dormant services, or enforcing lifecycle policies for stale storage.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Tag/Label Consistency Analytics</h2>
            <span className="subtle">Policy: Owner, Env, CostCenter required</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Missing</th>
                  <th>Invalid</th>
                  <th>Guidance</th>
                </tr>
              </thead>
              <tbody>
                {tagIssues.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.provider}</td>
                    <td>{i.type}</td>
                    <td>{i.missing.length ? i.missing.join(", ") : "-"}</td>
                    <td>
                      {i.invalid.length
                        ? i.invalid.map((iv) => `${iv.key}=${iv.value} (${iv.reason})`).join("; ")
                        : "-"}
                    </td>
                    <td className="muted">{i.guidance}</td>
                  </tr>
                ))}
                {tagIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">All resources meet tag policy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="guidance">
            Enforce tag policies at provisioning time and add CI/CD checks to prevent drift.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Time to Resolution Metrics</h2>
            <span className="subtle">{ttr.count} incidents analyzed</span>
          </div>
          <div className="kpis">
            <KPI label="Average TTR" value={`${ttr.avg} h`} />
            <KPI label="Min TTR" value={`${ttr.min} h`} />
            <KPI label="Max TTR" value={`${ttr.max} h`} />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Provider</th>
                  <th>Severity</th>
                  <th>Opened</th>
                  <th>Resolved</th>
                  <th>TTR (h)</th>
                </tr>
              </thead>
              <tbody>
                {mockedIncidents.map((i) => {
                  const ttrHrs = round2((new Date(i.resolvedAt).getTime() - new Date(i.openedAt).getTime()) / (1000 * 60 * 60));
                  return (
                    <tr key={i.id}>
                      <td>{i.id}</td>
                      <td>{i.provider}</td>
                      <td>{capitalize(i.severity)}</td>
                      <td>{new Date(i.openedAt).toLocaleString()}</td>
                      <td>{new Date(i.resolvedAt).toLocaleString()}</td>
                      <td>{ttrHrs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="guidance">
            Aim to reduce average TTR by adding auto-remediation runbooks and alert enrichment.
          </div>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

// helpers
function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildGuidance(missing, invalid) {
  const items = [];
  if (missing.length) items.push(`Add required tags: ${missing.join(", ")}`);
  if (invalid.length) items.push("Fix invalid values (see policy hints).");
  return items.join(" · ");
}

function describeUnusedSignals(r) {
  const signals = [];
  if (["EBS", "ManagedDisk"].includes(r.type) && (r.attachedTo === null || r.status === "unattached" || r.status === "available")) {
    signals.push("Unattached volume/disk");
  }
  if ((r.type === "RDS" || r.type === "CosmosDB") && (r.connectionsLast7d ?? 0) === 0 && (r.lastActiveDaysAgo ?? 999) > 14) {
    signals.push("Dormant managed service");
  }
  if ((r.type === "S3" || r.type === "StorageAccount") && (r.lastWriteDaysAgo ?? 999) > 30) {
    signals.push("No recent writes");
  }
  if ((r.type === "VM" || r.type === "EC2") && (r.status === "stopped" || (r.lastActiveDaysAgo ?? 0) > 30) && (r.monthlyCost ?? 0) > 0) {
    signals.push("Idle compute incurring cost");
  }
  return signals.join(" · ") || "-";
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
