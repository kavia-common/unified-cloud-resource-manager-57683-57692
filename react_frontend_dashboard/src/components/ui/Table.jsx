import React from "react";

// PUBLIC_INTERFACE
export function DataTable({
  columns,
  rows,
  emptyMessage = "No data",
  variant = "default",
  headerClassName = "",
  tableClassName = "",
  rowClassName,
}) {
  /** Simple, semantic table for minimalist UI.
   * columns: [{ key, label, render?, cellClassName? }]
   * rows: array of objects
   * rowClassName: optional function(row) => string; applied to <tr>
   */
  const variantClass = variant === "transparent" ? "table--transparent" : "";
  const tableClass = ["table", variantClass, tableClassName].filter(Boolean).join(" ").trim();

  return (
    <div className="table-wrapper" role="region" aria-label="Data table" style={{ maxWidth: "100%" }}>
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={headerClassName}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!rows || rows.length === 0) && (
            <tr>
              <td colSpan={columns.length} className="table__cell--empty">
                {emptyMessage}
              </td>
            </tr>
          )}
          {(rows || []).map((r, idx) => {
            const rowCls = typeof rowClassName === "function" ? (rowClassName(r) || "") : (rowClassName || "");
            return (
              <tr key={idx} className={rowCls}>
                {columns.map((c) => {
                  const rawVal = r[c.key];
                  const cellCls = [
                    typeof c.cellClassName === "function" ? c.cellClassName(rawVal, r) : (c.cellClassName || ""),
                    c.key === "actions" ? "table__cell--actions" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <td key={c.key} className={cellCls}>
                      {c.render ? c.render(rawVal, r) : rawVal}
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
