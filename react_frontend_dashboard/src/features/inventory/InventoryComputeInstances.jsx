import React, { useMemo, useState } from "react";
import { DataTable } from "../../components/ui/Table";

/**
 * PUBLIC_INTERFACE
 * InventoryComputeInstances
 * A minimalist table view for listing compute resources (AWS EC2, Azure VMs, and generic compute types).
 * Uses mock data, styled for the Pure White theme, and scaffolded for easy future data fetching.
 */
export default function InventoryComputeInstances() {
  /**
   * Local mock dataset. Replace with live data retrieval in future integration.
   * Schema fields:
   * - provider: 'aws' | 'azure' | 'other'
   * - resourceType: e.g., 'EC2', 'VM', 'Container', ...
   * - nameOrId: primary identifier (string)
   * - status: 'running' | 'stopped' | 'terminated' | other human-readable status
   * - region: cloud region or location
   * - costMonthly: approximate monthly cost number
   * - tags: array<{ key: string, value: string }>
   */
  const [rows] = useState([
    {
      provider: "aws",
      resourceType: "EC2",
      nameOrId: "i-0a12bc345def67890",
      status: "running",
      region: "us-east-1",
      costMonthly: 82.45,
      tags: [
        { key: "env", value: "prod" },
        { key: "team", value: "web" },
      ],
    },
    {
      provider: "azure",
      resourceType: "VM",
      nameOrId: "vm-az-eus-app-01",
      status: "stopped",
      region: "eastus",
      costMonthly: 57.12,
      tags: [
        { key: "env", value: "dev" },
        { key: "owner", value: "platform" },
      ],
    },
    {
      provider: "other",
      resourceType: "Container",
      nameOrId: "container-node-17",
      status: "running",
      region: "eu-west-2",
      costMonthly: 23.77,
      tags: [
        { key: "service", value: "api" },
        { key: "cost-center", value: "cc-042" },
      ],
    },
  ]);

  // Filters and search
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  // PUBLIC_INTERFACE
  function TagList({ tags = [] }) {
    /** Render tags as subtle chips with key:value format. */
    if (!tags?.length) return <span className="text-subtle">—</span>;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tags.map((t, idx) => (
          <span
            key={`${t.key}-${t.value}-${idx}`}
            className="chip"
            style={{
              padding: "4px 8px",
              fontSize: 12,
            }}
            title={`${t.key}: ${t.value}`}
          >
            {t.key}:{t.value}
          </span>
        ))}
      </div>
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (provider && r.provider !== provider) return false;
      if (status && String(r.status).toLowerCase() !== status.toLowerCase())
        return false;
      if (
        q &&
        ![
          r.resourceType,
          r.nameOrId,
          r.provider,
          r.region,
          ...(r.tags || []).map((t) => `${t.key}:${t.value}`),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [rows, provider, status, search]);

  // Columns for the minimalist table
  const columns = [
    {
      header: "Resource Type",
      accessor: "resourceType",
      cell: (row) => (
        <span style={{ fontWeight: 600, letterSpacing: 0.1 }}>{row.resourceType}</span>
      ),
    },
    {
      header: "Name/ID",
      accessor: "nameOrId",
      cell: (row) => <code style={{ fontSize: 12 }}>{row.nameOrId}</code>,
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span
          className={
            row.status?.toLowerCase() === "running"
              ? "text-success"
              : row.status?.toLowerCase() === "stopped"
              ? "text-warning"
              : "text-subtle"
          }
          style={{ fontWeight: 600, textTransform: "capitalize" }}
        >
          {row.status}
        </span>
      ),
    },
    { header: "Region", accessor: "region" },
    {
      header: "Cost",
      accessor: "costMonthly",
      cell: (row) =>
        row.costMonthly != null ? `$${Number(row.costMonthly).toFixed(2)}/mo` : "—",
    },
    {
      header: "Tags",
      accessor: "tags",
      cell: (row) => <TagList tags={row.tags} />,
    },
    {
      header: "Provider",
      accessor: "provider",
      cell: (row) => row.provider?.toUpperCase(),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Inventory • Compute Instances</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Search by name, region, or tag…"
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search compute instances"
          />
        </div>
      </div>
      <div className="panel-body">
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <select
            className="input"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            aria-label="Filter by cloud provider"
            style={{ padding: "8px 10px" }}
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="other">Other</option>
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            style={{ padding: "8px 10px" }}
          >
            <option value="">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {/* Data table */}
        <DataTable
          columns={columns}
          data={filtered}
        />
        {filtered.length === 0 && (
          <div className="text-subtle" style={{ marginTop: 10 }}>
            No compute instances match your filters.
          </div>
        )}

        {/* Integration notes */}
        <div className="text-subtle" style={{ marginTop: 16, fontSize: 12 }}>
          Note: This view uses mock data. Integrate with backend by replacing the local
          state with a data hook (e.g., useEffect + fetch/Supabase) and map API fields
          into the displayed schema.
        </div>
      </div>
    </div>
  );
}
