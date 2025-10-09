import React, { useEffect, useRef, useCallback } from 'react';

/**
 * PUBLIC_INTERFACE
 * RecommendationDetailsDrawer
 * A reusable right-side drawer to display recommendation details.
 *
 * Props:
 * - isOpen: boolean - controls drawer visibility
 * - onClose: function - called when the drawer should close (ESC, overlay click, close button)
 * - recommendation: object | null - { id, title, cloudProvider, impactedServices[] }
 * - children: React nodes (optional) - renders below default summary for future extensibility
 *
 * Accessibility:
 * - ESC key closes drawer
 * - Focus is moved to the close button on open
 * - Focus is trapped within drawer while open
 * - aria-modal, role="dialog", aria-labelledby
 *
 * Styling:
 * - Minimalist theme with colors:
 *   primary: #374151, secondary: #9CA3AF, surface: #F9FAFB, background: #FFFFFF
 * - No external dependencies; inline styles for simplicity.
 */
export default function RecommendationDetailsDrawer({
  isOpen,
  onClose,
  recommendation,
  children,
}) {
  const overlayRef = useRef(null);
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  const titleText = (recommendation && recommendation.title) || 'Recommendation Details';
  const cloudProvider = (recommendation && recommendation.cloudProvider) || 'Unknown';
  const impactedServices = (recommendation && Array.isArray(recommendation.impactedServices) ? recommendation.impactedServices : []) || [];

  // Determine provider pill colors
  const providerColors = (() => {
    switch ((cloudProvider || '').toLowerCase()) {
      case 'aws':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' }; // amber/orange
      case 'azure':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' }; // indigo/blue
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' }; // gray
    }
  })();

  // Close on ESC
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose && onClose();
      }
      // Focus trap (TAB handling)
      if (e.key === 'Tab' && isOpen && drawerRef.current) {
        const focusable = getFocusableElements(drawerRef.current);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    },
    [isOpen, onClose]
  );

  // Setup global keydown when open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      // focus the close button on open
      setTimeout(() => {
        if (closeBtnRef.current) {
          closeBtnRef.current.focus();
        }
      }, 0);
      // prevent body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [isOpen, onKeyDown]);

  // Click on overlay to close
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose && onClose();
    }
  };

  // Util: get focusable elements
  function getFocusableElements(container) {
    const selectors = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return Array.from(container.querySelectorAll(selectors.join(','))).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-hidden="false"
      style={styles.overlay}
    >
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommendation-drawer-title"
        style={styles.drawer}
      >
        <header style={styles.header}>
          <h2 id="recommendation-drawer-title" style={styles.title}>
            {titleText}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close details panel"
            style={styles.closeButton}
            onKeyDown={(e) => {
              // stop propagation to prevent overlay Tab loop conflicts
              e.stopPropagation();
            }}
          >
            <span aria-hidden="true" style={styles.closeIcon}>
              ×
            </span>
          </button>
        </header>

        <div style={styles.content}>
          <div style={styles.metaRow}>
            <span style={styles.label}>Cloud Provider</span>
            <span
              style={{
                ...styles.pill,
                backgroundColor: providerColors.bg,
                color: providerColors.text,
                borderColor: providerColors.border,
              }}
            >
              {cloudProvider || 'Unknown'}
            </span>
          </div>

          <div style={{ ...styles.metaRow, alignItems: 'flex-start' }}>
            <span style={styles.label}>Impacted Services</span>
            <div style={styles.servicesContainer}>
              {impactedServices.length > 0 ? (
                impactedServices.map((svc, idx) => (
                  <span key={`${svc}-${idx}`} style={styles.serviceBadge}>
                    {svc}
                  </span>
                ))
              ) : (
                <span style={styles.placeholder}>No services listed</span>
              )}
            </div>
          </div>

          {children ? <div style={styles.childrenContainer}>{children}</div> : null}
        </div>
      </aside>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.4)', // semi-transparent dark overlay
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    zIndex: 50,
  },
  drawer: {
    width: 'min(460px, 100vw)',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #E5E7EB',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px 16px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#374151',
    borderRadius: 8,
    width: 36,
    height: 32,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    outline: 'none',
  },
  closeIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  content: {
    padding: 16,
    overflowY: 'auto',
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  label: {
    flexShrink: 0,
    minWidth: 130,
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 9999,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize: 12,
    fontWeight: 600,
  },
  servicesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceBadge: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 12,
  },
  placeholder: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  childrenContainer: {
    marginTop: 16,
    borderTop: '1px solid #F3F4F6',
    paddingTop: 12,
  },
};
