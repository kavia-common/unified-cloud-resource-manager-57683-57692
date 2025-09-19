import React from "react";
import {
  FiHome,          // Overview
  FiLayers,        // Inventory
  FiDollarSign,    // Costs
  FiZap,           // Recommendations
  FiAperture,      // Automation
  FiActivity,      // Activity
  FiSettings,      // Settings/Connect
} from "react-icons/fi";

/**
 * PUBLIC_INTERFACE
 */
export default function Sidebar({ current, onNavigate }) {
  /** Pure White minimalist sidebar navigation with icons for clarity. */
  const items = [
    { id: "overview", label: "Overview", Icon: FiHome },
    { id: "inventory", label: "Inventory", Icon: FiLayers },
    { id: "costs", label: "Costs", Icon: FiDollarSign },
    { id: "recommendations", label: "Recommendations", Icon: FiZap },
    { id: "automation", label: "Automation", Icon: FiAperture },
    { id: "activity", label: "Activity", Icon: FiActivity },
    { id: "settings", label: "Settings", Icon: FiSettings },
  ];

  return (
    <aside className="sidebar" aria-label="Sidebar Navigation">
      <div className="brand">
        <span className="dot" aria-hidden="true" />
        <div className="title">Cross-Cloud Manager</div>
      </div>
      <div className="section-title">Navigate</div>
      <nav className="nav">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-btn ${current === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
            aria-current={current === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={18} style={{ color: "var(--primary)" }} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
