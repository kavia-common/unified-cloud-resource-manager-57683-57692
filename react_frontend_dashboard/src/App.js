import React from "react";
import { supabase } from "./services/supabaseClient";
import Auth from "./Auth";
import AuthGate from "./features/auth/AuthGate";
import { useAuth } from "./context/AuthContext";

function DashboardHome() {
  const { user } = useAuth();
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <h2>Dashboard</h2>
      <p>Welcome{user ? `, ${user.email}` : ""}.</p>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthGate requireAuth fallback={<Auth />}>
      <DashboardHome />
    </AuthGate>
  );
}

export default App;
