import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";

/** Rule-based automation: create rules for start/stop or scale on schedule. */
export default function Automation() {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5" });

  async function load() {
    const { data, error } = await supabase.from("automation_rules").select("*").order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) setRules(data);
    else setRules([]);
  }
  useEffect(() => { load(); }, []);

  async function addRule(e) {
    e?.preventDefault?.();
    await supabase.from("automation_rules").insert({
      name: form.name,
      match: form.match,
      action: form.action,
      cron: form.cron,
      status: "enabled",
    });
    setOpen(false);
    setForm({ name: "", match: "", action: "stop", cron: "0 22 * * 1-5" });
    load();
  }

  async function toggleRule(rule) {
    await supabase.from("automation_rules").update({ status: rule.status === "enabled" ? "disabled" : "enabled" }).eq("id", rule.id);
    load();
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
        <button className="btn" onClick={() => toggleRule(r)}>{r.status === "enabled" ? "Disable" : "Enable"}</button>
      ),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Automation Rules</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={load}>Refresh</button>
          <button className="btn primary" onClick={() => setOpen(true)}>New Rule</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={rules} emptyMessage="No rules created yet." />
      </div>

      <Modal
        title="Create Automation Rule"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn primary" onClick={addRule}>Create</button>
          </>
        }
      >
        <form onSubmit={addRule} style={{ display: "grid", gap: 10 }}>
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
