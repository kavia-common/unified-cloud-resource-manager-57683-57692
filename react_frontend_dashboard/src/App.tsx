import React from 'react';
import AccountsPage from './components/accounts';

/**
 * PUBLIC_INTERFACE
 * App entry for the Pure White minimalist shell showcasing the Accounts flow.
 * Integrate with router/layout if present in broader app structure.
 */
function App() {
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

export default App;
