import React, { useMemo, useState, useRef, memo, useCallback } from "react";
import { Modal } from "./Modal";
import { Tabs } from "./Tabs";

/**
 * PUBLIC_INTERFACE
 */
// Reusable Field defined at module scope to avoid re-creation on every render,
// ensuring inputs keep their identity and do not lose focus due to remounts.
const Field = memo(
  React.forwardRef(function FieldInner(
    { label, id, type = "text", value, onChange, onBlur, placeholder = "", autoComplete, error, helpText },
    ref
  ) {
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
          onChange={onChange}
          onBlur={onBlur}
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
);

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

  const markTouched = useCallback((key) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const updateField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

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

    // Recompute errors synchronously using current form/provider to avoid stale hasErrors closure
    const currentErrors = (() => {
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
    })();
    if (Object.keys(currentErrors).length > 0) return;

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

  // derive error getter to pass to stable Field component
  const getError = useCallback(
    (id) => (touched[id] && errors[id] ? errors[id] : ""),
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
      headerActions={
        <button
          type="button"
          className="btn primary-accent"
          aria-label="Manage linked cloud accounts"
          onClick={() => setActiveTab("existing")}
          title="Manage"
        >
          Manage
        </button>
      }
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
                      // keep focus on Friendly Name after switching provider
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
            onChange={(e) => updateField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            placeholder="e.g., Production Account"
            autoComplete="off"
            error={getError("name")}
            helpText="A short label to identify this account in the dashboard."
            ref={nameInputRef}
          />

          {/* Provider-specific credential fields */}
          <div style={{ display: provider === "AWS" ? "block" : "none" }}>
            <Field
              id="awsAccessKeyId"
              label="Access Key ID"
              value={form.awsAccessKeyId}
              onChange={(e) => updateField("awsAccessKeyId", e.target.value)}
              onBlur={() => markTouched("awsAccessKeyId")}
              placeholder="AKIA…"
              autoComplete="off"
              error={getError("awsAccessKeyId")}
            />
            <Field
              id="awsSecretAccessKey"
              label="Secret Access Key"
              type="password"
              value={form.awsSecretAccessKey}
              onChange={(e) => updateField("awsSecretAccessKey", e.target.value)}
              onBlur={() => markTouched("awsSecretAccessKey")}
              placeholder="•••••••••••••••••••••"
              autoComplete="new-password"
              error={getError("awsSecretAccessKey")}
            />
          </div>

          <div style={{ display: provider === "Azure" ? "block" : "none" }}>
            <Field
              id="azureClientId"
              label="Client ID (Application ID)"
              value={form.azureClientId}
              onChange={(e) => updateField("azureClientId", e.target.value)}
              onBlur={() => markTouched("azureClientId")}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              error={getError("azureClientId")}
            />
            <Field
              id="azureClientSecret"
              label="Client Secret"
              type="password"
              value={form.azureClientSecret}
              onChange={(e) => updateField("azureClientSecret", e.target.value)}
              onBlur={() => markTouched("azureClientSecret")}
              placeholder="•••••••••••••••••••••"
              autoComplete="new-password"
              error={getError("azureClientSecret")}
            />
            <Field
              id="azureTenantId"
              label="Tenant ID"
              value={form.azureTenantId}
              onChange={(e) => updateField("azureTenantId", e.target.value)}
              onBlur={() => markTouched("azureTenantId")}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              error={getError("azureTenantId")}
            />
            <Field
              id="azureSubscriptionId"
              label="Subscription ID"
              value={form.azureSubscriptionId}
              onChange={(e) => updateField("azureSubscriptionId", e.target.value)}
              onBlur={() => markTouched("azureSubscriptionId")}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              error={getError("azureSubscriptionId")}
            />
          </div>

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
            <div
              key={idx}
              className="panel"
              style={{ padding: 12, display: "grid", gap: 8 }}
              aria-label={`Existing account ${acc.name || "unnamed"} for ${acc.provider || "Unknown provider"}`}
            >
              {/* Header row with name and provider badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700, minWidth: 0 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {acc.name || "(no name)"}
                  </span>
                </div>
                <div className="badge" aria-label={`Provider ${acc.provider || "unknown"}`}>{acc.provider}</div>
              </div>

              {/* Meta row */}
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {acc.account_id || "N/A"} · Added {new Date(acc.created_at || Date.now()).toLocaleString()}
              </div>

              {/* Provider label placed clearly above the action area */}
              <div
                className="text-xs"
                style={{
                  color: "var(--muted)",
                  marginTop: 4,
                  marginBottom: 2,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
                aria-label="Provider label"
              >
                {acc.provider}
              </div>

              {/* Action area removed per design: unified Manage button is in the modal header */}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
