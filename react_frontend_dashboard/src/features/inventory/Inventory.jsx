import React, { useMemo, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Inventory (Table-based)
 * Minimalist data table view for resources with search/filter controls.
 * Columns: Resource Type, Provider (with icon), Resource Name, Key Metadata (CPU, RAM, Location),
 * Status (with color badge), and Actions (Start, Stop, View Details).
 */
export default function Inventory() {
  // Mock resources (initial implementation)
  const mockResources = useMemo(
    () => [
      { id: "aws-ec2-1", provider: "AWS", type: "VM", name: "prod-web-01", cpu: "4 vCPU", ram: "16 GB", region: "us-east-1", status: "Active" },
      { id: "aws-ec2-2", provider: "AWS", type: "VM", name: "batch-worker-a", cpu: "2 vCPU", ram: "8 GB", region: "us-west-2", status: "Stopped" },
      { id: "azure-vm-1", provider: "Azure", type: "VM", name: "az-core-app-01", cpu: "8 vCPU", ram: "32 GB", region: "eastus", status: "Active" },
      { id: "gcp-gce-1", provider: "GCP", type: "VM", name: "gcp-analytics-1", cpu: "16 vCPU", ram: "64 GB", region: "us-central1", status: "Active" },
      { id: "aws-s3-1", provider: "AWS", type: "Storage", name: "logs-archive-bucket", cpu: "-", ram: "-", region: "eu-west-1", status: "Active" },
      { id: "azure-sql-1", provider: "Azure", type: "Database", name: "sales-db", cpu: "2 vCore", ram: "—", region: "westeurope", status: "Active" },
      { id: "gcp-storage-1", provider: "GCP", type: "Storage", name: "gcs-backups", cpu: "-", ram: "-", region: "us-west1", status: "Active" },
      { id: "aws-ec2-3", provider: "AWS", type: "VM", name: "dev-svc-02", cpu: "2 vCPU", ram: "4 GB", region: "ap-southeast-1", status: "Stopped" },
    ],
    []
  );

  // UI state
  const [query, setQuery] = useState("");
  const [activeProviders, setActiveProviders] = useState(new Set()); // empty => all
  const [activeTypes, setActiveTypes] = useState(new Set()); // empty => all
  const [statusFilter, setStatusFilter] = useState(new Set()); // Active/Stopped
  const [sortKey, setSortKey] = useState("name"); // name | provider | type | region | status

  // Helpers
  const providerIcon = (p) => {
    const baseStyle = {
      width: 28,
      height: 28,
      minWidth: 28,
      display: "grid",
      placeItems: "center",
      borderRadius: 8,
      border: "1px solid var(--border-color)",
      boxShadow: "var(--shadow-sm)",
    };
    if (p === "AWS")
      return (
        <div style={{ ...baseStyle, background: "#FEF3C7", color: "#92400E" }} title="AWS" aria-label="AWS">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 7.5V16l8 4.5V12" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 7.5V16l-8 4.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
      );
    if (p === "Azure")
      return (
        <div style={{ ...baseStyle, background: "#DBEAFE", color: "#1E3A8A" }} title="Azure" aria-label="Azure">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 18l9-15 9 15H3z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 3l3.5 6H8.5L12 3z" fill="currentColor" />
          </svg>
        </div>
      );
    if (p === "GCP")
      return (
        <div style={{ ...baseStyle, background: "#ECFEFF", color: "#155E75" }} title="GCP" aria-label="GCP">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      );
    return (
      <div style={{ ...baseStyle, background: "#F3F4F6", color: "#374151" }} title={p} aria-label={p}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
    );
  };

  const statusBadge = (s) => {
    const map = {
      Active: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0" },
      Stopped: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA" },
    };
    const c = map[s] || { bg: "#F3F4F6", fg: "#374151", bd: "#E5E7EB" };
    return (
      <span
        className="badge"
        style={{
          background: c.bg,
          color: c.fg,
          borderColor: c.bd,
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 10px",
          whiteSpace: "nowrap",
        }}
      >
        {s}
      </span>
    );
  };

  const chip = (label, active, onToggle) => (
    <button
      type="button"
      className="chip"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 600,
        background: active ? "#111827" : "var(--chip-bg)",
        color: active ? "#FFFFFF" : "var(--chip-text)",
        borderColor: active ? "#0b1220" : "var(--border-color)",
        transition: "all .15s ease",
      }}
    >
      {label}
    </button>
  );

  // Toggle helpers
  const toggleInSet = (set, value, setter) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  // Derived lists for filters
  const providerOptions = useMemo(
    () => Array.from(new Set(mockResources.map((r) => r.provider))),
    [mockResources]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(mockResources.map((r) => r.type))),
    [mockResources]
  );
  const statusOptions = ["Active", "Stopped"];

  // Filtering + sorting
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = mockResources.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q);
      const matchesProvider =
        activeProviders.size === 0 || activeProviders.has(r.provider);
      const matchesType = activeTypes.size === 0 || activeTypes.has(r.type);
      const matchesStatus =
        statusFilter.size === 0 || statusFilter.has(r.status);
      return matchesQuery && matchesProvider && matchesType && matchesStatus;
    });

    arr.sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      return av.localeCompare(bv);
    });
    return arr;
  }, [mockResources, query, activeProviders, activeTypes, statusFilter, sortKey]);

  // Actions (mock)
  const handleStart = (id) => console.log("Start resource", id);
  const handleStop = (id) => console.log("Stop resource", id);
  const handleView = (id) => console.log("View details for", id);

  return (
    <div className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="panel-header" style={{ alignItems: "start", flexWrap: "wrap", gap: 10 }}>
        <div className="panel-title">Inventory</div>
        {/* Right-aligned controls */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div
            className="search"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              background: "var(--input-bg)",
              boxShadow: "var(--shadow-sm)",
              minWidth: 240,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              aria-label="Search resources"
              placeholder="Search resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: 14,
                background: "transparent",
                color: "var(--color-text)",
                width: 200,
              }}
            />
          </div>

          {/* Sort */}
          <label style={{ display: "inline-grid", gap: 6 }}>
            <span className="text-subtle" style={{ fontSize: 12 }}>Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="Sort resources"
              style={{ padding: "8px 10px", minWidth: 140 }}
            >
              <option value="name">Name</option>
              <option value="provider">Provider</option>
              <option value="type">Type</option>
              <option value="region">Region</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
      </div>

      {/* Filters as chips (minimalist) */}
      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="text-subtle" style={{ fontSize: 12, alignSelf: "center" }}>Providers:</span>
          {providerOptions.map((p) =>
            <span key={p}>
              {chip(p, activeProviders.has(p), () => toggleInSet(activeProviders, p, setActiveProviders))}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="text-subtle" style={{ fontSize: 12, alignSelf: "center" }}>Types:</span>
          {typeOptions.map((t) =>
            <span key={t}>
              {chip(t, activeTypes.has(t), () => toggleInSet(activeTypes, t, setActiveTypes))}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="text-subtle" style={{ fontSize: 12, alignSelf: "center" }}>Status:</span>
          {statusOptions.map((s) =>
            <span key={s}>
              {chip(s, statusFilter.has(s), () => toggleInSet(statusFilter, s, setStatusFilter))}
            </span>
          )}
        </div>

        {/* Results Table */}
        <div className="table-wrapper" role="region" aria-label="Resources table">
          <table>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Resource Type</th>
                <th style={{ width: 160 }}>Provider</th>
                <th>Resource Name</th>
                <th style={{ width: 360 }}>Key Metadata</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 260, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="table__cell--empty" colSpan={6}>No resources match your filters.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.type}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {providerIcon(r.provider)}
                        <span style={{ fontWeight: 600 }}>{r.provider}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--color-text)" }}>
                      {r.name}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "var(--color-text)" }}>
                        <span><span className="text-subtle">CPU:</span> {r.cpu}</span>
                        <span><span className="text-subtle">RAM:</span> {r.ram}</span>
                        <span><span className="text-subtle">Location:</span> {r.region}</span>
                      </div>
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          className="btn secondary"
                          onClick={() => handleStart(r.id)}
                          aria-label={`Start ${r.name}`}
                          disabled={r.status === "Active"}
                          style={{ opacity: r.status === "Active" ? 0.6 : 1 }}
                        >
                          Start
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() => handleStop(r.id)}
                          aria-label={`Stop ${r.name}`}
                          disabled={r.status === "Stopped"}
                          style={{ opacity: r.status === "Stopped" ? 0.6 : 1 }}
                        >
                          Stop
                        </button>
                        <button
                          className="btn primary"
                          onClick={() => handleView(r.id)}
                          aria-label={`View details for ${r.name}`}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
