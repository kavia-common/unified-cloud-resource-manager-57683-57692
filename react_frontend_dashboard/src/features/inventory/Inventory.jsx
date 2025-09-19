import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { getAwsInventory, getAzureInventory, getGcpInventory } from "../../lib/cloudApi";

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

  // Mock Cloud Data section state
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState("");
  const [mockData, setMockData] = useState({ aws: [], azure: [], gcp: [] });

  async function loadMock() {
    setMockLoading(true);
    setMockError("");
    try {
      const [aws, azure, gcp] = await Promise.all([
        getAwsInventory(),
        getAzureInventory(),
        getGcpInventory(),
      ]);
      setMockData({
        aws: Array.isArray(aws.data) ? aws.data : [],
        azure: Array.isArray(azure.data) ? azure.data : [],
        gcp: Array.isArray(gcp.data) ? gcp.data : [],
      });
      if (aws.error || azure.error || gcp.error) {
        // Collect first error message to display
        const err = aws.error?.message || azure.error?.message || gcp.error?.message || "Unknown error";
        setMockError(err);
      }
    } finally {
      setMockLoading(false);
    }
  }

  const mockColumns = [
    { key: "id", label: "ID" },
    { key: "type", label: "Type" },
    { key: "status", label: "State" },
    { key: "cost", label: "Daily Cost ($)", render: (v) => (v ? Number(v).toFixed(2) : "—") },
  ];

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

        <div style={{ height: 16 }} />

        <div className="panel" style={{ border: "1px dashed var(--border)" }}>
          <div className="panel-header">
            <div className="panel-title">Cloud Mock Data (Edge Functions)</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={loadMock} disabled={mockLoading}>
                {mockLoading ? "Loading..." : "Load from mock-aws/mock-azure/mock-gcp"}
              </button>
            </div>
          </div>
          <div className="panel-body">
            {mockError && <div className="badge error">Error: {mockError}</div>}
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div className="panel-title" style={{ marginBottom: 8 }}>AWS</div>
                <DataTable columns={mockColumns} rows={mockData.aws} emptyMessage="No data from mock-aws." />
              </div>
              <div>
                <div className="panel-title" style={{ marginBottom: 8 }}>Azure</div>
                <DataTable columns={mockColumns} rows={mockData.azure} emptyMessage="No data from mock-azure." />
              </div>
              <div>
                <div className="panel-title" style={{ marginBottom: 8 }}>GCP</div>
                <DataTable columns={mockColumns} rows={mockData.gcp} emptyMessage="No data from mock-gcp." />
              </div>
            </div>
          </div>
        </div>
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
