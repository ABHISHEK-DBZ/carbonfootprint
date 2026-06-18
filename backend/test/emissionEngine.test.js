'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateTransport,
  calculateElectricity,
  calculateDiet,
  calculateWaste,
  calculateTotal
} = require('../lib/emissionEngine');

test('calculateTransport returns 0 for no travel', () => {
  assert.equal(calculateTransport({ carKmPerWeek: 0 }), 0);
});

test('calculateTransport scales with weekly car km', () => {
  const low = calculateTransport({ carKmPerWeek: 50, carFuel: 'petrol' });
  const high = calculateTransport({ carKmPerWeek: 100, carFuel: 'petrol' });
  assert.ok(high > low, 'doubling km should increase emissions');
  assert.equal(high, low * 2);
});

test('calculateTransport: electric car emits less than petrol for same distance', () => {
  const petrol = calculateTransport({ carKmPerWeek: 100, carFuel: 'petrol' });
  const electric = calculateTransport({ carKmPerWeek: 100, carFuel: 'electric' });
  assert.ok(electric < petrol);
});

test('calculateElectricity: more renewable share reduces emissions', () => {
  const dirty = calculateElectricity({ monthlyKwh: 300, renewablePercent: 0 });
  const clean = calculateElectricity({ monthlyKwh: 300, renewablePercent: 100 });
  assert.ok(clean < dirty);
});

test('calculateElectricity: clamps out-of-range renewable percent', () => {
  const overOneHundred = calculateElectricity({ monthlyKwh: 100, renewablePercent: 250 });
  const oneHundred = calculateElectricity({ monthlyKwh: 100, renewablePercent: 100 });
  assert.equal(overOneHundred, oneHundred);
});

test('calculateDiet: vegan diet emits less than heavy meat diet', () => {
  const vegan = calculateDiet({ dietType: 'vegan' });
  const heavy = calculateDiet({ dietType: 'heavy_meat' });
  assert.ok(vegan < heavy);
});

test('calculateDiet: unknown diet type falls back safely instead of throwing', () => {
  assert.doesNotThrow(() => calculateDiet({ dietType: 'not_a_real_diet' }));
});

test('calculateWaste: full composting/recycling is cheaper than full landfill', () => {
  const landfill = calculateWaste({ wasteKgPerWeek: 10, recyclingPercent: 0, compostingPercent: 0 });
  const diverted = calculateWaste({ wasteKgPerWeek: 10, recyclingPercent: 50, compostingPercent: 50 });
  assert.ok(diverted < landfill);
});

test('calculateTotal: breakdown sums to totalKgPerYear', () => {
  const result = calculateTotal({
    transport: { carKmPerWeek: 80, carFuel: 'petrol' },
    electricity: { monthlyKwh: 200, renewablePercent: 10 },
    diet: { dietType: 'medium_meat' },
    waste: { wasteKgPerWeek: 8, recyclingPercent: 20, compostingPercent: 10 }
  });
  const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - result.totalKgPerYear) < 0.01);
  assert.ok(result.totalTonnesPerYear > 0);
  assert.ok(result.benchmarks.global_avg_annual_tonnes > 0);
});

test('calculateTotal: handles a fully empty input without throwing', () => {
  assert.doesNotThrow(() => calculateTotal({}));
});
