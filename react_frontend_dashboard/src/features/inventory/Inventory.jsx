import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Popover } from "../../components/ui/Popover";

// A compact vertical dropdown component local to Inventory for minimalist control
function VerticalDropdown({ label = "Filter", options = [], value, onChange, width = 220 }) {
  // PUBLIC_INTERFACE
  /** Minimal vertical dropdown:
   * - Trigger button in Pure White style
   * - Options stack vertically when opened
   * - Click outside or Escape closes via parent Popover
   */
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  const selectedLabel =
    (options.find((o) => (o.value ?? o) === value)?.label ?? value ?? "All");

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        className="btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "8px 10px",
          fontSize: 14,
          color: "var(--text)",
          minWidth: width,
          justifyContent: "space-between",
          boxShadow: "var(--shadow)",
        }}
      >
        <span style={{ color: "var(--muted)" }}>{label}:</span>
        <span>{selectedLabel}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      <div style={{ position: "absolute" }}>
        <Popover open={open} onClose={() => setOpen(false)} anchorRef={btnRef} ariaLabel={`${label} options`}>
          <div
            role="listbox"
            tabIndex={-1}
            className="panel"
            style={{
              padding: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              minWidth: width,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <button
              role="option"
              aria-selected={value === "" || value == null}
              className="btn ghost"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
              style={{ justifyContent: "flex-start" }}
            >
              All
            </button>
            {options.map((o) => {
              const v = o.value ?? o;
              const l = o.label ?? o.value ?? o;
              const active = v === value;
              return (
                <button
                  key={v}
                  role="option"
                  aria-selected={active}
                  className="btn ghost"
                  onClick={() => {
                    onChange?.(v);
                    setOpen(false);
                  }}
                  style={{
                    justifyContent: "flex-start",
                    background: active ? "#fff" : undefined,
                    borderColor: active ? "var(--border)" : undefined,
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </Popover>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function Inventory() {
  /** Inventory with filters, actions and operation modal (start/stop/scale). */
  const [rows, setRows] = useState([
    { id: "i-123", name: "web-1", provider: "aws", type: "ec2", region: "us-east-1", status: "Running", cost_daily: 4.12 },
    { id: "vm-001", name: "api-1", provider: "azure", type: "vm", region: "eastus", status: "Stopped", cost_daily: 5.44 },
    { id: "db-01", name: "orders-db", provider: "aws", type: "rds", region: "us-west-2", status: "Running", cost_daily: 7.8 },
  ]);

  // Filter state: provider and status for meaningful control
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState("start");
  const [size, setSize] = useState("medium");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (provider && r.provider !== provider) return false;
      if (status && String(r.status).toLowerCase() !== String(status).toLowerCase()) return false;
      if (q && ![r.name, r.id, r.type, r.region].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, provider, status, search]);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    {
      key: "provider",
      label: "Provider",
      render: (v) => String(v || "").toUpperCase(),
    },
    { key: "type", label: "Type" },
    { key: "region", label: "Region" },
    { key: "status", label: "Status" },
    { key: "cost_daily", label: "Daily Cost ($)", render: (v) => (v ? Number(v).toFixed(2) : "—") },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button
            className="btn ghost"
            onClick={() => {
              setSelected(r);
              setOpen(true);
              setOperation("start");
            }}
          >
            Operate
          </button>
        </div>
      ),
    },
  ];

  function runOperation() {
    if (!selected) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== selected.id) return r;
        if (operation === "start") return { ...r, status: "Running" };
        if (operation === "stop") return { ...r, status: "Stopped" };
        if (operation === "scale") return { ...r, size };
        return r;
      })
    );
    setOpen(false);
    setSelected(null);
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Inventory</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" placeholder="Search resources..." onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="panel-body">
        <div
          className="table-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <VerticalDropdown
              label="Provider"
              value={provider}
              onChange={setProvider}
              options={[
                { value: "aws", label: "AWS" },
                { value: "azure", label: "Azure" },
              ]}
            />
            <VerticalDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "Running", label: "Running" },
                { value: "Stopped", label: "Stopped" },
              ]}
            />
          </div>
          <div />
        </div>

        <DataTable
          variant="transparent"
          columns={columns}
          rows={filtered}
          emptyMessage="No resources discovered yet."
          headerClassName="table__head--inventory"
          tableClassName="table--inventory"
        />
      </div>

      <Modal
        title={selected ? `Operate: ${selected.name}` : "Operate"}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={runOperation}>
              Run
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Operation</div>
            <select className="select" value={operation} onChange={(e) => setOperation(e.target.value)}>
              <option value="start">Start</option>
              <option value="stop">Stop</option>
              <option value="scale">Scale</option>
            </select>
          </label>
          {operation === "scale" && (
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Target Size</div>
              <select className="select" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
