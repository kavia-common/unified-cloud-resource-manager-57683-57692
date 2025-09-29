import React from "react";

/**
 * Uniform filter bar for data panels with minimalist styling.
 * Props accept option arrays and controlled values; onChange returns a merged state.
 */

// PUBLIC_INTERFACE
export default function FilterBar({
  providerOptions = [],
  accountOptions = [],
  regionOptions = [],
  serviceOptions = [],
  tagOptions = [],
  values = {},
  onChange,
  showDateRange = true,
}) {
  /** Filter bar that emits a consolidated filter state on any change. */
  const v = {
    provider: values.provider || "",
    account: values.account || "",
    region: values.region || "",
    service: values.service || "",
    tag: values.tag || "",
    from: values.from || "",
    to: values.to || "",
  };

  function update(patch) {
    onChange?.({ ...v, ...patch });
  }

  const renderSelect = (label, name, options) => (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <select
        className="select"
        value={v[name]}
        onChange={(e) => update({ [name]: e.target.value })}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o.value ?? o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div
      className="panel"
      style={{
        padding: 12,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div style={{ gridColumn: "span 2" }}>
          {renderSelect("Provider", "provider", providerOptions)}
        </div>
        <div style={{ gridColumn: "span 2" }}>
          {renderSelect("Account", "account", accountOptions)}
        </div>
        <div style={{ gridColumn: "span 2" }}>
          {renderSelect("Region", "region", regionOptions)}
        </div>
        <div style={{ gridColumn: "span 2" }}>
          {renderSelect("Service", "service", serviceOptions)}
        </div>
        <div style={{ gridColumn: "span 2" }}>
          {renderSelect("Tag", "tag", tagOptions)}
        </div>
        {showDateRange && (
          <>
            <label style={{ gridColumn: "span 1", display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>From</div>
              <div className="input-icon-wrap">
                <input
                  type="date"
                  className="input input--date"
                  value={v.from}
                  onChange={(e) => update({ from: e.target.value })}
                />
                <span className="input-icon" aria-hidden="true">📅</span>
              </div>
            </label>
            <label style={{ gridColumn: "span 1", display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>To</div>
              <div className="input-icon-wrap">
                <input
                  type="date"
                  className="input input--date"
                  value={v.to}
                  onChange={(e) => update({ to: e.target.value })}
                />
                <span className="input-icon" aria-hidden="true">📅</span>
              </div>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
