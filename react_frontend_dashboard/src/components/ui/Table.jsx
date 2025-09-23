import React from "react";

// PUBLIC_INTERFACE
export function DataTable({ columns, rows, emptyMessage = "No data", variant = "default", headerClassName = "", tableClassName = "", rowClassName }) {
  /** Simple responsive table. columns: [{key,label,render?, cellClassName?}] rows: array of objects
   * rowClassName: optional function (row) => string; applied to each td (value cells) in that row.
   */
  const variantClass = variant === "transparent" ? "table--transparent" : "";
  // Keep 'table' base class first so theme.css rules apply predictably; inventory modifier follows.
  const tableClass = `table table--inventory ${variantClass} ${tableClassName}`.trim();
  return (
    <div className="table-wrapper" role="region" aria-label="Data table">
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={headerClassName}>{c.label}</th>
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
          {(rows || []).map((r, idx) => {
            const rowCls = typeof rowClassName === "function" ? (rowClassName(r) || "") : (rowClassName || "");
            return (
              <tr key={idx}>
                {columns.map((c) => {
                  const cellCls = [
                    typeof c.cellClassName === "function" ? c.cellClassName(r[c.key], r) : (c.cellClassName || ""),
                    rowCls, // apply row-level class to each value cell
                  ].filter(Boolean).join(" ");
                  return (
                    <td key={c.key} className={cellCls}>
                      {c.render ? c.render(r[c.key], r) : r[c.key]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
