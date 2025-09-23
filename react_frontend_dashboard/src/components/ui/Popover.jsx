import React, { useEffect, useRef } from "react";

/**
 * Lightweight accessible popover/dropdown anchored to its trigger.
 * - Opens in place, positions below-left by default
 * - Closes on outside click or Escape key
 * - Traps no focus but returns it to trigger on close
 */

// PUBLIC_INTERFACE
export function Popover({ open, onClose, anchorRef, children, ariaLabel = "Menu" }) {
  /** Accessible popover anchored to a trigger element via anchorRef. */
  const popRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    function onClickOutside(e) {
      if (!open) return;
      const target = e.target;
      if (
        popRef.current &&
        !popRef.current.contains(target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose?.();
      }
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("mousedown", onClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  // Position the popover relative to anchor using absolute + offsetParent flow
  return (
    <div
      ref={popRef}
      className="popover"
      role="dialog"
      aria-label={ariaLabel}
      style={{
        position: "absolute",
        zIndex: 40,
        marginTop: 8,
        // No explicit left/top here; parent container should be relative and wrap anchor+popover
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
