import React, { useState } from 'react';
import AddAccountModal from './AddAccountModal';

/**
 * PUBLIC_INTERFACE
 * connectCloudAccount is a placeholder integration function that will later call
 * Supabase Edge Functions / APIs to securely store and validate credentials.
 */
export async function connectCloudAccount(payload: any) {
  // TODO: Replace with real API/Supabase call
  // eslint-disable-next-line no-console
  console.log('Submitting account payload', payload);
}

/**
 * PUBLIC_INTERFACE
 * AccountsPage renders the Cloud Accounts section and triggers the AddAccountModal.
 */
const AccountsPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Cloud Accounts</h2>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900"
        >
          Add Account
        </button>
      </div>

      {/* Placeholder content for accounts list */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        No accounts connected yet.
      </div>

      <AddAccountModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={connectCloudAccount}
      />
    </div>
  );
};

export default AccountsPage;
