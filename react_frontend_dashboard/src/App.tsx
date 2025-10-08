import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AccountsPage from './components/accounts';
import Recommendations from './features/recommendations/Recommendations';

/**
 * PUBLIC_INTERFACE
 * App entry for the Pure White minimalist shell with router-based navigation.
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <header className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold">Unified Cloud Resource Manager</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<AccountsPage />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
