import React, { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";

/** Rule-based automation: create rules for start/stop or scale on schedule. */
export default function Automation() {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5", status: "enabled" });

  useEffect(() => {
    setRules([
      { id: 1, name: "Stop dev VMs at 10pm", match: "env=dev type=vm", action: "stop", cron: "0 22 * * 1-5", status: "enabled" },
    ]);
  }, []);

  function saveRule(e) {
    e?.preventDefault?.();
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...editingRule, ...form } : r));
    } else {
      setRules(prev => [{ id: Date.now(), ...form }, ...prev]);
    }
    setOpen(false);
    setEditingRule(null);
    setForm({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5", status: "enabled" });
  }

  function deleteRule(rule) {
    if (window.confirm(`Delete rule "${rule.name}"?`)) {
      setRules(prev => prev.filter(r => r.id !== rule.id));
    }
  }

  function toggleRule(rule) {
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: r.status === "enabled" ? "disabled" : "enabled" } : r));
  }

  const columns = [
    { key: "name", label: "Rule" },
    { key: "match", label: "Match" },
    { key: "action", label: "Action" },
    { key: "cron", label: "Schedule (cron)" },
    { key: "status", label: "Status", render: (v) => <span className={`badge ${v === "enabled" ? "success" : ""}`}>{v}</span> },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => toggleRule(r)}>
            {r.status === "enabled" ? "Disable" : "Enable"}
          </button>
          <button className="btn" onClick={() => { setEditingRule(r); setForm(r); setOpen(true); }}>
            Edit
          </button>
          <button className="btn destructive" onClick={() => deleteRule(r)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Automation Rules</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn primary" onClick={() => setOpen(true)}>New Rule</button>
        </div>
      </div>
      <div className="panel-body">
        <div className="table-wrapper">
          <table role="table" aria-label="Automation rules">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td className="table__cell--empty" colSpan={columns.length}>No rules created yet.</td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        {typeof c.render === "function" ? c.render(r[c.key], r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingRule(null);
          setForm({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5", status: "enabled" });
        }}
        footer={
          <>
            <button className="btn ghost" onClick={() => {
              setOpen(false);
              setEditingRule(null);
              setForm({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5", status: "enabled" });
            }}>Cancel</button>
            <button className="btn primary" onClick={saveRule}>
              {editingRule ? "Save" : "Create"}
            </button>
          </>
        }
      >
        <form onSubmit={saveRule} style={{ display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Name</div>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Stop dev servers at 10pm" />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Match (tag query)</div>
            <input className="input" value={form.match} onChange={(e) => setForm((f) => ({ ...f, match: e.target.value }))} placeholder='env=dev AND type=vm' />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Action</div>
            <select className="select" value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}>
              <option value="start">Start</option>
              <option value="stop">Stop</option>
              <option value="scale">Scale</option>
            </select>
          </label>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Cron</div>
            <input className="input" value={form.cron} onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))} placeholder="0 22 * * 1-5" />
          </label>
        </form>
      </Modal>
    </div>
  );
}
