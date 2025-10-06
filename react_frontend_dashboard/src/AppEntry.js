import React from "react";
import AccountsPage from "./components/accounts/index.tsx";

// PUBLIC_INTERFACE
// This is the runtime App entry that renders the AccountsPage so the Add Account modal is available.
function AppEntry() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold">Unified Cloud Resource Manager</h1>
      </header>
      <main>
        <AccountsPage />
      </main>
    </div>
  );
}

export default AppEntry;
