import React from "react";
import EmptyState from "../../components/ui/EmptyState";

/**
 * PUBLIC_INTERFACE
 * Inventory
 * Minimalist non-table inventory landing page. All prior data tables and compute instance listings
 * are removed per requirement. This view shows an empty state with guidance only.
 */
export default function Inventory() {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Inventory</div>
      </div>
      <div className="panel-body">
        <EmptyState
          title="No inventory table"
          description="Inventory tables have been removed. Resource listings will not appear here."
        />
      </div>
    </div>
  );
}
