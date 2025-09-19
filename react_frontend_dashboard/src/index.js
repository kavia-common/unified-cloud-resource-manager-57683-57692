import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

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
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
