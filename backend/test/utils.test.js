'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { num, round2, formatKg, withPath, escapeHtml, debounce } = require('../lib/utils');

test('num: returns valid non-negative numbers', () => {
  assert.equal(num(5), 5);
  assert.equal(num('10'), 10);
  assert.equal(num(0), 0);
});

test('num: returns fallback for invalid values', () => {
  assert.equal(num(NaN), 0);
  assert.equal(num(Infinity), 0);
  assert.equal(num(-1), 0);
  assert.equal(num('abc'), 0);
  assert.equal(num(undefined), 0);
  assert.equal(num(null), 0);
});

test('num: respects custom fallback', () => {
  assert.equal(num(NaN, 42), 42);
  assert.equal(num(-5, 10), 10);
});

test('round2: rounds to 2 decimal places', () => {
  assert.equal(round2(1.234), 1.23);
  assert.equal(round2(1.235), 1.24);
  assert.equal(round2(1.1), 1.1);
  assert.equal(round2(0), 0);
});

test('formatKg: formats kg correctly', () => {
  assert.equal(formatKg(500), '500 kg');
  assert.equal(round2(formatKg(999).replace(' kg', '')), 999);
});

test('formatKg: formats tonnes for large values', () => {
  assert.ok(formatKg(1000).includes('t'));
  assert.ok(formatKg(2500).includes('t'));
});

test('withPath: updates nested values', () => {
  const input = { diet: { dietType: 'vegan' } };
  const result = withPath(input, 'diet.dietType', () => 'vegetarian');
  assert.equal(result.diet.dietType, 'vegetarian');
  assert.equal(input.diet.dietType, 'vegan'); // original not mutated
});

test('withPath: creates missing sections', () => {
  const input = {};
  const result = withPath(input, 'transport.carKmPerWeek', () => 100);
  assert.equal(result.transport.carKmPerWeek, 100);
});

test('withPath: handles null/undefined input', () => {
  const result = withPath(null, 'diet.dietType', () => 'vegan');
  assert.equal(result.diet.dietType, 'vegan');
});

test('escapeHtml: escapes special characters', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml('Hello & World'), 'Hello &amp; World');
  assert.equal(escapeHtml('Normal text'), 'Normal text');
});

test('debounce: delays function execution', async () => {
  let callCount = 0;
  const fn = debounce(() => { callCount++; }, 50);
  fn();
  fn();
  fn();
  assert.equal(callCount, 0); // not called yet
  await new Promise(r => setTimeout(r, 100));
  assert.equal(callCount, 1); // called once after delay
});
