import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * Toast notification styled for dark theme.
 * This is the presentational Toast item component and remains the default export
 * to preserve compatibility with existing `import Toast from './Toast'` statements.
 */
export default function Toast({ message }) {
  return (
    <div
      className="Toast"
      role="status"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 480,
        lineHeight: 1.35,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

/**
 * Internal toast context shape.
 */
const ToastContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * useToast hook to enqueue transient toast notifications.
 *
 * Returns:
 * - show(message: string, options?: { id?: string, timeout?: number, type?: 'info'|'success'|'error' }): string
 * - dismiss(id?: string): void
 * - toasts: Array<{ id: string, message: string, type?: string }>
 *
 * Usage:
 * const { show, dismiss } = useToast();
 * show('Saved successfully', { type: 'success' });
 */
// PUBLIC_INTERFACE
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Helpful error to guide developers if provider is missing.
    throw new Error('useToast must be used within a <ToastProvider>. Add <ToastProvider> near your app root (e.g., in src/index.js).');
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * ToastProvider wraps the app and provides the useToast hook.
 *
 * Props:
 * - children: ReactNode - app subtree to wrap
 * - position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' (default: 'top-right')
 * - maxToasts?: number (default: 3)
 * - defaultTimeout?: number (ms, default: 3000)
 *
 * Behavior:
 * - Maintains a queue of transient toasts, auto-dismissed after timeout.
 * - Exposes show() and dismiss() via context.
 */
// PUBLIC_INTERFACE
export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 3,
  defaultTimeout = 3000,
}) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Ensure we clear timers on unmount to avoid leaks
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, opts = {}) => {
      const id = opts.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const type = opts.type || 'info';
      const timeout = typeof opts.timeout === 'number' ? opts.timeout : defaultTimeout;

      setToasts((prev) => {
        const next = [{ id, message, type }, ...prev];
        // Enforce max visible toasts
        return next.slice(0, Math.max(1, maxToasts));
      });

      if (timeout > 0) {
        const timer = setTimeout(() => dismiss(id), timeout);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [defaultTimeout, dismiss, maxToasts]
  );

  const value = useMemo(() => ({ show, dismiss, toasts }), [show, dismiss, toasts]);

  // Position styles for the toast stack container
  const containerStyle = useMemo(() => {
    const base = {
      position: 'fixed',
      zIndex: 1000,
      display: 'flex',
      gap: 8,
      pointerEvents: 'none', // allow clicks to fall through except on toasts themselves
    };
    const map = {
      'top-right': { top: 16, right: 16, flexDirection: 'column' },
      'top-left': { top: 16, left: 16, flexDirection: 'column' },
      'bottom-right': { bottom: 16, right: 16, flexDirection: 'column-reverse' },
      'bottom-left': { bottom: 16, left: 16, flexDirection: 'column-reverse' },
    };
    return { ...base, ...(map[position] || map['top-right']) };
  }, [position]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack renderer */}
      <div style={containerStyle} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={() => dismiss(t.id)}
            role="button"
            aria-label={`Dismiss ${t.type || 'info'} notification`}
            title="Click to dismiss"
          >
            <Toast message={t.message} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
