import React from "react";

/**
 * PUBLIC_INTERFACE
 * Renders a simple data table.
 */
function Table({ columns = [], data = [] }) {
  return (
    <div className="table-wrapper surface" role="region" aria-label="Data table">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.accessor || c.header} scope="col">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__cell--empty">No data</td>
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
