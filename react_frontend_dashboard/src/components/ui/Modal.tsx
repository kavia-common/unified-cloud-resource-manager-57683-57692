import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Modal is a lightweight dialog component that renders children content in a centered overlay.
 * Props:
 * - open: boolean to control visibility
 * - title: optional header title
 * - onClose: callback when backdrop or close button is clicked
 * - widthClassName: optional width constraint utility
 */
type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
};

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  widthClassName = 'max-w-lg',
}) => {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();

  if (!open) return null;

  // Accessibility: close on Escape and trap focus within dialog
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && active === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  React.useEffect(() => {
    // focus first focusable element in dialog
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button'
      );
      first?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full ${widthClassName} mx-4 rounded-lg bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 id={titleId} className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
