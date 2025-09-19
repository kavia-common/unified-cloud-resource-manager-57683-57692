import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import {
  getAwsInventory,
  getAzureInventory,
  getGcpInventory,
  postCloudAction,
} from "../../lib/cloudApi";

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

  useEffect(() => {
    refresh();
  }, []);
  return { rows, loading, refresh };
}

function OperationModal({ open, onClose, resource, onSubmit }) {
  const [operation, setOperation] = useState("start");
  const [size, setSize] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  async function run() {
    setSubmitting(true);
    try {
      await onSubmit(operation, operation === "scale" ? { size } : {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Operate: ${resource?.name || ""}`}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={run} disabled={submitting}>
            {submitting ? "Running..." : "Run"}
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        <label>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            Operation
          </div>
          <select
            className="select"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
          >
            <option value="start">Start</option>
            <option value="stop">Stop</option>
            <option value="scale">Scale</option>
          </select>
        </label>
        {operation === "scale" && (
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              Target Size
            </div>
            <select
              className="select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        )}
        <div className="badge">
          This will enqueue operation via Supabase (Edge Function / table) if
          configured.
        </div>
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
    return rows.filter((r) =>
      [r.name, r.type, r.provider, r.region].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, search]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider" },
    { key: "type", label: "Type" },
    { key: "region", label: "Region" },
    {
      key: "state",
      label: "State",
      render: (v) => (
        <span className={`badge ${v === "running" ? "success" : ""}`}>
          {v || "unknown"}
        </span>
      ),
    },
    {
      key: "cost_daily",
      label: "Daily Cost ($)",
      render: (v) => (v ? v.toFixed?.(2) ?? v : "—"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            onClick={() => {
              setSelected(r);
              setOpenOp(true);
            }}
          >
            Operate
          </button>
        </div>
      ),
    },
  ];

  async function runOperation(op, params) {
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
  const [awsRows, setAwsRows] = useState([]); // EC2 + RDS
  const [azureVMRows, setAzureVMRows] = useState([]);
  const [azureStorageRows, setAzureStorageRows] = useState([]);
  const [gcpRows, setGcpRows] = useState([]); // Compute Engine

  async function loadMock() {
    setMockLoading(true);
    setMockError("");
    try {
      const [aws, azure, gcp] = await Promise.all([
        getAwsInventory(),
        getAzureInventory(),
        getGcpInventory(),
      ]);

      // AWS: expect array of EC2 + RDS rows from mock-aws
      setAwsRows(Array.isArray(aws.data) ? aws.data : []);

      // Azure: assume function returns { vms: [...], storage: [...] } or an array with type info
      let vmRows = [];
      let storageRows = [];
      if (azure && azure.data) {
        if (Array.isArray(azure.data)) {
          // Split by type if array
          vmRows = azure.data.filter((r) =>
            String(r.type || "").toLowerCase().includes("vm")
          );
          storageRows = azure.data.filter((r) =>
            String(r.type || "").toLowerCase().includes("storage")
          );
        } else if (typeof azure.data === "object") {
          vmRows = Array.isArray(azure.data.vms) ? azure.data.vms : [];
          storageRows = Array.isArray(azure.data.storage) ? azure.data.storage : [];
        }
      }
      setAzureVMRows(vmRows);
      setAzureStorageRows(storageRows);

      // GCP: expect Compute Engine instances. Filter by type if array has other services
      const gcpList = Array.isArray(gcp.data) ? gcp.data : [];
      setGcpRows(
        gcpList.filter((r) =>
          String(r.type || "").toLowerCase().includes("compute")
        )
      );

      if (aws.error || azure.error || gcp.error) {
        const err =
          aws.error?.message ||
          azure.error?.message ||
          gcp.error?.message ||
          "Unknown error";
        setMockError(err);
      }
    } finally {
      setMockLoading(false);
    }
  }

  // GCP start/stop actions wired to mock-gcp endpoint. Update UI state after response.
  async function handleGcpAction(row, action) {
    // optimistic UI: set to "updating"
    setGcpRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, _updating: true } : r))
    );
    const endpoint = action === "start" ? "action/start" : "action/stop";
    const { error } = await postCloudAction("gcp", endpoint, { id: row.id });
    setGcpRows((prev) =>
      prev.map((r) => {
        if (r.id !== row.id) return r;
        const nextStatus =
          action === "start" ? "running" : "stopped";
        return {
          ...r,
          status: error ? r.status : nextStatus,
          _updating: false,
        };
      })
    );
  }

  const baseColumns = [
    { key: "id", label: "ID" },
    { key: "type", label: "Type" },
    {
      key: "status",
      label: "State",
      render: (v) => (
        <span className={`badge ${v === "running" ? "success" : ""}`}>
          {v || "unknown"}
        </span>
      ),
    },
    {
      key: "cost",
      label: "Daily Cost ($)",
      render: (v) => (v ? Number(v).toFixed(2) : "—"),
    },
  ];

  const gcpColumns = [
    ...baseColumns,
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            disabled={r._updating || r.status === "running"}
            onClick={() => handleGcpAction(r, "start")}
            title="Start instance"
          >
            {r._updating && r.status !== "running" ? "Starting..." : "Start"}
          </button>
          <button
            className="btn destructive"
            disabled={r._updating || r.status === "stopped"}
            onClick={() => handleGcpAction(r, "stop")}
            title="Stop instance"
          >
            {r._updating && r.status !== "stopped" ? "Stopping..." : "Stop"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Inventory</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="Search resources..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No resources discovered yet."
        />

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

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              }}
            >
              {/* AWS Card */}
              <div className="card" style={{ gridColumn: "span 12" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div className="panel-title">AWS — EC2 + RDS</div>
                  <div className="badge">mock-aws</div>
                </div>
                <DataTable
                  columns={baseColumns}
                  rows={awsRows}
                  emptyMessage="No data from mock-aws."
                />
              </div>

              {/* Azure Split: VMs and Storage */}
              <div className="card" style={{ gridColumn: "span 6" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div className="panel-title">Azure — VMs</div>
                  <div className="badge">mock-azure</div>
                </div>
                <DataTable
                  columns={baseColumns}
                  rows={azureVMRows}
                  emptyMessage="No VM data from mock-azure."
                />
              </div>
              <div className="card" style={{ gridColumn: "span 6" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div className="panel-title">Azure — Storage (with cost)</div>
                  <div className="badge">mock-azure</div>
                </div>
                <DataTable
                  columns={baseColumns}
                  rows={azureStorageRows}
                  emptyMessage="No Storage data from mock-azure."
                />
              </div>

              {/* GCP Compute with actions */}
              <div className="card" style={{ gridColumn: "span 12" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div className="panel-title">GCP — Compute Engine</div>
                  <div className="badge">mock-gcp</div>
                </div>
                <DataTable
                  columns={gcpColumns}
                  rows={gcpRows}
                  emptyMessage="No Compute Engine data from mock-gcp."
                />
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
