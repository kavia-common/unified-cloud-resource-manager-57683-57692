import React, { useEffect, useMemo, useState, useCallback } from "react";
import StatCard from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";

/**
 * PUBLIC_INTERFACE
 * Recommendations panel
 * - Analyzes mock resource data to propose cost savings:
 *   • Underutilized resource alerts
 *   • Right-sizing suggestions
 *   • Unused asset detection
 *   • Scheduling/auto-off proposals
 * - Displays actionable lists with Apply/Ignore stubs.
 * - Pure White minimalist styling, integrates with existing Table and StatCard.
 *
 * TODO: Replace mock analysis with backend/AI integration via Supabase Edge Function.
 */
export default function Recommendations() {
  const toast = useToast();

  // Mock inventory/usage data (dev/test scale)
  const [compute, setCompute] = useState([
    { id: "i-001", name: "web-01", provider: "aws", type: "t3.large", region: "us-east-1", env: "prod", status: "running", cpu: 7, mem: 22, hourly: 0.0832 },
    { id: "i-002", name: "dev-api-01", provider: "aws", type: "t3.medium", region: "us-east-1", env: "dev", status: "running", cpu: 2, mem: 10, hourly: 0.0416 },
    { id: "vm-az-01", name: "test-batch", provider: "azure", type: "Standard_D4s_v5", region: "eastus", env: "test", status: "running", cpu: 4, mem: 18, hourly: 0.192 },
  ]);
  const [databases, setDatabases] = useState([
    { id: "rds-orders", name: "orders-db", provider: "aws", engine: "postgres", tier: "db.t3.large", env: "prod", cpu: 12, storage_gb: 200, iops: 1000, hourly: 0.185 },
    { id: "azsql-app", name: "dev-app-db", provider: "azure", engine: "mssql", tier: "GP_S_Gen5_4", env: "dev", cpu: 3, storage_gb: 60, iops: 500, hourly: 0.25 },
  ]);
  const [storage, setStorage] = useState([
    { id: "bkt-logs", name: "prod-logs", provider: "aws", type: "s3", region: "us-east-1", objects: 124000, size_gb: 320.4, last_access_days: 2, monthly: 7.2 },
    { id: "bkt-unattached", name: "tmp-artifacts", provider: "aws", type: "s3", region: "us-east-1", objects: 0, size_gb: 1.2, last_access_days: 365, monthly: 0.05 },
    { id: "cont-orphan", name: "orphaned-data", provider: "azure", type: "blob", region: "eastus", objects: 10, size_gb: 0.3, last_access_days: 180, monthly: 0.02 },
  ]);
  const [assets, setAssets] = useState([
    { id: "snap-001", type: "snapshot", attached: false, age_days: 200, monthly: 1.8 },
    { id: "eip-01", type: "ip", attached: false, age_days: 90, monthly: 3.6 },
    { id: "vol-az-01", type: "volume", attached: false, age_days: 60, monthly: 2.4 },
  ]);

  // Track which recommendation is currently being executed to disable button/show spinner
  const [runningId, setRunningId] = useState(null);

  // Analysis thresholds (heuristics)
  const THRESHOLDS = {
    cpu_low: 10, // percent
    mem_low: 20, // percent
    last_access_stale_days: 90,
    work_hours: { start: 9, end: 18 }, // 9am-6pm
    rightsize_cpu_target: 30, // desired utilization percent
  };

  /**
   * Produce recommendations from mock data.
   * Returns structured arrays under each category with consistent fields.
   */
  const recs = useMemo(() => {
    const underutilized = [];
    const rightsizing = [];
    const unusedAssets = [];
    const scheduling = [];

    // Helper to build a unified action handler descriptor for each recommendation
    const makeAction = (id, actionLabel, payload) => ({
      id,
      actionLabel,
      // Used for spinner/disabled
      isRunning: runningId === id,
      // Encodes the task to perform (mocked here)
      actionPayload: payload,
    });

    // Underutilized compute => consider stopping or resizing
    for (const vm of compute) {
      if ((vm.cpu ?? 0) < THRESHOLDS.cpu_low && (vm.mem ?? 0) < THRESHOLDS.mem_low && vm.status === "running") {
        underutilized.push({
          id: `underutilized-${vm.id}`,
          category: "Underutilized Resource",
          suggestion: `Consider stopping ${vm.name}`,
          resource: `${vm.provider.toUpperCase()} VM ${vm.name} (${vm.type})`,
          rationale: `CPU ${vm.cpu}% • Mem ${vm.mem}% over past 24h`,
          estMonthly: (vm.hourly * 24 * 30).toFixed(2),
          priority: "high",
          ...makeAction(`underutilized-${vm.id}`, "Stop (Mock)", {
            kind: "stop",
            provider: vm.provider,
            resourceId: vm.id,
          }),
        });
      }
    }

    // Right-sizing for compute and databases by simple ratio
    for (const vm of compute) {
      if ((vm.cpu ?? 0) < THRESHOLDS.rightsize_cpu_target && vm.status === "running") {
        const target = vm.type.includes("large") ? vm.type.replace("large", "medium") : vm.type.includes("medium") ? vm.type.replace("medium", "small") : vm.type;
        if (target !== vm.type) {
          rightsizing.push({
            id: `rightsize-${vm.id}`,
            category: "Right-Sizing",
            suggestion: `Resize ${vm.name} from ${vm.type} to ${target}`,
            resource: `${vm.provider.toUpperCase()} VM ${vm.name}`,
            rationale: `Avg CPU ${vm.cpu}% below target ${THRESHOLDS.rightsize_cpu_target}%`,
            estMonthly: (vm.hourly * 24 * 30 * 0.6).toFixed(2), // pretend 40% cheaper
            priority: "medium",
            ...makeAction(`rightsize-${vm.id}`, "Resize (Mock)", {
              kind: "resize",
              provider: vm.provider,
              resourceId: vm.id,
              target,
            }),
          });
        }
      }
    }
    for (const db of databases) {
      if ((db.cpu ?? 0) < THRESHOLDS.rightsize_cpu_target) {
        const target = db.tier.replace(/(_\d+)$/, (m) => {
          const n = Number(m.replace("_", ""));
          return "_" + Math.max(1, n - 1);
        });
        if (target && target !== db.tier) {
          rightsizing.push({
            id: `rightsize-db-${db.id}`,
            category: "Right-Sizing",
            suggestion: `Scale ${db.name} from ${db.tier} to ${target}`,
            resource: `${db.provider.toUpperCase()} ${db.engine.toUpperCase()} ${db.name}`,
            rationale: `Avg CPU ${db.cpu}% below target ${THRESHOLDS.rightsize_cpu_target}%`,
            estMonthly: (db.hourly * 24 * 30 * 0.7).toFixed(2), // pretend 30% cheaper
            priority: "medium",
            ...makeAction(`rightsize-db-${db.id}`, "Scale (Mock)", {
              kind: "db-scale",
              provider: db.provider,
              resourceId: db.id,
              target,
            }),
          });
        }
      }
    }

    // Unused assets (snapshots, unattached IPs, orphaned volumes, stale buckets)
    for (const a of assets) {
      if (!a.attached) {
        unusedAssets.push({
          id: `unused-${a.id}`,
          category: "Unused Asset",
          suggestion: `Delete unused ${a.type.toUpperCase()} ${a.id}`,
          resource: `${a.type.toUpperCase()} ${a.id}`,
          rationale: `Unattached for ${a.age_days} days`,
          estMonthly: a.monthly.toFixed(2),
          priority: "high",
          ...makeAction(`unused-${a.id}`, "Delete (Mock)", {
            kind: "delete-asset",
            provider: "aws",
            resourceId: a.id,
            resourceType: a.type,
          }),
        });
      }
    }
    for (const b of storage) {
      if (b.last_access_days > THRESHOLDS.last_access_stale_days) {
        unusedAssets.push({
          id: `stale-${b.id}`,
          category: "Unused Asset",
          suggestion: `Archive or delete stale bucket ${b.name}`,
          resource: `${b.provider.toUpperCase()} ${b.type.toUpperCase()} ${b.name}`,
          rationale: `No access for ${b.last_access_days} days • Size ${b.size_gb} GB`,
          estMonthly: b.monthly.toFixed(2),
          priority: "low",
          ...makeAction(`stale-${b.id}`, "Archive/Delete (Mock)", {
            kind: "archive-or-delete",
            provider: b.provider,
            resourceId: b.id,
            resourceType: b.type,
          }),
        });
      }
    }

    // Scheduling for dev/test running outside working hours
    const offNote = `Weekdays ${THRESHOLDS.work_hours.start}:00–${THRESHOLDS.work_hours.end}:00 on; otherwise off`;
    for (const vm of compute) {
      if (["dev", "test"].includes(vm.env) && vm.status === "running") {
        // Assume 60% savings with schedule
        scheduling.push({
          id: `schedule-${vm.id}`,
          category: "Scheduling",
          suggestion: `Enable auto-off schedule for ${vm.name}`,
          resource: `${vm.provider.toUpperCase()} VM ${vm.name} (${vm.env})`,
          rationale: `Non-prod instance running 24/7 • ${offNote}`,
          estMonthly: (vm.hourly * 24 * 30 * 0.6).toFixed(2),
          priority: "medium",
          ...makeAction(`schedule-${vm.id}`, "Set Schedule (Mock)", {
            kind: "schedule",
            provider: vm.provider,
            resourceId: vm.id,
            note: offNote,
          }),
        });
      }
    }
    for (const db of databases) {
      if (["dev", "test"].includes(db.env)) {
        scheduling.push({
          id: `schedule-db-${db.id}`,
          category: "Scheduling",
          suggestion: `Enable pause/out-of-hours schedule for ${db.name}`,
          resource: `${db.provider.toUpperCase()} ${db.engine.toUpperCase()} ${db.name}`,
          rationale: `Non-prod DB • ${offNote}`,
          estMonthly: (db.hourly * 24 * 30 * 0.5).toFixed(2),
          priority: "medium",
          ...makeAction(`schedule-db-${db.id}`, "Set Schedule (Mock)", {
            kind: "db-schedule",
            provider: db.provider,
            resourceId: db.id,
            note: offNote,
          }),
        });
      }
    }

    return { underutilized, rightsizing, unusedAssets, scheduling };
  }, [compute, databases, storage, assets, runningId]);

  // Local UI list of recommendations to render/remove rows without recomputing originals
  const allRecs = useMemo(
    () => [...recs.underutilized, ...recs.rightsizing, ...recs.unusedAssets, ...recs.scheduling],
    [recs]
  );

  // Track visible rows (so we can remove only one on success)
  const [visibleIds, setVisibleIds] = useState([]);
  useEffect(() => {
    // Initialize visible ids when recomputed lists change (keep existing removals)
    const ids = allRecs.map((r) => r.id);
    setVisibleIds((prev) => {
      // Preserve any previously removed ids by intersecting prev with new ids
      const prevSet = new Set(prev);
      const next = ids.filter((id) => prevSet.has(id) || !prev.length).concat(prev.length ? [] : []);
      // If first run (prev empty), show all ids
      return prev.length ? prev.filter((id) => ids.includes(id)) : ids;
    });
  }, [allRecs]);

  // Derived rows to show
  const displayedRows = useMemo(() => {
    const allowed = new Set(visibleIds);
    return allRecs.filter((r) => allowed.has(r.id));
  }, [allRecs, visibleIds]);

  // Simple category filter
  const [activeFilter, setActiveFilter] = useState("all");
  const filteredRows = useMemo(() => {
    const base = displayedRows;
    if (activeFilter === "all") return base;
    if (activeFilter === "underutilized") return base.filter((r) => r.id.startsWith("underutilized-"));
    if (activeFilter === "rightsizing") return base.filter((r) => r.id.startsWith("rightsize"));
    if (activeFilter === "unused") return base.filter((r) => r.id.startsWith("unused-") || r.id.startsWith("stale-"));
    if (activeFilter === "scheduling") return base.filter((r) => r.id.startsWith("schedule"));
    return base;
  }, [activeFilter, displayedRows]);

  // Execute the action associated to a recommendation (mock flow)
  const runRecommendation = useCallback(async (rec) => {
    if (!rec || !rec.id) return;
    if (runningId) return; // Prevent concurrently running multiple actions
    setRunningId(rec.id);
    try {
      // Simulate a network call. In future, integrate: e.g., controlResource(...) or specific function.
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 15% chance to throw an error to exercise error UI
          if (Math.random() < 0.15) {
            reject(new Error(`Failed to execute ${rec.actionPayload?.kind || "action"} on ${rec.resource}`));
          } else {
            resolve();
          }
        }, 900);
      });

      // Success: toast and remove only the completed row
      toast.success(`Completed: ${rec.suggestion}`);
      setVisibleIds((ids) => ids.filter((id) => id !== rec.id));
    } catch (err) {
      // Error: show error toast
      toast.error(err?.message || "Failed to run the action.");
    } finally {
      setRunningId(null);
    }
  }, [runningId, toast]);

  // Simulate refresh
  function refresh() {
    // TODO: Replace with fetch to Edge Function: /functions/v1/recommendations
    toast.info("Fetching latest recommendations…");
    // For mock, just re-trigger the recompute by toggling some state or no-op
    setTimeout(() => toast.success("Recommendations refreshed."), 600);
  }

  useEffect(() => {
    // Placeholder effect; in real impl, fetch on mount
  }, []);

  // Map to table columns for a unified list
  const columns = [
    { key: "category", label: "Category" },
    { key: "suggestion", label: "Recommendation" },
    { key: "resource", label: "Resource" },
    { key: "rationale", label: "Rationale" },
    {
      key: "estMonthly",
      label: "Est. Monthly Save ($)",
      render: (v) => <span className="text-success" style={{ fontWeight: 700 }}>${Number(v || 0).toFixed(2)}</span>,
    },
    { key: "priority", label: "Priority" },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => {
        const isRunning = runningId === r.id;
        return (
          <div className="table__actions">
            <button
              className="btn primary"
              onClick={() => runRecommendation(r)}
              disabled={isRunning}
            >
              {isRunning ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Spinner size={14} />
                  Running…
                </span>
              ) : (
                r.actionLabel
              )}
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                // archive/ignore only removes from view without running anything
                setVisibleIds((ids) => ids.filter((id) => id !== r.id));
                toast.info("Recommendation ignored.");
              }}
              disabled={isRunning}
            >
              Ignore
            </button>
          </div>
        );
      },
    },
  ];

  // Card stats
  const totalMonthlySave = useMemo(
    () => filteredRows.reduce((sum, r) => sum + Number(r.estMonthly || 0), 0),
    [filteredRows]
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Recommendations</div>
        <div style={{ display: "inline-flex", gap: 8 }}>
          <select
            className="select select--compact"
            aria-label="Filter category"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="underutilized">Underutilized</option>
            <option value="rightsizing">Right-Sizing</option>
            <option value="unused">Unused Assets</option>
            <option value="scheduling">Scheduling</option>
          </select>
          <button className="btn" onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        {/* Stat overview */}
        <div className="card-grid">
          <StatCard
            title="Potential Monthly Savings"
            value={`$${totalMonthlySave.toFixed(2)}`}
            subtitle={`${filteredRows.length} recs`}
          />
          <StatCard
            title="Underutilized"
            value={recs.underutilized.filter((r) => visibleIds.includes(r.id)).length}
            subtitle="Compute/Storage"
          />
          <StatCard
            title="Right-Sizing"
            value={recs.rightsizing.filter((r) => visibleIds.includes(r.id)).length}
            subtitle="Instances & DBs"
          />
          <StatCard
            title="Unused Assets"
            value={recs.unusedAssets.filter((r) => visibleIds.includes(r.id)).length}
            subtitle="Snapshots/IPs/Volumes"
          />
        </div>

        {/* Unified actionable list rendered as minimalist table */}
        <div className="table-wrapper">
          <table role="table" aria-label="Recommendations">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td className="table__cell--empty" colSpan={columns.length}>
                    No recommendations available.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        {typeof c.render === "function" ? c.render(r[c.key], r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Note: Recommendations are generated from mock data with heuristic thresholds. TODO: Integrate real usage and cost signals via Supabase Edge Function and provider APIs. ENV required: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY.
        </div>
      </div>
    </div>
  );
}

/** Simple inline spinner to avoid extra dependencies */
function Spinner({ size = 12 }) {
  const s = size;
  return (
    <span
      aria-hidden="true"
      style={{
        width: s,
        height: s,
        border: "2px solid rgba(255,255,255,0.45)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
