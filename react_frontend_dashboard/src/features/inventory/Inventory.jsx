import React, { useMemo, useState } from "react";
import Tabs from "../../components/ui/Tabs";

/**
 * PUBLIC_INTERFACE
 * Inventory
 * Presents cloud resources in a minimalist, responsive tabular layout with typical columns:
 * Resource Name, Type, Cloud Provider, Region, Status, Cost.
 */
export default function Inventory() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-header" style={{ alignItems: "start", flexWrap: "wrap", gap: 10 }}>
        <div className="panel-title">Inventory</div>
      </div>

      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        <Tabs tabs={["All", "Compute", "Storage", "Databases", "Networking"]} active={activeTab} onChange={setActiveTab} />

        <section aria-live="polite">
          {activeTab === "All" && <AllResourcesTable />}
          {activeTab === "Compute" && <ComputeTableOnly />}
          {activeTab === "Storage" && <StorageTableOnly />}
          {activeTab === "Databases" && <DatabaseTableOnly />}
          {activeTab === "Networking" && <NetworkingTableOnly />}
        </section>
      </div>
    </div>
  );
}

/**
 * Minimalist Table scaffolding
 */
function TableWrapper({ children }) {
  return <div className="table-wrapper">{children}</div>;
}

function StatusBadge({ status }) {
  const map = {
    running: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0", label: "Running" },
    stopped: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA", label: "Stopped" },
    available: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0", label: "Available" },
    paused: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA", label: "Paused" },
    active: { bg: "#DBEAFE", fg: "#1E3A8A", bd: "#BFDBFE", label: "Active" },
    unknown: { bg: "#F3F4F6", fg: "#374151", bd: "#E5E7EB", label: "Unknown" },
  };
  const c = map[status] || map.unknown;
  return (
    <span
      className="badge"
      style={{
        background: c.bg,
        color: c.fg,
        borderColor: c.bd,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {c.label}
    </span>
  );
}

/**
 * All resources combined table
 */
function AllResourcesTable() {
  const rows = useMemo(
    () => [
      { id: "i-0a1b2c3", name: "web-01", type: "VM", provider: "AWS", region: "us-east-1", status: "running", cost: 28.4 },
      { id: "vm-az-001", name: "az-web-01", type: "VM", provider: "Azure", region: "eastus", status: "running", cost: 32.1 },
      { id: "s3-prod-logs", name: "prod-logs", type: "Storage", provider: "AWS", region: "us-east-1", status: "active", cost: 5.8 },
      { id: "rds-001", name: "orders-db", type: "Database", provider: "AWS", region: "us-east-1", status: "available", cost: 140.2 },
      { id: "azsql-002", name: "bi-warehouse", type: "Database", provider: "Azure", region: "eastus", status: "paused", cost: 0.0 },
      { id: "alb-123", name: "public-alb", type: "Networking", provider: "AWS", region: "us-west-2", status: "active", cost: 12.3 },
    ],
    []
  );

  return (
    <TableWrapper>
      <table role="table" aria-label="All resources inventory">
        <thead>
          <tr>
            <th>Resource Name</th>
            <th>Type</th>
            <th>Cloud Provider</th>
            <th>Region</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="table__cell--empty" colSpan={6}>No resources found</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <div style={{ display: "grid", gap: 2 }}>
                  <strong>{r.name}</strong>
                  <span className="text-subtle" style={{ fontSize: 12 }}>{r.id}</span>
                </div>
              </td>
              <td>{r.type}</td>
              <td>{r.provider}</td>
              <td>{r.region}</td>
              <td><StatusBadge status={r.status} /></td>
              <td style={{ textAlign: "right" }}>${r.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}

/**
 * Type-specific simplified tables
 */
function ComputeTableOnly() {
  const rows = useMemo(
    () => [
      { id: "i-0a1b2c3", name: "web-01", type: "VM", provider: "AWS", region: "us-east-1", status: "running", cost: 28.4 },
      { id: "vm-az-001", name: "az-web-01", type: "VM", provider: "Azure", region: "eastus", status: "running", cost: 32.1 },
    ],
    []
  );
  return <GenericTable rows={rows} />;
}

function StorageTableOnly() {
  const rows = useMemo(
    () => [
      { id: "s3-prod-logs", name: "prod-logs", type: "Storage", provider: "AWS", region: "us-east-1", status: "active", cost: 5.8 },
    ],
    []
  );
  return <GenericTable rows={rows} />;
}

function DatabaseTableOnly() {
  const rows = useMemo(
    () => [
      { id: "rds-001", name: "orders-db", type: "Database", provider: "AWS", region: "us-east-1", status: "available", cost: 140.2 },
      { id: "azsql-002", name: "bi-warehouse", type: "Database", provider: "Azure", region: "eastus", status: "paused", cost: 0.0 },
    ],
    []
  );
  return <GenericTable rows={rows} />;
}

function NetworkingTableOnly() {
  const rows = useMemo(
    () => [
      { id: "alb-123", name: "public-alb", type: "Networking", provider: "AWS", region: "us-west-2", status: "active", cost: 12.3 },
    ],
    []
  );
  return <GenericTable rows={rows} />;
}

/**
 * PUBLIC_INTERFACE
 * GenericTable
 * Renders a minimalist table for the inventory with standard columns.
 */
function GenericTable({ rows = [] }) {
  return (
    <TableWrapper>
      <table role="table" aria-label="Inventory table">
        <thead>
          <tr>
            <th>Resource Name</th>
            <th>Type</th>
            <th>Cloud Provider</th>
            <th>Region</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="table__cell--empty" colSpan={6}>No resources found</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <div style={{ display: "grid", gap: 2 }}>
                  <strong>{r.name}</strong>
                  <span className="text-subtle" style={{ fontSize: 12 }}>{r.id}</span>
                </div>
              </td>
              <td>{r.type}</td>
              <td>{r.provider}</td>
              <td>{r.region}</td>
              <td><StatusBadge status={r.status} /></td>
              <td style={{ textAlign: "right" }}>${(r.cost ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}
