import React from "react";
import AccountsPage from "./components/accounts/index.tsx";
import "./index.css";
import "./styles/theme.css";

// PUBLIC_INTERFACE
// Runtime App entry that renders the AccountsPage so the Add Account modal is available.
// Uses CSS variables for dark theme without changing layout.
function AppEntry() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Unified Cloud Resource Manager
        </h1>
      </header>
      <main>
        <AccountsPage />
      </main>
    </div>
  );
}

export default AppEntry;
