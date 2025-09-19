import React from "react";

// PUBLIC_INTERFACE
export default function EmptyState({ title, description, ctaLabel, onCta }) {
  /** Minimal empty state panel. */
  return (
    <div className="panel" style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "var(--muted)", marginBottom: 14 }}>{description}</div>
      {ctaLabel && (
        <button className="btn primary" onClick={onCta}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
