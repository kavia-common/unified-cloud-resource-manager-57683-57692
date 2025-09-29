import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";

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
          actionLabel: "Stop (Mock)",
          onApply: () => alert(`TODO: Stop VM via backend => ${vm.id}`),
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
            actionLabel: "Resize (Mock)",
            onApply: () => alert(`TODO: Resize VM via backend => ${vm.id} -> ${target}`),
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
            actionLabel: "Scale (Mock)",
            onApply: () => alert(`TODO: Scale DB via backend => ${db.id} -> ${target}`),
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
          actionLabel: "Delete (Mock)",
          onApply: () => alert(`TODO: Delete asset via backend => ${a.id}`),
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
          actionLabel: "Archive/Delete (Mock)",
          onApply: () => alert(`TODO: Lifecycle policy or delete via backend => ${b.id}`),
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
          actionLabel: "Set Schedule (Mock)",
          onApply: () => alert(`TODO: Create schedule via backend => ${vm.id}`),
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
          actionLabel: "Set Schedule (Mock)",
          onApply: () => alert(`TODO: Create schedule for DB via backend => ${db.id}`),
        });
      }
    }

    return { underutilized, rightsizing, unusedAssets, scheduling };
  }, [compute, databases, storage, assets]);

  // Flatten for totals
  const allRecs = useMemo(
    () => [...recs.underutilized, ...recs.rightsizing, ...recs.unusedAssets, ...recs.scheduling],
    [recs]
  );

  // Map to table rows for a unified list
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
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn primary" onClick={r.onApply}>{r.actionLabel}</button>
          <button
            className="btn ghost"
            onClick={() => alert(`TODO: Ignore/Archive recommendation => ${r.id}`)}
          >
            Ignore
          </button>
        </div>
      ),
    },
  ];

  // Card stats
  const totalMonthlySave = useMemo(
    () => allRecs.reduce((sum, r) => sum + Number(r.estMonthly || 0), 0),
    [allRecs]
  );

  // Simple category filter
  const [activeFilter, setActiveFilter] = useState("all");
  const filteredRows = useMemo(() => {
    if (activeFilter === "all") return allRecs;
    if (activeFilter === "underutilized") return recs.underutilized;
    if (activeFilter === "rightsizing") return recs.rightsizing;
    if (activeFilter === "unused") return recs.unusedAssets;
    if (activeFilter === "scheduling") return recs.scheduling;
    return allRecs;
  }, [activeFilter, allRecs, recs]);

  // Simulate refresh
  function refresh() {
    // TODO: Replace with fetch to Edge Function: /functions/v1/recommendations
    alert("TODO: Fetch fresh recommendations from backend/AI.");
  }

  useEffect(() => {
    // Placeholder effect; in real impl, fetch on mount
  }, []);

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
            label="Potential Monthly Savings"
            value={`$${totalMonthlySave.toFixed(2)}`}
            deltaLabel={`${filteredRows.length} recs`}
            deltaType="up"
            variant="violet"
          />
          <StatCard
            label="Underutilized"
            value={recs.underutilized.length}
            deltaLabel="Compute/Storage"
            deltaType="up"
            variant="neutral"
          />
          <StatCard
            label="Right-Sizing"
            value={recs.rightsizing.length}
            deltaLabel="Instances & DBs"
            deltaType="up"
            variant="neutral"
          />
          <StatCard
            label="Unused Assets"
            value={recs.unusedAssets.length}
            deltaLabel="Snapshots/IPs/Volumes"
            deltaType="up"
            variant="neutral"
          />
        </div>

        {/* Unified actionable list */}
        <DataTable
          variant="transparent"
          columns={columns}
          rows={filteredRows}
          emptyMessage="No recommendations available."
          headerClassName="table__head--inventory"
        />

        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Note: Recommendations are generated from mock data with heuristic thresholds. TODO: Integrate real usage and cost signals via Supabase Edge Function and provider APIs. ENV required: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY.
        </div>
      </div>
    </div>
  );
}
