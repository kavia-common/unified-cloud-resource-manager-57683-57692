import React, { useState } from 'react';
import Modal from '../ui/Modal';

type Provider = 'aws' | 'azure';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
};

const fieldClasses =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none';
const labelClasses = 'text-xs font-medium text-gray-700';
const hintClasses = 'mt-1 text-[11px] text-gray-500';

const AddAccountModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [provider, setProvider] = useState<Provider>('aws');
  const [form, setForm] = useState<any>({
    // AWS defaults
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_account_id: '',
    // Azure defaults
    azure_tenant_id: '',
    azure_client_id: '',
    azure_client_secret: '',
    azure_subscription_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) =>
    setForm((p: any) => ({ ...p, [key]: value }));

  const validate = () => {
    if (provider === 'aws') {
      return (
        form.aws_access_key_id &&
        form.aws_secret_access_key &&
        form.aws_account_id
      );
    }
    return (
      form.azure_tenant_id &&
      form.azure_client_id &&
      form.azure_client_secret &&
      form.azure_subscription_id
    );
  };

  const submit = async () => {
    setError(null);
    if (!validate()) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ provider, ...form });
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to add account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Cloud Account" widthClassName="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className={labelClasses}>Cloud Provider</label>
          <select
            className={fieldClasses}
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
          </select>
        </div>

        {provider === 'aws' ? (
          <div className="space-y-3">
            <div>
              <label className={labelClasses}>AWS Access Key ID</label>
              <input
                className={fieldClasses}
                placeholder="AKIA..."
                value={form.aws_access_key_id}
                onChange={(e) => handleChange('aws_access_key_id', e.target.value)}
              />
              <p className={hintClasses}>Programmatic access key for the IAM user/role.</p>
            </div>
            <div>
              <label className={labelClasses}>AWS Secret Access Key</label>
              <input
                type="password"
                className={fieldClasses}
                placeholder="••••••••"
                value={form.aws_secret_access_key}
                onChange={(e) =>
                  handleChange('aws_secret_access_key', e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClasses}>AWS Account ID</label>
              <input
                className={fieldClasses}
                placeholder="123456789012"
                value={form.aws_account_id}
                onChange={(e) => handleChange('aws_account_id', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={labelClasses}>Azure Tenant ID</label>
              <input
                className={fieldClasses}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_tenant_id}
                onChange={(e) => handleChange('azure_tenant_id', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasses}>Azure Client ID</label>
              <input
                className={fieldClasses}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_client_id}
                onChange={(e) => handleChange('azure_client_id', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasses}>Azure Client Secret</label>
              <input
                type="password"
                className={fieldClasses}
                placeholder="••••••••"
                value={form.azure_client_secret}
                onChange={(e) =>
                  handleChange('azure_client_secret', e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClasses}>Azure Subscription ID</label>
              <input
                className={fieldClasses}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.azure_subscription_id}
                onChange={(e) =>
                  handleChange('azure_subscription_id', e.target.value)
                }
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? 'Adding…' : 'Add Account'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddAccountModal;
