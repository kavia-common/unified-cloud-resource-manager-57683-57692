import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./theme.css";
import "./components/ui/dark-theme-overrides.css";
import App from "./App";
import { hasSupabaseConfig } from "./services/supabaseClient";
import { ToastProvider } from "./components/ui/Toast";
import DevConfigNotice from "./components/ui/DevConfigNotice";

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

// Ensure a root element exists; if not, create one to avoid silent failure.
let rootEl = document.getElementById("root");
if (!rootEl) {
  console.warn('Root element "#root" not found. Creating one dynamically.');
  rootEl = document.createElement("div");
  rootEl.id = "root";
  document.body.appendChild(rootEl);
}

if (process.env.NODE_ENV === 'development') {
  const { origin, pathname } = window.location;
  if (pathname && pathname !== '/' && !pathname.startsWith('/static')) {
    console.warn(`[Dev] App served at ${origin}${pathname}. If you see 404s for /static/js/bundle.js, ensure the proxy targets the correct CRA port and rewrites to /.`);
  }
}

const root = ReactDOM.createRoot(rootEl);

// Basic boot fallback UI while React mounts, then replaced on first paint.
// This is defensive and ensures something visible appears immediately.
rootEl.innerHTML = '<div style="padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111">App booting…</div>';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DevConfigNotice />
      {/* ToastProvider at app root provides useToast across the app */}
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
