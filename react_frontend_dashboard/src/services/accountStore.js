//
// PUBLIC INTERFACE utilities for in-memory account management and stat aggregation.
// This module provides a lightweight store to keep linked cloud accounts in memory
// and helpers to compute dashboard summary stats derived from the account list.
//
// IMPORTANT: This is a mock/in-memory implementation. If backend APIs exist,
// Overview.jsx can continue to use them; otherwise, these helpers provide
// consistent append-and-recalc behavior without persistence.
//

let _accounts = [];

/**
 * PUBLIC_INTERFACE
 */
export function getAccounts() {
  /** Returns a shallow copy of the current in-memory accounts array. */
  return [..._accounts];
}

/**
 * PUBLIC_INTERFACE
 */
export function setAccounts(list) {
  /**
   * Replaces the store accounts with a new list (used when loading from backend).
   * Items expected to look like:
   * { id?, provider: 'AWS'|'Azure'|'GCP', name, account_id?, created_at?, metadata? }
   */
  _accounts = Array.isArray(list) ? [...list] : [];
  return getAccounts();
}

/**
 * PUBLIC_INTERFACE
 */
export function appendAccount(account) {
  /**
   * Appends a single account to the store if it doesn't already exist by a basic identity key.
   * If a similar account exists, this function will still append (mock-merge) to keep behavior simple,
   * but you can de-duplicate here if desired.
   */
  const normalized = {
    ...account,
    provider: (account?.provider || '').toString().toUpperCase() === 'AZURE' ? 'Azure'
      : (account?.provider || '').toString().toUpperCase() === 'AWS' ? 'AWS'
      : (account?.provider || '').toString().toUpperCase() === 'GCP' ? 'GCP'
      : account?.provider || 'Unknown',
    created_at: account?.created_at || new Date().toISOString(),
  };
  _accounts = [..._accounts, normalized];
  return getAccounts();
}

/**
 * PUBLIC_INTERFACE
 */
export function computeStatsFromAccounts(existingStats = { resources: 0, daily: 0, recs: 0 }) {
  /**
   * Produces combined dashboard stats based on current accounts.
   * Since this is a mock, we derive numbers deterministically from the account names/ids
   * to keep values stable across re-renders.
   */
  const accs = _accounts;
  const totalAccounts = accs.length;

  // Deterministic pseudo-random number from a string
  const hashNum = (s) => {
    if (!s) return 0;
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  let resourcesSum = 0;
  let dailySum = 0;
  let recsSum = 0;

  accs.forEach((a, idx) => {
    const base = hashNum(`${a.provider}|${a.name}|${a.account_id || idx}`);
    // Spread values to sensible ranges
    const resources = 20 + (base % 60);  // 20..79 per account
    const daily = 15 + (base % 85);      // $15..$99 per account
    const recs = 1 + (base % 4);         // 1..4 per account
    resourcesSum += resources;
    dailySum += daily;
    recsSum += recs;
  });

  return {
    accounts: totalAccounts,
    resources: resourcesSum || existingStats.resources || 0,
    daily: Number((dailySum || existingStats.daily || 0).toFixed(2)),
    recs: recsSum || existingStats.recs || 0,
  };
}
