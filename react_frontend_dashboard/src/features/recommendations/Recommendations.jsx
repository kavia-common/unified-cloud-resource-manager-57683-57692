import React, { useEffect, useState } from "react";
import { DataTable } from "../../components/ui/Table";

/** AI/ML-powered recommendations list with apply action. */
export default function Recommendations() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows([
      { id: 1, title: "Right-size EC2 t3.large to t3.medium", impact: 120.33, priority: "high", resource: "i-123", reason: "Low CPU utilization" },
      { id: 2, title: "Schedule stop for dev VMs after hours", impact: 88.5, priority: "medium", resource: "vm-dev", reason: "Non-prod resources running 24/7" },
    ]);
  }, []);

  async function applyRecommendation(rec) {
    // mock apply
    alert(`Applied recommendation: ${rec.title}`);
  }

  const columns = [
    { key: "title", label: "Recommendation" },
    { key: "impact", label: "Impact", render: (v) => <span className="badge success">Save ${Number(v || 0).toFixed(2)}</span> },
    { key: "priority", label: "Priority" },
    { key: "resource", label: "Resource" },
    { key: "reason", label: "Reason" },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <button className="btn primary" onClick={() => applyRecommendation(r)}>Apply</button>
      ),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Recommendations</div>
        <div>
          <button className="btn" onClick={() => { /* refresh in real impl */ }}>Refresh</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={rows} emptyMessage="No recommendations available." />
      </div>
    </div>
  );
}
