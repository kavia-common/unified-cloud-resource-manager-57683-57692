import React, { useMemo, useState } from "react";
import Tabs from "../../components/ui/Tabs";
import Modal from "../../components/ui/Modal";

/**
 * PUBLIC_INTERFACE
 * Inventory
 * Presents cloud resources in a minimalist, responsive tabular layout with typical columns:
 * Resource Name, Type, Cloud Provider, Region, Status, Cost, Actions.
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

function ActionButtons({ onAction }) {
  const btn = {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
  };
  const danger = { ...btn, border: "1px solid #EF4444", color: "#EF4444" };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button style={btn} onClick={() => onAction("Details")}>Details</button>
      <button style={btn} onClick={() => onAction("Start")}>Start</button>
      <button style={btn} onClick={() => onAction("Stop")}>Stop</button>
      <button style={btn} onClick={() => onAction("Resize")}>Resize</button>
      <button style={danger} onClick={() => onAction("Delete")}>Delete</button>
    </div>
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

  const onAction = (action, row) => {
    if (action === "Resize") setResizeTarget(row);
    else window.alert(`${action} requested (mock) for ${row.name}`);
  };

  const [resizeTarget, setResizeTarget] = useState(null);

  return (
    <>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="table__cell--empty" colSpan={7}>No resources found</td>
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
                <td><ActionButtons onAction={(a) => onAction(a, r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      <Modal open={!!resizeTarget} onClose={() => setResizeTarget(null)} title={`Resize - ${resizeTarget?.name || ""}`}>
        <ResizeForm
          current={"t3.medium"}
          onSubmit={(sz) => {
            setResizeTarget(null);
            window.alert(`Resize to ${sz} requested (mock)`);
          }}
        />
      </Modal>
    </>
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
 * Renders a minimalist table for the inventory with standard columns and mock actions.
 */
function GenericTable({ rows = [] }) {
  const [resizeTarget, setResizeTarget] = useState(null);

  const onAction = (action, row) => {
    if (action === "Resize") setResizeTarget(row);
    else window.alert(`${action} requested (mock) for ${row.name}`);
  };

  return (
    <>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="table__cell--empty" colSpan={7}>No resources found</td>
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
                <td><ActionButtons onAction={(a) => onAction(a, r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      <Modal open={!!resizeTarget} onClose={() => setResizeTarget(null)} title={`Resize - ${resizeTarget?.name || ""}`}>
        <ResizeForm
          current={"t3.medium"}
          onSubmit={(sz) => {
            setResizeTarget(null);
            window.alert(`Resize to ${sz} requested (mock)`);
          }}
        />
      </Modal>
    </>
  );
}

/**
 * Resize form reused by tables
 */
function ResizeForm({ current = "t3.medium", onSubmit }) {
  const [size, setSize] = useState(current);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(size);
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <label style={smallLabel}>New size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle}>
          <option>t3.small</option>
          <option>t3.medium</option>
          <option>m5.large</option>
          <option>m5.xlarge</option>
          <option>Standard_D2s_v5</option>
          <option>Standard_F4s_v2</option>
        </select>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={primaryBtn}>Request Resize</button>
      </div>
    </form>
  );
}

/* Shared minimalist styles (use theme tokens) */
const smallLabel = { display: "block", color: "#374151", fontSize: 13, marginBottom: 6 };
const selectStyle = { width: "100%", background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#111827", padding: "8px 10px", borderRadius: 8, fontSize: 13 };
const primaryBtn = { background: "#111827", border: "1px solid #111827", color: "#FFFFFF", padding: "6px 12px", borderRadius: 8, fontSize: 12 };
