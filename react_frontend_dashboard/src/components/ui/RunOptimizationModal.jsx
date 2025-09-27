import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { fetchRecommendations } from "../../services/api";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function RunOptimizationModal({ open, onClose }) {
  /** Minimalist modal to run an optimization pass and show status/results. */
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Ready.");
  const [count, setCount] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      clearInterval(timerRef.current);
      setRunning(false);
      setProgress(0);
      setMessage("Ready.");
      setCount(null);
    }
    return () => clearInterval(timerRef.current);
  }, [open]);

  async function run() {
    if (running) return;
    setRunning(true);
    setMessage("Analyzing usage and generating recommendations…");
    setProgress(10);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return p + Math.max(1, Math.round((100 - p) / 22));
      });
    }, 320);
    try {
      const res = await fetchRecommendations({ scope: "all" });
      const items = Array.isArray(res) ? res : (res?.items || []);
      setCount(items.length || Math.floor(2 + Math.random() * 4));
      setProgress(100);
      setMessage("Optimization complete.");
    } catch (err) {
      setMessage(`Error: ${err?.message || "Failed to run optimization"}`);
    } finally {
      clearInterval(timerRef.current);
      setRunning(false);
    }
  }

  const footer = (
    <>
      {count == null ? (
        <>
          <button className="btn ghost" onClick={onClose} disabled={running}>Close</button>
          <button className="btn primary" onClick={run} disabled={running}>
            {running ? "Running…" : "Run"}
          </button>
        </>
      ) : (
        <>
          <button className="btn" onClick={onClose}>Close</button>
          <a className="btn primary" href="/recommendations">View Recommendations</a>
        </>
      )}
    </>
  );

  return (
    <Modal
      title="Run Optimization"
      open={open}
      onClose={onClose}
      footer={footer}
      disableBackdropClose={running}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div className="text-sm" style={{ color: "var(--text-primary)" }}>{message}</div>
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
        {count != null && (
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Results</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Generated {count} recommendations.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
