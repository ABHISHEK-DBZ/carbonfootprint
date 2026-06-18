'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateFootprintInput, isValidAnonymousId } = require('../lib/validate');

test('validateFootprintInput accepts a well-formed payload', () => {
  const { valid, errors } = validateFootprintInput({
    transport: { carKmPerWeek: 50, carFuel: 'petrol' },
    electricity: { monthlyKwh: 200, renewablePercent: 20 },
    diet: { dietType: 'vegetarian' },
    waste: { wasteKgPerWeek: 5, recyclingPercent: 40, compostingPercent: 10 }
  });
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('validateFootprintInput rejects negative numbers', () => {
  const { valid, errors } = validateFootprintInput({ transport: { carKmPerWeek: -10 } });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('validateFootprintInput rejects absurdly large numbers (abuse guard)', () => {
  const { valid } = validateFootprintInput({ transport: { carKmPerWeek: 999999999 } });
  assert.equal(valid, false);
});

test('validateFootprintInput rejects unknown enum values', () => {
  const { valid, errors } = validateFootprintInput({ diet: { dietType: 'carnivore-extreme' } });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('dietType')));
});

test('validateFootprintInput rejects a non-object body', () => {
  const { valid } = validateFootprintInput(null);
  assert.equal(valid, false);
});

test('isValidAnonymousId accepts a UUID v4', () => {
  assert.equal(isValidAnonymousId('110ec58a-a0f2-4ac4-8393-c866d813b8d1'), true);
});

test('isValidAnonymousId rejects arbitrary strings', () => {
  assert.equal(isValidAnonymousId('not-a-uuid'), false);
  assert.equal(isValidAnonymousId(12345), false);
});
