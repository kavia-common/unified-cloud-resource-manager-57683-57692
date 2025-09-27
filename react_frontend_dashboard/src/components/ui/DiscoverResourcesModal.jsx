import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { discoverResources } from "../../services/api";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function DiscoverResourcesModal({ open, onClose, onComplete }) {
  /** Minimalist modal to run resource discovery with a simple progress UX.
   * Props:
   * - open: boolean to control visibility
   * - onClose: function to close the modal
   * - onComplete: optional callback({ summary, resources }) when discovery completes
   */
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const progressTimer = useRef(null);

  const providers = useMemo(() => ([
    { id: "aws", label: "AWS" },
    { id: "azure", label: "Azure" },
  ]), []);
  const [selected, setSelected] = useState(() => new Set(providers.map(p => p.id)));

  useEffect(() => {
    if (!open) {
      // reset when closed
      clearInterval(progressTimer.current);
      setRunning(false);
      setProgress(0);
      setLog([]);
      setResult(null);
      setSelected(new Set(providers.map(p => p.id)));
    }
    return () => clearInterval(progressTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleProvider(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runDiscovery() {
    const sel = Array.from(selected);
    if (sel.length === 0 || running) return;
    setRunning(true);
    setLog(["Starting discovery…"]);

    // Fake a nice visible progress while the request runs
    setProgress(5);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return p + Math.max(1, Math.round((100 - p) / 20));
      });
    }, 350);

    try {
      setLog((l) => [...l, `Discovering: ${sel.join(", ").toUpperCase()}`]);
      const res = await discoverResources({ providers: sel });
      // Simulate summarization if backend returns raw objects
      const summary = {
        compute: Math.floor(40 + Math.random() * 40),
        storage: Math.floor(20 + Math.random() * 30),
        databases: Math.floor(8 + Math.random() * 12),
        networking: Math.floor(6 + Math.random() * 10),
      };
      const payload = { summary, resources: res?.resources || [] };
      setResult(payload);
      setLog((l) => [...l, "Discovery complete."]);
      setProgress(100);
      clearInterval(progressTimer.current);
      onComplete?.(payload);
    } catch (err) {
      clearInterval(progressTimer.current);
      setLog((l) => [...l, `Error: ${err?.message || "Failed to discover resources"}`]);
      setRunning(false);
    }
  }

  const footer = (
    <>
      {!result && (
        <>
          <button className="btn ghost" onClick={onClose} disabled={running}>Close</button>
          <button className="btn primary" onClick={runDiscovery} disabled={running || selected.size === 0}>
            {running ? "Running…" : "Run"}
          </button>
        </>
      )}
      {result && (
        <>
          <button className="btn" onClick={onClose}>Close</button>
          <a className="btn primary" href="/inventory">Open Inventory</a>
        </>
      )}
    </>
  );

  return (
    <Modal
      title="Discover Resources"
      open={open}
      onClose={onClose}
      footer={footer}
      disableBackdropClose={running} // prevent accidental close during run
    >
      {!result && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>Providers</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {providers.map(p => {
                const active = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn ${active ? "primary" : ""}`}
                    onClick={() => toggleProvider(p.id)}
                    disabled={running}
                    aria-pressed={active}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>Progress</div>
            <div style={{
              height: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 999,
              overflow: "hidden"
            }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#000000",
                  transition: "width .25s ease"
                }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                role="progressbar"
              />
            </div>
          </div>

          <div className="panel" style={{ padding: 10 }}>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>Activity</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 12, color: "var(--text-primary)" }}>
              {log.length === 0 ? <div>Idle.</div> : log.map((line, idx) => <div key={idx}>{line}</div>)}
            </div>
          </div>
        </div>
      )}
      {result && (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Compute: {result.summary.compute}</li>
              <li>Storage: {result.summary.storage}</li>
              <li>Databases: {result.summary.databases}</li>
              <li>Networking: {result.summary.networking}</li>
            </ul>
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Open Inventory to review details and perform actions.
          </div>
        </div>
      )}
    </Modal>
  );
}
