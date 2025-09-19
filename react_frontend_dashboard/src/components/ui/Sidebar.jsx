import React from "react";

// PUBLIC_INTERFACE
export default function Sidebar({ current, onNavigate }) {
  /** Pure White minimalist sidebar navigation. */
  const items = [
    { id: "overview", label: "Overview" },
    { id: "inventory", label: "Inventory" },
    { id: "costs", label: "Costs" },
    { id: "recommendations", label: "Recommendations" },
    { id: "automation", label: "Automation" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <aside className="sidebar" aria-label="Sidebar Navigation">
      <div className="brand">
        <span className="dot" aria-hidden="true" />
        <div className="title">Cross-Cloud Manager</div>
      </div>
      <div className="section-title">Navigate</div>
      <nav className="nav">
        {items.map((i) => (
          <button
            key={i.id}
            className={`nav-btn ${current === i.id ? "active" : ""}`}
            onClick={() => onNavigate(i.id)}
            aria-current={current === i.id ? "page" : undefined}
          >
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
