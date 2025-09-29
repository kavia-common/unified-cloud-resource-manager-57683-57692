import React from "react";

/**
 * PUBLIC_INTERFACE
 * Renders a simple data table.
 */
function Table({ columns = [], data = [] }) {
  // Inline styles to ensure curved edges and pure-black header text
  const wrapperStyle = {
    borderRadius: "12px",
    overflow: "hidden",
    // keep minimalist look
    boxShadow: "var(--shadow-sm)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "var(--table-row-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--table-border)",
  };

  const thStyle = {
    background: "var(--table-header-bg)",
    color: "#111827", // enforce pure black header text
    fontWeight: 700,
    borderBottom: "1px solid var(--table-border)",
    textAlign: "left",
    padding: "10px 12px",
  };

  return (
    <div
      className="table-wrapper surface"
      role="region"
      aria-label="Data table"
      style={wrapperStyle}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.accessor || c.header} scope="col" style={thStyle}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__cell--empty">
                No data
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.accessor || c.header}>
                    {c.cell ? c.cell(row) : row[c.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// PUBLIC_INTERFACE
export { Table as DataTable };
export default Table;
