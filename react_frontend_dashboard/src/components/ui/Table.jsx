import React from "react";

/**
 * PUBLIC_INTERFACE
 * Table
 * Minimal wrapper which applies the app's table styles.
 * Prefer the Inventory page's local table implementations for structure and actions.
 */
export default function Table({ children, ariaLabel = "data table" }) {
  return (
    <div className="table-wrapper">
      <table role="table" aria-label={ariaLabel}>
        {children}
      </table>
    </div>
  );
}
