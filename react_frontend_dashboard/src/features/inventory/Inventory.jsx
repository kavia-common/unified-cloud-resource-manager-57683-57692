import React, { useMemo, useRef, useState } from "react";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import FilterBar from "../../components/ui/Filters";
import { Popover } from "../../components/ui/Popover";

// PUBLIC_INTERFACE
export default function Inventory() {
  /** Inventory with filters, actions and operation modal (start/stop/scale). */
  const [rows, setRows] = useState([
    { id: "i-123", name: "web-1", provider: "aws", type: "ec2", region: "us-east-1", status: "Running", cost_daily: 4.12 },
    { id: "vm-001", name: "api-1", provider: "azure", type: "vm", region: "eastus", status: "Stopped", cost_daily: 5.44 },
    { id: "db-01", name: "orders-db", provider: "aws", type: "rds", region: "us-west-2", status: "Running", cost_daily: 7.8 },
  ]);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState("start");
  const [size, setSize] = useState("medium");
  const [open, setOpen] = useState(false);

  // popover (filters) state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

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
        <div className="table-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              ref={filterBtnRef}
              className="btn"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              aria-label="Open filters"
              onClick={() => setFilterOpen((v) => !v)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm4 6h2v2h-2v-2z" />
              </svg>
              <span style={{ fontSize: 14 }}>Filters</span>
            </button>

            <div style={{ position: "absolute" }}>
              <Popover open={filterOpen} onClose={() => setFilterOpen(false)} anchorRef={filterBtnRef} ariaLabel="Inventory filters">
                <div
                  className="panel"
                  style={{
                    padding: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    minWidth: 320,
                    maxWidth: 480,
                  }}
                >
                  <FilterBar
                    values={filters}
                    onChange={setFilters}
                    providerOptions={[
                      { value: "aws", label: "AWS" },
                      { value: "azure", label: "Azure" },
                    ]}
                    showDateRange={false}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button className="btn ghost" onClick={() => { setFilters({}); setFilterOpen(false); }} aria-label="Clear filters">
                      Clear
                    </button>
                    <button className="btn primary" onClick={() => setFilterOpen(false)} aria-label="Apply filters">
                      Apply
                    </button>
                  </div>
                </div>
              </Popover>
            </div>
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
