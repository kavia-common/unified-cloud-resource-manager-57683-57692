import React, { useEffect, useState } from "react";

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
        <div className="table-wrapper">
          <table role="table" aria-label="Activity stream">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="table__cell--empty" colSpan={columns.length}>No recent activity.</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        {typeof c.render === "function" ? c.render(r[c.key], r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
