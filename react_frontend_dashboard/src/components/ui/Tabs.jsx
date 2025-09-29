import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Simple tabs control styled for dark theme.
 * Supports tabs as strings or objects { id, label }.
 */
function Tabs({ tabs = [], active, onChange }) {
  // Normalize each tab item into a consistent shape for rendering and comparison.
  const toItem = (t) => {
    if (t && typeof t === 'object') {
      const id = t.id ?? t.value ?? t.label ?? String(Math.random());
      const label = t.label ?? t.value ?? t.id ?? String(t);
      return { id, label, raw: t };
    }
    return { id: String(t), label: String(t), raw: t };
  };

  return (
    <div className="Tabs" role="tablist" aria-label="Tabs">
      <div className="tab-list" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map((t) => {
          const item = toItem(t);
          // Active can be the raw object id/value or the label/string. Compare safely.
          const isActive =
            active === item.id ||
            active === item.label ||
            active === item.raw;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              className={`tab ${isActive ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
              style={{
                background: 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '10px 12px',
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export { Tabs }; // named export for compatibility
export default Tabs;
