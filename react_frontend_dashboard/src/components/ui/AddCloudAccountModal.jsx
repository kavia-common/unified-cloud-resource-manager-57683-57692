import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import { Modal } from "./Modal";
import { Tabs } from "./Tabs";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function AddCloudAccountModal({
  open,
  onClose,
  existingAccounts = [],
  onSubmit,
}) {
  /**
   * Accessible, minimalist modal for adding a cloud account with provider selection (AWS/Azure),
   * dynamic credential fields, and simple client-side validation.
   *
   * Props:
   * - open: boolean to control visibility
   * - onClose: function to close the modal
   * - existingAccounts: array of existing accounts { provider, name, account_id, created_at }
   * - onSubmit: function(payload) -> void; called with safe payload on valid submit; does not persist
   */
  const [activeTab, setActiveTab] = useState("add");
  const [provider, setProvider] = useState("AWS");
  const nameInputRef = useRef(null); // track Friendly Name input
  const [form, setForm] = useState({
    // AWS fields
    awsAccessKeyId: "",
    awsSecretAccessKey: "",
    // Azure fields
    azureClientId: "",
    azureClientSecret: "",
    azureTenantId: "",
    azureSubscriptionId: "",
    // Shared friendly name or label
    name: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "add", label: "Add Account" },
      { id: "existing", label: `Existing Accounts (${existingAccounts?.length || 0})` },
    ],
    [existingAccounts]
  );

  function markTouched(key) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Validation
  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "A friendly name is required.";
    if (provider === "AWS") {
      if (!form.awsAccessKeyId.trim()) e.awsAccessKeyId = "Access Key ID is required.";
      if (!form.awsSecretAccessKey.trim()) e.awsSecretAccessKey = "Secret Access Key is required.";
    } else if (provider === "Azure") {
      if (!form.azureClientId.trim()) e.azureClientId = "Client ID is required.";
      if (!form.azureClientSecret.trim()) e.azureClientSecret = "Client Secret is required.";
      if (!form.azureTenantId.trim()) e.azureTenantId = "Tenant ID is required.";
      if (!form.azureSubscriptionId.trim()) e.azureSubscriptionId = "Subscription ID is required.";
    }
    return e;
  }, [provider, form]);

  const hasErrors = Object.keys(errors).length > 0;

  function resetState() {
    setProvider("AWS");
    setForm({
      awsAccessKeyId: "",
      awsSecretAccessKey: "",
      azureClientId: "",
      azureClientSecret: "",
      azureTenantId: "",
      azureSubscriptionId: "",
      name: "",
    });
    setTouched({});
    setSubmitting(false);
    setActiveTab("add");
  }

  function handleClose() {
    resetState();
    onClose?.();
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    // mark all relevant touched to show errors
    const keysToTouch =
      provider === "AWS"
        ? ["name", "awsAccessKeyId", "awsSecretAccessKey"]
        : ["name", "azureClientId", "azureClientSecret", "azureTenantId", "azureSubscriptionId"];
    const newTouched = {};
    keysToTouch.forEach((k) => (newTouched[k] = true));
    setTouched((t) => ({ ...t, ...newTouched }));

    if (hasErrors) return;

    setSubmitting(true);
    try {
      // Build safe payload for demonstration. We DO NOT persist to backend here.
      const payload =
        provider === "AWS"
          ? {
              provider,
              name: form.name.trim(),
              credentials: {
                accessKeyId: form.awsAccessKeyId.trim(),
                secretAccessKey: form.awsSecretAccessKey.trim(),
              },
            }
          : {
              provider,
              name: form.name.trim(),
              credentials: {
                clientId: form.azureClientId.trim(),
                clientSecret: form.azureClientSecret.trim(),
                tenantId: form.azureTenantId.trim(),
                subscriptionId: form.azureSubscriptionId.trim(),
              },
            };

      // Call optional callback so parent can mock attach or confirm.
      onSubmit?.(payload);

      // For UX, close and reset after submit
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  // Helper to render field with label + error (memoized to prevent unnecessary re-renders)
  const Field = useCallback(
    memo(
      // forward ref to input to preserve focus when parent re-renders
      React.forwardRef(function FieldInner(
        { label, id, type = "text", value, onChange, placeholder = "", autoComplete, helpText },
        ref
      ) {
        const error = touched[id] && errors[id] ? errors[id] : "";
        return (
          <div>
            <label htmlFor={id} style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              {label}
            </label>
            <input
              id={id}
              className="input"
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => markTouched(id)}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              autoComplete={autoComplete}
              ref={ref}
            />
            {helpText && !error && (
              <div className="text-xs" style={{ color: "var(--muted)", marginTop: 6 }}>{helpText}</div>
            )}
            {error && (
              <div id={`${id}-error`} role="alert" style={{ color: "var(--error)", fontSize: 12, marginTop: 6 }}>
                {error}
              </div>
            )}
          </div>
        );
      })
    ),
    [touched, errors]
  );

  const footer = useMemo(() => (
    <>
      <button className="btn" onClick={handleClose} aria-label="Cancel add cloud account">
        Cancel
      </button>
      <button
        className="btn primary"
        onClick={handleSubmit}
        disabled={submitting}
        aria-label="Submit credentials securely"
      >
        {submitting ? "Submitting…" : "Submit Securely"}
      </button>
    </>
  ), [handleClose, handleSubmit, submitting]);

  return (
    <Modal
      title="Add Cloud Account"
      open={open}
      onClose={handleClose}
      footer={activeTab === "add" ? footer : <button className="btn" onClick={handleClose}>Close</button>}
      disableBackdropClose={true}
    >
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "add" && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }} aria-label="Add cloud account form">
          {/* Provider selection */}
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>
              Select Provider
            </legend>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="provider"
                  value="AWS"
                  checked={provider === "AWS"}
                  onChange={() => setProvider("AWS")}
                />
                <span>AWS</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="provider"
                  value="Azure"
                  checked={provider === "Azure"}
                  onChange={() => {
                    const wasFocused = document.activeElement === nameInputRef.current;
                    setProvider("Azure");
                    if (wasFocused) {
                      requestAnimationFrame(() => nameInputRef.current?.focus());
                    }
                  }}
                />
                <span>Azure</span>
              </label>
            </div>
          </fieldset>

          {/* Friendly Name */}
          <Field
            id="name"
            label="Friendly Name"
            value={form.name}
            onChange={(v) => updateField("name", v)}
            placeholder="e.g., Production Account"
            autoComplete="off"
            helpText="A short label to identify this account in the dashboard."
            ref={nameInputRef}
          />

          {/* Provider-specific credential fields */}
          {provider === "AWS" ? (
            <div>
              <Field
                id="awsAccessKeyId"
                label="Access Key ID"
                value={form.awsAccessKeyId}
                onChange={(v) => updateField("awsAccessKeyId", v)}
                placeholder="AKIA…"
                autoComplete="off"
              />
              <Field
                id="awsSecretAccessKey"
                label="Secret Access Key"
                type="password"
                value={form.awsSecretAccessKey}
                onChange={(v) => updateField("awsSecretAccessKey", v)}
                placeholder="•••••••••••••••••••••"
                autoComplete="new-password"
              />
            </div>
          ) : (
            <div>
              <Field
                id="azureClientId"
                label="Client ID (Application ID)"
                value={form.azureClientId}
                onChange={(v) => updateField("azureClientId", v)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
              />
              <Field
                id="azureClientSecret"
                label="Client Secret"
                type="password"
                value={form.azureClientSecret}
                onChange={(v) => updateField("azureClientSecret", v)}
                placeholder="•••••••••••••••••••••"
                autoComplete="new-password"
              />
              <Field
                id="azureTenantId"
                label="Tenant ID"
                value={form.azureTenantId}
                onChange={(v) => updateField("azureTenantId", v)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
              />
              <Field
                id="azureSubscriptionId"
                label="Subscription ID"
                value={form.azureSubscriptionId}
                onChange={(v) => updateField("azureSubscriptionId", v)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
              />
            </div>
          )}

          {/* Note about security (frontend only for now) */}
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Note: Credentials are not persisted yet. This is a client-side flow for preview purposes.
          </div>
        </form>
      )}

      {activeTab === "existing" && (
        <div style={{ display: "grid", gap: 8 }}>
          {(!existingAccounts || existingAccounts.length === 0) && (
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No accounts linked yet</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Add an AWS or Azure account to get started.
              </div>
            </div>
          )}
          {(existingAccounts || []).map((acc, idx) => (
            <div key={idx} className="panel" style={{ padding: 12, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{acc.name || "(no name)"}</div>
                <div className="badge">{acc.provider}</div>
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {acc.account_id || "N/A"} · Added {new Date(acc.created_at || Date.now()).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
