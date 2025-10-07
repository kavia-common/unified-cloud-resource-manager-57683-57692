import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useToast } from "./Toast";

/**
 * PUBLIC_INTERFACE
 * AddAccountMinimalModal
 * 
 * A minimalist, accessible modal for adding a cloud account with the following fields:
 * - Account Type (select): AWS, Azure, GCP (required)
 * - Client Name (text, required)
 * - Account ID (text, required, alphanumeric + dashes/underscores)
 * - Secret Key (password, required) with show/hide toggle
 * 
 * Features:
 * - Validation with inline error messages
 * - Submit disabled until valid
 * - Async placeholder submission handler (ready to connect to Supabase)
 * - Success/error toast messages
 * - Close on success and reset form
 * - Accessibility: focus trap, ESC closes, backdrop click closes
 * - Styling: follows Pure White minimalist theme using theme.css tokens
 * 
 * Props:
 * - open: boolean - controls visibility
 * - onClose: () => void - called when modal should close
 * - onSaved?: (account: { provider, name, account_id, created_at }) => void - called on successful save for local state update
 */
export default function AddAccountMinimalModal({ open, onClose, onSaved }) {
  const { show: showToast } = useToast();
  const dialogRef = useRef(null);
  const [showSecret, setShowSecret] = useState(false);

  // Form state
  const [form, setForm] = useState({
    accountType: "AWS",
    clientName: "",
    accountId: "",
    secretKey: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const accountIdPattern = /^[A-Za-z0-9_-]+$/;
  const errors = useMemo(() => {
    const e = {};
    if (!form.accountType) e.accountType = "Account Type is required.";
    if (!form.clientName.trim()) e.clientName = "Client Name is required.";
    if (!form.accountId.trim()) e.accountId = "Account ID is required.";
    else if (!accountIdPattern.test(form.accountId.trim())) {
      e.accountId = "Account ID must be alphanumeric and may include dashes/underscores.";
    }
    if (!form.secretKey.trim()) e.secretKey = "Secret Key is required.";
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setForm({
        accountType: "AWS",
        clientName: "",
        accountId: "",
        secretKey: "",
      });
      setTouched({});
      setShowSecret(false);
      setSubmitting(false);
    }
  }, [open]);

  // Accessibility: ESC close, focus trap with Tab
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autofocus first input on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector("input, select, textarea, button");
      first?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const markTouched = useCallback((key) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const tryFocusFirstInvalid = () => {
    const order = ["accountType", "clientName", "accountId", "secretKey"];
    const firstInvalid = order.find((k) => errors[k]);
    if (!firstInvalid) return;
    const el = dialogRef.current?.querySelector(`#${firstInvalid}`);
    if (el) el.focus();
  };

  function handleCancel() {
    onClose?.();
  }

  // PUBLIC_INTERFACE
  async function saveAccount({ accountType, clientName, accountId, secretKey }) {
    /**
     * Placeholder async submission prepared for Supabase integration.
     * TODO: Wire to Supabase via Edge Function or direct insert with proper RLS policies.
     * 
     * Example (Edge Function):
     * 
     *   import { supabase } from "../../services/supabaseClient";
     *   try {
     *     const baseUrl = process.env.REACT_APP_SUPABASE_URL;
     *     const res = await fetch(`${baseUrl}/functions/v1/save-account`, {
     *       method: "POST",
     *       headers: { "Content-Type": "application/json" },
     *       body: JSON.stringify({ accountType, clientName, accountId, secretKey }),
     *     });
     *     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     *     return await res.json();
     *   } catch (e) {
     *     throw e;
     *   }
     * 
     * Example (PostgREST insert if table exists):
     * 
     *   // NOTE: Only enable if 'cloud_accounts' table exists and RLS allows inserts.
     *   const { data, error } = await supabase
     *     .from("cloud_accounts")
     *     .insert({
     *       provider: accountType,
     *       name: clientName,
     *       account_id: accountId,
     *       metadata: { via: "ui-minimal" },
     *     })
     *     .select("*")
     *     .single();
     *   if (error) throw error;
     *   return data;
     */
    // Simulate network latency for user feedback
    await new Promise((r) => setTimeout(r, 500));
    // For now, just resolve; caller will handle local state update
    return { ok: true };
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    // Touch all fields to trigger validation messages
    const keys = ["accountType", "clientName", "accountId", "secretKey"];
    const newTouched = {};
    keys.forEach((k) => (newTouched[k] = true));
    setTouched((t) => ({ ...t, ...newTouched }));

    if (Object.keys(errors).length > 0) {
      tryFocusFirstInvalid();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        accountType: form.accountType,
        clientName: form.clientName.trim(),
        accountId: form.accountId.trim(),
        secretKey: form.secretKey.trim(),
      };
      await saveAccount(payload);

      // Inform via toast, call onSaved for local state update, then close
      showToast("Account added successfully.", { type: "success" });
      onSaved?.({
        provider: payload.accountType,
        name: payload.clientName,
        account_id: payload.accountId,
        created_at: new Date().toISOString(),
      });
      onClose?.();
    } catch (err) {
      const msg = err?.message || "Failed to add account.";
      showToast(msg, { type: "error", timeout: 5000 });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const errorFor = (id) => (touched[id] && errors[id] ? errors[id] : "");

  // Fallback theme tokens in case global styles are not present
  const css = getComputedStyle(document.documentElement);
  const TOKENS = {
    overlay: css.getPropertyValue('--overlay')?.trim() || "rgba(17, 24, 39, 0.35)",
    surface: css.getPropertyValue('--surface')?.trim() || "#111827",
    text: css.getPropertyValue('--text')?.trim() || "#e5e7eb",
    textMuted: css.getPropertyValue('--text-muted')?.trim() || "#a1a9b8",
    border: css.getPropertyValue('--border')?.trim() || "#1f2937",
    shadow: css.getPropertyValue('--shadow-lg')?.trim() || "0 16px 40px rgba(0,0,0,0.5)",
    btnBg: css.getPropertyValue('--btn-bg')?.trim() || "#1f2937",
    btnBgHover: css.getPropertyValue('--btn-bg-hover')?.trim() || "#2a3546",
    btnText: css.getPropertyValue('--btn-text')?.trim() || "#e5e7eb",
    btnPrimaryBg: css.getPropertyValue('--primary')?.trim() || "#60a5fa",
    btnPrimaryText: "#0b0f1a",
    error: css.getPropertyValue('--error')?.trim() || "#f87171",
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: TOKENS.overlay,
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        className="modal modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: TOKENS.surface,
          color: TOKENS.text,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 14,
          boxShadow: TOKENS.shadow,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid ${TOKENS.border}`,
            padding: "12px 16px",
            background: TOKENS.surface,
          }}
        >
          <div id="add-account-title" style={{ fontWeight: 700, fontSize: 16 }}>
            Add Account
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            title="Close"
            className="btn ghost"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: `1px solid ${TOKENS.border}`,
              color: TOKENS.text,
              padding: "6px 10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = TOKENS.btnBgHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 16, display: "grid", gap: 12 }}>
          {/* Account Type */}
          <div>
            <label htmlFor="accountType" style={{ display: "block", fontSize: 12, color: TOKENS.textMuted, marginBottom: 6 }}>
              Account Type
            </label>
            <select
              id="accountType"
              className="input"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${TOKENS.border}`, borderRadius: 8, background: TOKENS.surface, color: TOKENS.text, outline: "none" }}
              value={form.accountType}
              onChange={(e) => update("accountType", e.target.value)}
              onBlur={() => markTouched("accountType")}
              aria-invalid={!!errorFor("accountType")}
              aria-describedby={errorFor("accountType") ? "accountType-error" : undefined}
            >
              <option value="AWS">AWS</option>
              <option value="Azure">Azure</option>
              <option value="GCP">GCP</option>
            </select>
            {!!errorFor("accountType") && (
              <div id="accountType-error" role="alert" style={{ color: TOKENS.error, fontSize: 12, marginTop: 6 }}>
                {errorFor("accountType")}
              </div>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label htmlFor="clientName" style={{ display: "block", fontSize: 12, color: TOKENS.textMuted, marginBottom: 6 }}>
              Client Name
            </label>
            <input
              id="clientName"
              className="input"
              type="text"
              placeholder="e.g., Finance Prod"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              onBlur={() => markTouched("clientName")}
              aria-invalid={!!errorFor("clientName")}
              aria-describedby={errorFor("clientName") ? "clientName-error" : "clientName-help"}
              autoComplete="off"
            />
            {!errorFor("clientName") && (
              <div id="clientName-help" className="text-xs" style={{ color: TOKENS.textMuted, marginTop: 6 }}>
                Friendly label for the account.
              </div>
            )}
            {!!errorFor("clientName") && (
              <div id="clientName-error" role="alert" style={{ color: TOKENS.error, fontSize: 12, marginTop: 6 }}>
                {errorFor("clientName")}
              </div>
            )}
          </div>

          {/* Account ID */}
          <div>
            <label htmlFor="accountId" style={{ display: "block", fontSize: 12, color: TOKENS.textMuted, marginBottom: 6 }}>
              Account ID
            </label>
            <input
              id="accountId"
              className="input"
              type="text"
              placeholder="Alphanumeric, dashes/underscores allowed"
              value={form.accountId}
              onChange={(e) => update("accountId", e.target.value)}
              onBlur={() => markTouched("accountId")}
              aria-invalid={!!errorFor("accountId")}
              aria-describedby={errorFor("accountId") ? "accountId-error" : "accountId-help"}
              autoComplete="off"
              pattern="[A-Za-z0-9_-]+"
            />
            {!errorFor("accountId") && (
              <div id="accountId-help" className="text-xs" style={{ color: TOKENS.textMuted, marginTop: 6 }}>
                Use a stable identifier (e.g., AWS account id, Azure subscription id, or GCP project id).
              </div>
            )}
            {!!errorFor("accountId") && (
              <div id="accountId-error" role="alert" style={{ color: TOKENS.error, fontSize: 12, marginTop: 6 }}>
                {errorFor("accountId")}
              </div>
            )}
          </div>

          {/* Secret Key with show/hide toggle */}
          <div>
            <label htmlFor="secretKey" style={{ display: "block", fontSize: 12, color: TOKENS.textMuted, marginBottom: 6 }}>
              Secret Key
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="secretKey"
                className="input"
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${TOKENS.border}`, borderRadius: 8, background: TOKENS.surface, color: TOKENS.text, outline: "none" }}
                type={showSecret ? "text" : "password"}
                placeholder="••••••••••••••••••••"
                value={form.secretKey}
                onChange={(e) => update("secretKey", e.target.value)}
                onBlur={() => markTouched("secretKey")}
                aria-invalid={!!errorFor("secretKey")}
                aria-describedby={errorFor("secretKey") ? "secretKey-error" : "secretKey-help"}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowSecret((s) => !s)}
                aria-label={showSecret ? "Hide secret" : "Show secret"}
                aria-pressed={showSecret}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px 8px",
                  background: TOKENS.btnBg,
                  border: `1px solid ${TOKENS.border}`,
                  color: TOKENS.btnText,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = TOKENS.btnBgHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = TOKENS.btnBg)}
              >
                {showSecret ? "Hide" : "Show"}
              </button>
            </div>
            {!errorFor("secretKey") && (
              <div id="secretKey-help" className="text-xs" style={{ color: TOKENS.textMuted, marginTop: 6 }}>
                Stored securely — never shared. You can rotate keys later.
              </div>
            )}
            {!!errorFor("secretKey") && (
              <div id="secretKey-error" role="alert" style={{ color: TOKENS.error, fontSize: 12, marginTop: 6 }}>
                {errorFor("secretKey")}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              className="btn secondary"
              onClick={handleCancel}
              aria-label="Cancel"
              style={{
                background: TOKENS.btnBg,
                color: TOKENS.btnText,
                border: `1px solid ${TOKENS.border}`,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = TOKENS.btnBgHover)}
              onMouseOut={(e) => (e.currentTarget.style.background = TOKENS.btnBg)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={hasErrors || submitting}
              aria-disabled={hasErrors || submitting}
              aria-label="Add account"
              title={hasErrors ? "Please fix validation errors" : "Add Account"}
              style={{
                background: hasErrors || submitting ? "#9CA3AF" : TOKENS.btnPrimaryBg,
                color: TOKENS.btnPrimaryText,
                border: `1px solid ${TOKENS.btnPrimaryBg}`,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: hasErrors || submitting ? "not-allowed" : "pointer",
                opacity: hasErrors || submitting ? 0.8 : 1,
              }}
            >
              {submitting ? "Adding…" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
