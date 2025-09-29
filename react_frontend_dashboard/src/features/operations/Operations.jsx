import React, { useMemo, useState } from "react";
import Tabs from "../../components/ui/Tabs";
import ComputePanel from "./compute/ComputePanel";
import StoragePanel from "./storage/StoragePanel";
import DatabasesPanel from "./databases/DatabasesPanel";
import NetworkingPanel from "./networking/NetworkingPanel";

/**
 * PUBLIC_INTERFACE
 * Resource Operations main view with tabs for Compute, Storage, Databases, and Networking.
 * Uses minimalist Pure White styling and renders panel components with mock action flows.
 */
export default function Operations() {
  const [activeTab, setActiveTab] = useState("Compute");

  // Keep tab labels simple for minimal UI
  const tabs = useMemo(() => ["Compute", "Storage", "Databases", "Networking"], []);

  return (
    <div style={styles.container} aria-label="Resource Operations">
      <header style={styles.header}>
        <h1 style={styles.title}>Resource Operations</h1>
        <p style={styles.subtitle}>
          Perform quick lifecycle actions across your cloud resources. Use tabs to switch resource types.
        </p>
      </header>

      {/* Tabs component in this codebase expects an array of labels, active label, and onChange */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <section style={styles.panel} aria-live="polite">
        {activeTab === "Compute" && <ComputePanel />}
        {activeTab === "Storage" && <StoragePanel />}
        {activeTab === "Databases" && <DatabasesPanel />}
        {activeTab === "Networking" && <NetworkingPanel />}
      </section>
    </div>
  );
}

const styles = {
  container: {
    background: "#FFFFFF",
    padding: "24px",
    minHeight: "100%",
    color: "#111827",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
  },
  panel: {
    marginTop: 12,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 16,
  },
};
