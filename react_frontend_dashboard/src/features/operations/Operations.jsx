import React, { useState } from "react";
import { Tabs } from "../../components/ui/Tabs";
import ComputePanel from "./compute/ComputePanel";
import StoragePanel from "./storage/StoragePanel";
import DatabasesPanel from "./databases/DatabasesPanel";
import NetworkingPanel from "./networking/NetworkingPanel";

/**
 * PUBLIC_INTERFACE
 */
export default function Operations() {
  /**
   * Operations hub with tabs for Compute, Storage, Databases, Networking.
   * Each panel implements resource management actions with stubbed API calls.
   */
  const [active, setActive] = useState("compute");

  const tabs = [
    { id: "compute", label: "Compute" },
    { id: "storage", label: "Storage" },
    { id: "databases", label: "Databases" },
    { id: "networking", label: "Networking" },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Resource Operations</div>
      </div>
      <div className="panel-body">
        <Tabs tabs={tabs} active={active} onChange={setActive} />
        <div style={{ marginTop: 12 }}>
          {active === "compute" && <ComputePanel />}
          {active === "storage" && <StoragePanel />}
          {active === "databases" && <DatabasesPanel />}
          {active === "networking" && <NetworkingPanel />}
        </div>
      </div>
    </div>
  );
}
