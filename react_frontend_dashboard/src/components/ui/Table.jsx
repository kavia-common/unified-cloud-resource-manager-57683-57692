import React from "react";

/**
 * PUBLIC_INTERFACE
 * DataTable shim — the inventory tables were removed from the app.
 * Any attempt to render this component will throw to signal developers to refactor.
 */
export function DataTable() {
  throw new Error("DataTable has been removed from the UI. Please refactor to a non-table view.");
}

export default function Table() {
  return null;
}
