'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateInsights } = require('../lib/recommendationEngine');

const HEAVY_USER = {
  transport: { carKmPerWeek: 300, carFuel: 'petrol', flightsShortHaulPerYear: 2 },
  electricity: { monthlyKwh: 500, renewablePercent: 0 },
  diet: { dietType: 'heavy_meat' },
  waste: { wasteKgPerWeek: 15, recyclingPercent: 0, compostingPercent: 0 }
};

const LIGHT_USER = {
  transport: { carKmPerWeek: 0, cyclingWalkingKm: 50 },
  electricity: { monthlyKwh: 60, renewablePercent: 100 },
  diet: { dietType: 'vegan' },
  waste: { wasteKgPerWeek: 2, recyclingPercent: 90, compostingPercent: 10 }
};

test('generateInsights identifies a dominant category', () => {
  const insights = generateInsights(HEAVY_USER);
  assert.ok(['transport', 'electricity', 'diet', 'waste'].includes(insights.dominantCategory));
});

test('generateInsights ranks recommendations by descending impact', () => {
  const insights = generateInsights(HEAVY_USER);
  const impacts = insights.recommendations.map((r) => r.estimatedImpactKgPerYear);
  const sorted = [...impacts].sort((a, b) => b - a);
  assert.deepEqual(impacts, sorted);
});

test('generateInsights only returns recommendations with a positive estimated impact', () => {
  const insights = generateInsights(HEAVY_USER);
  for (const r of insights.recommendations) {
    assert.ok(r.estimatedImpactKgPerYear > 0);
  }
});

test('generateInsights produces fewer/no recommendations for an already-low-impact user', () => {
  const heavy = generateInsights(HEAVY_USER);
  const light = generateInsights(LIGHT_USER);
  assert.ok(light.recommendations.length <= heavy.recommendations.length);
});

test('generateInsights always returns a non-empty assistant message and next question', () => {
  const insights = generateInsights(HEAVY_USER);
  assert.ok(insights.assistantMessage.length > 0);
  assert.ok(insights.nextQuestion.length > 0);
});

test('generateInsights does not mutate the original input object', () => {
  const input = JSON.parse(JSON.stringify(HEAVY_USER));
  generateInsights(input);
  assert.deepEqual(input, HEAVY_USER);
});
