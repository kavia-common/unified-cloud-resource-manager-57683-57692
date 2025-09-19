import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";

/** AI/ML-powered recommendations list with apply action. */
export default function Recommendations() {
  const [rows, setRows] = useState([]);

  async function load() {
    const { data, error } = await supabase.from("recommendations").select("*").order("priority", { ascending: false });
    if (!error && Array.isArray(data)) setRows(data);
    else setRows([]);
  }

  useEffect(() => { load(); }, []);

  async function applyRecommendation(rec) {
    await supabase.from("recommendation_actions").insert({
      recommendation_id: rec.id,
      action: "apply",
      status: "queued",
    });
    load();
  }

  const columns = [
    { key: "title", label: "Recommendation" },
    { key: "impact", label: "Impact", render: (v) => <span className="badge success">Save ${v?.toFixed?.(2) ?? v}</span> },
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
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={rows} emptyMessage="No recommendations available." />
      </div>
    </div>
  );
}
