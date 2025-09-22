import React, { useMemo, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import FilterBar from "../../components/ui/Filters";

// PUBLIC_INTERFACE
export default function Inventory() {
  /** Inventory with filters, actions and operation modal (start/stop/scale). */
  const [rows, setRows] = useState([
    { id: "i-123", name: "web-1", provider: "aws", type: "ec2", region: "us-east-1", state: "running", cost_daily: 4.12 },
    { id: "vm-001", name: "api-1", provider: "azure", type: "vm", region: "eastus", state: "stopped", cost_daily: 5.44 },
    { id: "db-01", name: "orders-db", provider: "aws", type: "rds", region: "us-west-2", state: "running", cost_daily: 7.8 },
  ]);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState("start");
  const [size, setSize] = useState("medium");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.provider && r.provider !== filters.provider) return false;
      if (q && ![r.name, r.id, r.type, r.region].some(v => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, filters, search]);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider" },
    { key: "type", label: "Type" },
    { key: "region", label: "Region" },
    { key: "state", label: "State", render: (v) => <span className={`badge ${v === "running" ? "success" : ""}`}>{v}</span> },
    { key: "cost_daily", label: "Daily Cost ($)", render: (v) => (v ? Number(v).toFixed(2) : "—") },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => { setSelected(r); setOpen(true); setOperation("start"); }}>Operate</button>
        </div>
      ),
    },
  ];

  function runOperation() {
    // Mock update of state
    if (!selected) return;
    setRows(prev => prev.map(r => {
      if (r.id !== selected.id) return r;
      if (operation === "start") return { ...r, state: "running" };
      if (operation === "stop") return { ...r, state: "stopped" };
      if (operation === "scale") return { ...r, size };
      return r;
    }));
    setOpen(false); setSelected(null);
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
        <FilterBar
          values={filters}
          onChange={setFilters}
          providerOptions={[
            { value: "aws", label: "AWS" },
            { value: "azure", label: "Azure" },
          ]}
        />
        <div style={{ height: 10 }} />
        <DataTable columns={columns} rows={filtered} emptyMessage="No resources discovered yet." />
      </div>

      <Modal
        title={selected ? `Operate: ${selected.name}` : "Operate"}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn primary" onClick={runOperation}>Run</button>
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
