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

// LocalStorage keys for persistence
const LS_KEY = "ccm.accounts.v1";
const LS_BACKUP_KEY = "ccm.accounts.backup.v1";

// Internal helper: read JSON from localStorage safely
function readFromLS(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Internal helper: write JSON to localStorage safely
function writeToLS(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota or opaque errors
  }
}

// Attempt auto-hydration on module import so UI has continuity across reloads/theme changes.
(function hydrateFromLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  const saved = readFromLS(LS_KEY);
  if (Array.isArray(saved)) {
    _accounts = [...saved];
  } else {
    // If primary missing, attempt to restore from backup
    const backup = readFromLS(LS_BACKUP_KEY);
    if (Array.isArray(backup)) {
      _accounts = [...backup];
      // write back to primary for stability
      writeToLS(LS_KEY, _accounts);
    }
  }
})();

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
  // persist and backup
  if (typeof window !== "undefined" && window.localStorage) {
    writeToLS(LS_KEY, _accounts);
    writeToLS(LS_BACKUP_KEY, _accounts);
  }
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
  if (typeof window !== "undefined" && window.localStorage) {
    writeToLS(LS_KEY, _accounts);
    writeToLS(LS_BACKUP_KEY, _accounts);
  }
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

/**
 * PUBLIC_INTERFACE
 */
export function exportAccountsBackup() {
  /** Returns a JSON string backup of current accounts for manual export. */
  return JSON.stringify(_accounts, null, 2);
}

/**
 * PUBLIC_INTERFACE
 */
export function importAccountsBackup(jsonString) {
  /**
   * Restores accounts from a JSON string (array) and persists to localStorage.
   * Returns { ok: boolean, error?: string }
   */
  try {
    const arr = JSON.parse(jsonString);
    if (!Array.isArray(arr)) {
      return { ok: false, error: "Backup content is not an array." };
    }
    _accounts = [...arr];
    if (typeof window !== "undefined" && window.localStorage) {
      writeToLS(LS_KEY, _accounts);
      writeToLS(LS_BACKUP_KEY, _accounts);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to parse backup." };
  }
}
