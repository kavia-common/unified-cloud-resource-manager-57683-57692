import React from "react";

/**
 * PUBLIC_INTERFACE
 * ThemeToggleStub
 * Minimal stub that toggles between 'dark' and 'light' themes using CSS variable sets.
 * Default is 'dark'. Intentionally not used in layout by default to avoid structural changes.
 */
export default function ThemeToggleStub() {
  const [mode, setMode] = React.useState(() =>
    document.documentElement.classList.contains("theme-light") ? "light" : "dark"
  );

  const toggle = () => {
    if (typeof window !== "undefined" && typeof window.__toggleTheme === "function") {
      window.__toggleTheme();
      const nowLight = document.documentElement.classList.contains("theme-light");
      setMode(nowLight ? "light" : "dark");
    }
  };

  return (
    <button
      type="button"
      className="btn"
      onClick={toggle}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      style={{ fontSize: 12, padding: "6px 10px" }}
    >
      Theme: {mode}
    </button>
  );
}
