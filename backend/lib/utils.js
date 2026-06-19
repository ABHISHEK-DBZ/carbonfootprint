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
 * Returns a deep clone of input with `path` (e.g. "diet.dietType")
 * replaced by updater(currentValue). Uses structuredClone for correctness.
 */
function withPath(input, path, updater) {
  const clone = structuredClone(input || {});
  const [section, key] = path.split('.');
  if (!clone[section]) clone[section] = {};
  clone[section][key] = updater(clone[section][key]);
  return clone;
}

/**
 * Escape HTML special characters to prevent XSS.
 * Works in both browser and Node.js environments.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Debounce function calls for performance.
 */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

module.exports = { num, round2, formatKg, withPath, escapeHtml, debounce };
