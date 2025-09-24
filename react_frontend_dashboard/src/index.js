import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { hasSupabaseConfig } from "./services/supabaseClient";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MissingConfigNotice() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <h2>Supabase is not configured</h2>
      <p>
        Please create a <code>.env</code> file in <code>react_frontend_dashboard</code> with:
      </p>
      <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6 }}>
{`REACT_APP_SUPABASE_URL=https://<project>.supabase.co
REACT_APP_SUPABASE_KEY=<anon-public-key>`}
      </pre>
      <p>Then restart the development server.</p>
    </div>
  );
}

// Ensure a root element exists; if not, create one to avoid silent failure.
let rootEl = document.getElementById("root");
if (!rootEl) {
  console.warn('Root element "#root" not found. Creating one dynamically.');
  rootEl = document.createElement("div");
  rootEl.id = "root";
  document.body.appendChild(rootEl);
}

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {hasSupabaseConfig ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <MissingConfigNotice />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
