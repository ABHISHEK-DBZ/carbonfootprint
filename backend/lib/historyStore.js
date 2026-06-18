'use strict';

/**
 * Minimal in-memory store keyed by an anonymous client-generated id (UUID v4).
 * No personal data is ever stored - only the numeric footprint snapshot.
 *
 * This is intentionally simple for a demo/awareness tool: it resets on
 * server restart and is bounded in size to avoid unbounded memory growth.
 * Swap this module for a real database (e.g. SQLite/Postgres) before
 * using this in production with real users.
 */

const MAX_USERS = 2000;
const MAX_ENTRIES_PER_USER = 52; // ~1 year of weekly check-ins

const store = new Map();

function addEntry(anonymousId, entry) {
  if (!store.has(anonymousId)) {
    if (store.size >= MAX_USERS) {
      // Evict the oldest tracked user to bound memory (simple FIFO eviction).
      const oldestKey = store.keys().next().value;
      store.delete(oldestKey);
    }
    store.set(anonymousId, []);
  }

  const entries = store.get(anonymousId);
  entries.push({ ...entry, recordedAt: new Date().toISOString() });
  if (entries.length > MAX_ENTRIES_PER_USER) entries.shift();

  return entries;
}

function getEntries(anonymousId) {
  return store.get(anonymousId) || [];
}

module.exports = { addEntry, getEntries };
