import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";

/** Activity stream of operations, recommendations, and automation rule runs. */
export default function Activity() {
  const [rows, setRows] = useState([]);

  async function load() {
    const { data, error } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (!error && Array.isArray(data)) setRows(data);
    else setRows([]);
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
