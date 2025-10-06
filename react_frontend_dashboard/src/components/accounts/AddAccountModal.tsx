import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal';

type Provider = 'aws' | 'azure';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
};

// Shared minimalist theme classes
const fieldBase =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none';
const labelClasses = 'text-xs font-medium text-gray-700';
const hintClasses = 'mt-1 text-[11px] text-gray-500';
const errorText = 'mt-1 text-[11px] text-red-600';
const rowGap = 'space-y-3';

// Basic validators
const is12Digit = (s: string) => /^\d{12}$/.test(s.trim());
const isGuid = (s: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    s.trim()
  );

const commonAwsRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
];

const AddAccountModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [provider, setProvider] = useState<Provider>('aws');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const firstInvalidRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<any>({
    account_name: '',

    // AWS
    aws_account_id: '',
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_region: '',
    aws_role_arn: '', // optional

    // Azure
    azure_subscription_id: '',
    azure_tenant_id: '',
    azure_client_id: '',
    azure_client_secret: '',
    azure_resource_group: '', // optional
  });

  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const handleChange = (key: string, value: string) =>
    setForm((p: any) => ({ ...p, [key]: value }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.account_name.trim()) {
      e.account_name = 'Account Name is required.';
    }

    if (provider === 'aws') {
      if (!form.aws_account_id.trim()) e.aws_account_id = 'AWS Account ID is required.';
      else if (!is12Digit(form.aws_account_id)) e.aws_account_id = 'AWS Account ID must be 12 digits.';

      if (!form.aws_access_key_id.trim()) e.aws_access_key_id = 'Access Key ID is required.';
      if (!form.aws_secret_access_key.trim()) e.aws_secret_access_key = 'Secret Access Key is required.';
      if (!form.aws_region.trim()) e.aws_region = 'Region is required.';
      // aws_role_arn optional
    } else {
      if (!form.azure_subscription_id.trim()) e.azure_subscription_id = 'Subscription ID is required.';
      else if (!isGuid(form.azure_subscription_id)) e.azure_subscription_id = 'Subscription ID must be a GUID.';

      if (!form.azure_tenant_id.trim()) e.azure_tenant_id = 'Tenant ID is required.';
      else if (!isGuid(form.azure_tenant_id)) e.azure_tenant_id = 'Tenant ID must be a GUID.';

      if (!form.azure_client_id.trim()) e.azure_client_id = 'Client ID is required.';
      else if (!isGuid(form.azure_client_id)) e.azure_client_id = 'Client ID must be a GUID.';

      if (!form.azure_client_secret.trim()) e.azure_client_secret = 'Client Secret is required.';
      // azure_resource_group optional
    }
    return e;
  }, [form, provider]);

  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!open) {
      // reset on close
      setProvider('aws');
      setTouched({});
      setForm({
        account_name: '',
        aws_account_id: '',
        aws_access_key_id: '',
        aws_secret_access_key: '',
        aws_region: '',
        aws_role_arn: '',
        azure_subscription_id: '',
        azure_tenant_id: '',
        azure_client_id: '',
        azure_client_secret: '',
        azure_resource_group: '',
      });
    }
  }, [open]);

  const tryFocusFirstInvalid = () => {
    // Determine first invalid field id by provider order
    const order =
      provider === 'aws'
        ? [
            'account_name',
            'aws_account_id',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_region',
          ]
        : [
            'account_name',
            'azure_subscription_id',
            'azure_tenant_id',
            'azure_client_id',
            'azure_client_secret',
          ];
    const firstInvalidId = order.find((id) => errors[id]);
    if (firstInvalidId) {
      const el = document.getElementById(firstInvalidId) as HTMLInputElement | null;
      if (el) el.focus();
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    // mark required fields as touched
    const toTouch =
      provider === 'aws'
        ? [
            'account_name',
            'aws_account_id',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_region',
          ]
        : [
            'account_name',
            'azure_subscription_id',
            'azure_tenant_id',
            'azure_client_id',
            'azure_client_secret',
          ];
    const touchedPayload: Record<string, boolean> = {};
    toTouch.forEach((k) => (touchedPayload[k] = true));
    setTouched((t) => ({ ...t, ...touchedPayload }));

    if (Object.keys(errors).length > 0) {
      tryFocusFirstInvalid();
      return;
    }

    // PUBLIC_INTERFACE
    // Stub submit: log payload and close modal on success. Real backend integration to be added later.
    const payload =
      provider === 'aws'
        ? {
            provider: 'aws',
            accountName: form.account_name.trim(),
            accountId: form.aws_account_id.trim(),
            accessKeyId: form.aws_access_key_id.trim(),
            secretAccessKey: form.aws_secret_access_key.trim(),
            region: form.aws_region.trim(),
            roleArn: form.aws_role_arn.trim() || undefined,
            note: 'Keys stored securely – never shared. You can rotate keys later.',
          }
        : {
            provider: 'azure',
            accountName: form.account_name.trim(),
            subscriptionId: form.azure_subscription_id.trim(),
            tenantId: form.azure_tenant_id.trim(),
            clientId: form.azure_client_id.trim(),
            clientSecret: form.azure_client_secret.trim(),
            resourceGroup: form.azure_resource_group.trim() || undefined,
            note: 'Secrets stored securely – never shared. You can rotate keys later.',
          };

    try {
      // eslint-disable-next-line no-console
      console.log('connectCloudAccount payload', payload);
      await onSubmit?.(payload);
      onClose();
    } catch (err) {
      alert('Failed to add account. Please try again.'); // fallback generic error message; page also keeps state
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Cloud Account"
      widthClassName="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4" aria-label="Add cloud account form">
        {/* Provider selector */}
        <div>
          <label className={labelClasses} htmlFor="provider">Cloud Provider</label>
          <select
            id="provider"
            className={fieldBase}
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
          </select>
        </div>

        {/* Account Name */}
        <div>
          <label className={labelClasses} htmlFor="account_name">Account Name *</label>
          <input
            id="account_name"
            className={`${fieldBase} ${touched.account_name && errors.account_name ? 'border-red-400' : ''}`}
            placeholder="e.g., Prod AWS (Billing) or Azure Sub - Finance"
            value={form.account_name}
            onChange={(e) => handleChange('account_name', e.target.value)}
            onBlur={() => markTouched('account_name')}
            aria-invalid={!!(touched.account_name && errors.account_name)}
            aria-describedby={touched.account_name && errors.account_name ? 'account_name_error' : undefined}
          />
          {touched.account_name && errors.account_name && (
            <p id="account_name_error" className={errorText}>{errors.account_name}</p>
          )}
        </div>

        {/* AWS fields */}
        {provider === 'aws' && (
          <div className={rowGap}>
            <div>
              <label className={labelClasses} htmlFor="aws_account_id">AWS Account ID *</label>
              <input
                id="aws_account_id"
                className={`${fieldBase} ${touched.aws_account_id && errors.aws_account_id ? 'border-red-400' : ''}`}
                placeholder="12-digit account ID (e.g., 123456789012)"
                value={form.aws_account_id}
                onChange={(e) => handleChange('aws_account_id', e.target.value)}
                onBlur={() => markTouched('aws_account_id')}
                aria-invalid={!!(touched.aws_account_id && errors.aws_account_id)}
                aria-describedby={touched.aws_account_id && errors.aws_account_id ? 'aws_account_id_error' : undefined}
              />
              {touched.aws_account_id && errors.aws_account_id && (
                <p id="aws_account_id_error" className={errorText}>{errors.aws_account_id}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="aws_access_key_id">Access Key ID *</label>
              <input
                id="aws_access_key_id"
                className={`${fieldBase} ${touched.aws_access_key_id && errors.aws_access_key_id ? 'border-red-400' : ''}`}
                placeholder="AKIA..."
                autoComplete="off"
                value={form.aws_access_key_id}
                onChange={(e) => handleChange('aws_access_key_id', e.target.value)}
                onBlur={() => markTouched('aws_access_key_id')}
                aria-invalid={!!(touched.aws_access_key_id && errors.aws_access_key_id)}
                aria-describedby={touched.aws_access_key_id && errors.aws_access_key_id ? 'aws_access_key_id_error' : 'aws_access_key_id_hint'}
              />
              {!errors.aws_access_key_id && (
                <p id="aws_access_key_id_hint" className={hintClasses}>
                  Stored securely – never shared. You can rotate keys later.
                </p>
              )}
              {touched.aws_access_key_id && errors.aws_access_key_id && (
                <p id="aws_access_key_id_error" className={errorText}>{errors.aws_access_key_id}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="aws_secret_access_key">Secret Access Key *</label>
              <input
                id="aws_secret_access_key"
                type="password"
                className={`${fieldBase} ${touched.aws_secret_access_key && errors.aws_secret_access_key ? 'border-red-400' : ''}`}
                placeholder="••••••••••••••••••••"
                autoComplete="new-password"
                value={form.aws_secret_access_key}
                onChange={(e) => handleChange('aws_secret_access_key', e.target.value)}
                onBlur={() => markTouched('aws_secret_access_key')}
                aria-invalid={!!(touched.aws_secret_access_key && errors.aws_secret_access_key)}
                aria-describedby={touched.aws_secret_access_key && errors.aws_secret_access_key ? 'aws_secret_access_key_error' : 'aws_secret_access_key_hint'}
              />
              {!errors.aws_secret_access_key && (
                <p id="aws_secret_access_key_hint" className={hintClasses}>
                  Stored securely – never shared. You can rotate keys later.
                </p>
              )}
              {touched.aws_secret_access_key && errors.aws_secret_access_key && (
                <p id="aws_secret_access_key_error" className={errorText}>{errors.aws_secret_access_key}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="aws_region">Region *</label>
              <select
                id="aws_region"
                className={`${fieldBase} ${touched.aws_region && errors.aws_region ? 'border-red-400' : ''}`}
                value={form.aws_region}
                onChange={(e) => handleChange('aws_region', e.target.value)}
                onBlur={() => markTouched('aws_region')}
                aria-invalid={!!(touched.aws_region && errors.aws_region)}
                aria-describedby={touched.aws_region && errors.aws_region ? 'aws_region_error' : undefined}
              >
                <option value="" disabled>Select a region</option>
                {commonAwsRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {touched.aws_region && errors.aws_region && (
                <p id="aws_region_error" className={errorText}>{errors.aws_region}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="aws_role_arn">Role ARN (optional)</label>
              <input
                id="aws_role_arn"
                className={fieldBase}
                placeholder="arn:aws:iam::123456789012:role/CrossAccountRole"
                value={form.aws_role_arn}
                onChange={(e) => handleChange('aws_role_arn', e.target.value)}
              />
              <p className={hintClasses}>If using cross-account role, provide the role ARN.</p>
            </div>
          </div>
        )}

        {/* Azure fields */}
        {provider === 'azure' && (
          <div className={rowGap}>
            <div>
              <label className={labelClasses} htmlFor="azure_subscription_id">Subscription ID *</label>
              <input
                id="azure_subscription_id"
                className={`${fieldBase} ${touched.azure_subscription_id && errors.azure_subscription_id ? 'border-red-400' : ''}`}
                placeholder="GUID, e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_subscription_id}
                onChange={(e) => handleChange('azure_subscription_id', e.target.value)}
                onBlur={() => markTouched('azure_subscription_id')}
                aria-invalid={!!(touched.azure_subscription_id && errors.azure_subscription_id)}
                aria-describedby={touched.azure_subscription_id && errors.azure_subscription_id ? 'azure_subscription_id_error' : undefined}
              />
              {touched.azure_subscription_id && errors.azure_subscription_id && (
                <p id="azure_subscription_id_error" className={errorText}>{errors.azure_subscription_id}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="azure_tenant_id">Tenant ID *</label>
              <input
                id="azure_tenant_id"
                className={`${fieldBase} ${touched.azure_tenant_id && errors.azure_tenant_id ? 'border-red-400' : ''}`}
                placeholder="GUID, e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_tenant_id}
                onChange={(e) => handleChange('azure_tenant_id', e.target.value)}
                onBlur={() => markTouched('azure_tenant_id')}
                aria-invalid={!!(touched.azure_tenant_id && errors.azure_tenant_id)}
                aria-describedby={touched.azure_tenant_id && errors.azure_tenant_id ? 'azure_tenant_id_error' : undefined}
              />
              {touched.azure_tenant_id && errors.azure_tenant_id && (
                <p id="azure_tenant_id_error" className={errorText}>{errors.azure_tenant_id}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="azure_client_id">Client ID *</label>
              <input
                id="azure_client_id"
                className={`${fieldBase} ${touched.azure_client_id && errors.azure_client_id ? 'border-red-400' : ''}`}
                placeholder="GUID, e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_client_id}
                onChange={(e) => handleChange('azure_client_id', e.target.value)}
                onBlur={() => markTouched('azure_client_id')}
                aria-invalid={!!(touched.azure_client_id && errors.azure_client_id)}
                aria-describedby={touched.azure_client_id && errors.azure_client_id ? 'azure_client_id_error' : 'azure_client_id_hint'}
              />
              {!errors.azure_client_id && (
                <p id="azure_client_id_hint" className={hintClasses}>
                  Stored securely – never shared. You can rotate keys later.
                </p>
              )}
              {touched.azure_client_id && errors.azure_client_id && (
                <p id="azure_client_id_error" className={errorText}>{errors.azure_client_id}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="azure_client_secret">Client Secret *</label>
              <input
                id="azure_client_secret"
                type="password"
                className={`${fieldBase} ${touched.azure_client_secret && errors.azure_client_secret ? 'border-red-400' : ''}`}
                placeholder="••••••••••••••••••••"
                autoComplete="new-password"
                value={form.azure_client_secret}
                onChange={(e) => handleChange('azure_client_secret', e.target.value)}
                onBlur={() => markTouched('azure_client_secret')}
                aria-invalid={!!(touched.azure_client_secret && errors.azure_client_secret)}
                aria-describedby={touched.azure_client_secret && errors.azure_client_secret ? 'azure_client_secret_error' : 'azure_client_secret_hint'}
              />
              {!errors.azure_client_secret && (
                <p id="azure_client_secret_hint" className={hintClasses}>
                  Stored securely – never shared. You can rotate keys later.
                </p>
              )}
              {touched.azure_client_secret && errors.azure_client_secret && (
                <p id="azure_client_secret_error" className={errorText}>{errors.azure_client_secret}</p>
              )}
            </div>

            <div>
              <label className={labelClasses} htmlFor="azure_resource_group">Resource Group (optional)</label>
              <input
                id="azure_resource_group"
                className={fieldBase}
                placeholder="e.g., rg-finance-prod"
                value={form.azure_resource_group}
                onChange={(e) => handleChange('azure_resource_group', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={hasErrors}
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
            aria-disabled={hasErrors}
          >
            Add Account
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAccountModal;
