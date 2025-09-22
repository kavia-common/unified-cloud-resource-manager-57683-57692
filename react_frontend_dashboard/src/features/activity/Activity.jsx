import React, { useEffect, useState } from "react";
import { DataTable } from "../../components/ui/Table";

/** Activity stream of operations, recommendations, and automation rule runs. */
export default function Activity() {
  const [rows, setRows] = useState([]);

  function load() {
    setRows([
      { created_at: new Date().toISOString(), actor: "you", type: "operation", summary: "Start instance i-123", status: "success" },
      { created_at: new Date(Date.now() - 3600e3).toISOString(), actor: "system", type: "automation", summary: "Stopped 2 dev VMs", status: "success" },
    ]);
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "created_at", label: "Time" },
    { key: "actor", label: "Actor" },
    { key: "type", label: "Type" },
    { key: "summary", label: "Summary" },
    { key: "status", label: "Status", render: (v) => <span className={`badge ${v === "success" ? "success" : v === "error" ? "error" : ""}`}>{v}</span> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Activity</div>
        <div>
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={rows} emptyMessage="No recent activity." />
      </div>
    </div>
  );
}
