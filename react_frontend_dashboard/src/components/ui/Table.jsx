import React from "react";

// PUBLIC_INTERFACE
export function DataTable({ columns, rows, emptyMessage = "No data", variant = "default" }) {
  /** Simple responsive table. columns: [{key,label,render?}] rows: array of objects */
  const tableClass = `table table--inventory ${variant === "transparent" ? "table--transparent" : ""}`;
  return (
    <div className="table-wrapper" role="region" aria-label="Data table">
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!rows || rows.length === 0) && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--muted)" }}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {(rows || []).map((r, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r[c.key], r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
