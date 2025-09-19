import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";

function useResources() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && Array.isArray(data)) setRows(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  return { rows, loading, refresh };
}

function OperationModal({ open, onClose, resource, onSubmit }) {
  const [operation, setOperation] = useState("start");
  const [size, setSize] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  async function run() {
    setSubmitting(true);
    try { await onSubmit(operation, operation === "scale" ? { size } : {}); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal
      title={`Operate: ${resource?.name || ""}`}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={run} disabled={submitting}>{submitting ? "Running..." : "Run"}</button>
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
        <div className="badge">This will enqueue operation via Supabase (Edge Function / table) if configured.</div>
      </div>
    </Modal>
  );
}

/** Inventory resources with inline actions and operations modal. */
export default function Inventory() {
  const { rows, loading, refresh } = useResources();
  const [selected, setSelected] = useState(null);
  const [openOp, setOpenOp] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.type, r.provider, r.region].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [rows, search]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider" },
    { key: "type", label: "Type" },
    { key: "region", label: "Region" },
    { key: "state", label: "State", render: (v) => <span className={`badge ${v === "running" ? "success" : ""}`}>{v || "unknown"}</span> },
    { key: "cost_daily", label: "Daily Cost ($)", render: (v) => (v ? v.toFixed?.(2) ?? v : "—") },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => { setSelected(r); setOpenOp(true); }}>Operate</button>
        </div>
      ),
    },
  ];

  async function runOperation(op, params) {
    // Example: insert into "operations" table; edge functions could listen/execute.
    await supabase.from("operations").insert({
      resource_id: selected.id,
      operation: op,
      params: params || {},
      status: "queued",
    });
    setOpenOp(false);
    setSelected(null);
    refresh();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Inventory</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" placeholder="Search resources..." onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={filtered} emptyMessage="No resources discovered yet." />
      </div>
      <OperationModal
        open={openOp}
        onClose={() => setOpenOp(false)}
        resource={selected}
        onSubmit={runOperation}
      />
    </div>
  );
}
