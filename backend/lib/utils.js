'use strict';

/**
 * Shared utility functions — single source of truth.
 * Import from here instead of duplicating in engine files.
 */

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatKg(kg) {
  if (kg >= 1000) return `${round2(kg / 1000)} t`;
  return `${round2(kg)} kg`;
}

/**
 * Returns a shallow-enough clone of input with `path` (e.g. "diet.dietType")
 * replaced by updater(currentValue). Uses Object.assign for speed.
 */
function withPath(input, path, updater) {
  const clone = { ...input };
  const [section, key] = path.split('.');
  clone[section] = { ...(clone[section] || {}) };
  clone[section][key] = updater(clone[section][key]);
  return clone;
}

module.exports = { num, round2, formatKg, withPath };
