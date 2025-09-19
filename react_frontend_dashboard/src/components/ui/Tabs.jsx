import React from "react";

// PUBLIC_INTERFACE
export function Tabs({ tabs, active, onChange }) {
  /** Tabs bar with active indicator. tabs: [{id,label}] */
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange?.(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
