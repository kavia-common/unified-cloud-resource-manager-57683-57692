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
  /** Filter bar that emits a consolidated filter state on any change.
   * PUBLIC_INTERFACE: onChange receives the complete merged filter object:
   * { provider, account, region, service, tag, from, to }
   * Any change to a select or date input triggers immediate propagation.
   */
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
    <label className="filter-group" style={{ minWidth: 0 }}>
      <div className="filter-label">{label}</div>
      <select
        className="filter-select"
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
        overflow: "hidden",
      }}
    >
      <div className="cost-filters">
        {renderSelect("Provider", "provider", providerOptions)}
        {renderSelect("Account", "account", accountOptions)}
        {renderSelect("Region", "region", regionOptions)}
        {renderSelect("Service", "service", serviceOptions)}
        {renderSelect("Tag", "tag", tagOptions)}
        {showDateRange && (
          <>
            <label className="filter-group" style={{ minWidth: 0 }}>
              <div className="filter-label">From</div>
              <div className="input-icon-wrap">
                <input
                  type="date"
                  className="filter-input-date"
                  value={v.from}
                  onChange={(e) => update({ from: e.target.value })}
                />
                <span className="input-icon" aria-hidden="true">📅</span>
              </div>
            </label>
            <label className="filter-group" style={{ minWidth: 0 }}>
              <div className="filter-label">To</div>
              <div className="input-icon-wrap">
                <input
                  type="date"
                  className="filter-input-date"
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
