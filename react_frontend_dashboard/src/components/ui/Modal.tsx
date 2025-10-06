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
  if (!open) return null;

  // Accessibility: close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${widthClassName} mx-4 rounded-lg bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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
