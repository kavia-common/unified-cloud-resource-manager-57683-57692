import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Simple tabs control styled for dark theme.
 */
function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="Tabs" role="tablist" aria-label="Tabs">
      <div className="tab-list" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map((t) => {
          const isActive = active === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={isActive}
              className={`tab ${isActive ? 'active' : ''}`}
              onClick={() => onChange(t)}
              style={{
                background: 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '10px 12px',
                cursor: 'pointer'
              }}
            >
              {t}
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
