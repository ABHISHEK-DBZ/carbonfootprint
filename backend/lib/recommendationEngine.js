'use strict';

const { calculateTotal } = require('./emissionEngine');

/**
 * Each action knows (a) whether it is relevant for this user's answers and
 * (b) how to simulate "what if you did this" by producing a modified copy
 * of the input. The actual CO2 impact is computed by re-running the real
 * emission engine on the modified input, not a hard-coded guess - this is
 * what keeps the advice grounded in the user's own numbers.
 */
const ACTIONS = [
  {
    id: 'carpool_or_transit',
    category: 'transport',
    title: 'Swap 2 car trips a week for public transit or carpooling',
    difficulty: 'easy',
    applies: (i) => num(i.transport?.carKmPerWeek) >= 20,
    apply: (i) => withPath(i, 'transport.carKmPerWeek', (v) => Math.max(0, num(v) - 2 * avgTripKm(i)))
  },
  {
    id: 'switch_to_ev_or_cng',
    category: 'transport',
    title: 'Consider CNG/EV for your next vehicle change',
    difficulty: 'hard',
    applies: (i) => i.transport?.carFuel === 'petrol' && num(i.transport?.carKmPerWeek) > 0,
    apply: (i) => withPath(i, 'transport.carFuel', () => 'cng')
  },
  {
    id: 'reduce_short_flights',
    category: 'transport',
    title: 'Replace one short-haul flight a year with train/video call',
    difficulty: 'medium',
    applies: (i) => num(i.transport?.flightsShortHaulPerYear) >= 1,
    apply: (i) => withPath(i, 'transport.flightsShortHaulPerYear', (v) => Math.max(0, num(v) - 1))
  },
  {
    id: 'switch_renewable_tariff',
    category: 'electricity',
    title: 'Move to a green/renewable electricity tariff or rooftop solar',
    difficulty: 'medium',
    applies: (i) => num(i.electricity?.renewablePercent) < 50,
    apply: (i) => withPath(i, 'electricity.renewablePercent', (v) => Math.min(100, num(v) + 30))
  },
  {
    id: 'reduce_electricity_use',
    category: 'electricity',
    title: 'Cut standby/AC load with efficient appliances and LED lighting',
    difficulty: 'easy',
    applies: (i) => num(i.electricity?.monthlyKwh) >= 150,
    apply: (i) => withPath(i, 'electricity.monthlyKwh', (v) => num(v) * 0.85)
  },
  {
    id: 'reduce_red_meat',
    category: 'diet',
    title: 'Go meat-free 2 days a week',
    difficulty: 'easy',
    applies: (i) => ['heavy_meat', 'medium_meat'].includes(i.diet?.dietType),
    apply: (i) => withPath(i, 'diet.dietType', (v) => (v === 'heavy_meat' ? 'medium_meat' : 'low_meat'))
  },
  {
    id: 'shift_to_vegetarian',
    category: 'diet',
    title: 'Try a mostly-vegetarian diet for a month',
    difficulty: 'medium',
    applies: (i) => !['vegan', 'vegetarian'].includes(i.diet?.dietType),
    apply: (i) => withPath(i, 'diet.dietType', () => 'vegetarian')
  },
  {
    id: 'start_composting',
    category: 'waste',
    title: 'Compost kitchen waste instead of sending it to landfill',
    difficulty: 'easy',
    applies: (i) => num(i.waste?.compostingPercent) < 30,
    apply: (i) => withPath(i, 'waste.compostingPercent', (v) => Math.min(100, num(v) + 30))
  },
  {
    id: 'improve_recycling',
    category: 'waste',
    title: 'Segregate and recycle paper, plastic and glass',
    difficulty: 'easy',
    applies: (i) => num(i.waste?.recyclingPercent) < 50,
    apply: (i) => withPath(i, 'waste.recyclingPercent', (v) => Math.min(100, num(v) + 25))
  }
];

function generateInsights(rawInput) {
  const before = calculateTotal(rawInput);
  const categoryLabels = { transport: 'Transport', electricity: 'Electricity', diet: 'Diet', waste: 'Waste' };

  const dominantCategory = Object.entries(before.breakdown).sort((a, b) => b[1] - a[1])[0][0];

  const recommendations = ACTIONS
    .filter((action) => action.applies(rawInput))
    .map((action) => {
      const modifiedInput = action.apply(rawInput);
      const after = calculateTotal(modifiedInput);
      const impactKg = round2(Math.max(0, before.totalKgPerYear - after.totalKgPerYear));
      return {
        id: action.id,
        category: action.category,
        title: action.title,
        difficulty: action.difficulty,
        estimatedImpactKgPerYear: impactKg
      };
    })
    .filter((r) => r.estimatedImpactKgPerYear > 0)
    .sort((a, b) => b.estimatedImpactKgPerYear - a.estimatedImpactKgPerYear)
    .slice(0, 5);

  const benchmarkMessage = buildBenchmarkMessage(before);
  const nextQuestion = buildNextQuestion(dominantCategory, recommendations, categoryLabels);

  return {
    totals: before,
    dominantCategory,
    dominantCategoryLabel: categoryLabels[dominantCategory],
    recommendations,
    benchmarkMessage,
    assistantMessage: buildAssistantMessage(before, dominantCategory, categoryLabels, recommendations),
    nextQuestion
  };
}

function buildBenchmarkMessage(totals) {
  const tonnes = totals.totalTonnesPerYear;
  const { india_avg_annual_tonnes, global_avg_annual_tonnes, paris_aligned_target_annual_tonnes } = totals.benchmarks;

  if (tonnes <= paris_aligned_target_annual_tonnes) {
    return `Your estimated footprint of ${tonnes} t CO2e/year is already at or below the ${paris_aligned_target_annual_tonnes} t target widely cited for a 1.5°C-aligned lifestyle. Great baseline - focus on holding steady.`;
  }
  if (tonnes <= india_avg_annual_tonnes) {
    return `Your estimated footprint of ${tonnes} t CO2e/year is below the India average (~${india_avg_annual_tonnes} t), but above the ${paris_aligned_target_annual_tonnes} t target. A few targeted changes can close the gap.`;
  }
  if (tonnes <= global_avg_annual_tonnes) {
    return `Your estimated footprint of ${tonnes} t CO2e/year is above the India average (~${india_avg_annual_tonnes} t) but below the global average (~${global_avg_annual_tonnes} t).`;
  }
  return `Your estimated footprint of ${tonnes} t CO2e/year is above both the India average (~${india_avg_annual_tonnes} t) and the global average (~${global_avg_annual_tonnes} t). The recommendations below are ranked by impact to help bring this down fastest.`;
}

function buildAssistantMessage(totals, dominantCategory, labels, recommendations) {
  const share = Math.round((totals.breakdown[dominantCategory] / totals.totalKgPerYear) * 100) || 0;
  const top = recommendations[0];
  let msg = `${labels[dominantCategory]} is your biggest contributor, at roughly ${share}% of your total footprint.`;
  if (top) {
    msg += ` The single highest-impact change available to you is: "${top.title}" - an estimated ${formatKg(top.estimatedImpactKgPerYear)} saved per year.`;
  }
  return msg;
}

function buildNextQuestion(dominantCategory, recommendations, labels) {
  if (recommendations.length === 0) {
    return `You're already doing well across the board. Want to log this month's numbers so we can track your trend over time?`;
  }
  const top = recommendations[0];
  const questionsByCategory = {
    transport: `Want to see how your footprint changes if you try "${top.title}" for the next 4 weeks?`,
    electricity: `Would switching part of your electricity to renewables change your ranking vs the India average? Want to simulate it?`,
    diet: `Curious how much "${top.title}" alone would save you per year? It's about ${formatKg(top.estimatedImpactKgPerYear)}.`,
    waste: `Most households underestimate waste-related emissions. Want a 3-step plan to start composting this week?`
  };
  return questionsByCategory[dominantCategory] || `Want a step-by-step plan for "${top.title}"?`;
}

// --- helpers -------------------------------------------------------------

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatKg(kg) {
  if (kg >= 1000) return `${round2(kg / 1000)} t`;
  return `${round2(kg)} kg`;
}

function avgTripKm(input) {
  // Rough average one-way commute distance used only to size the "skip N trips" simulation.
  const weekly = num(input.transport?.carKmPerWeek);
  return weekly > 0 ? Math.min(20, weekly / 6) : 10;
}

/** Returns a deep-enough clone of input with `path` (e.g. "diet.dietType") replaced by updater(currentValue). */
function withPath(input, path, updater) {
  const clone = JSON.parse(JSON.stringify(input || {}));
  const [section, key] = path.split('.');
  clone[section] = clone[section] || {};
  clone[section][key] = updater(clone[section][key]);
  return clone;
}

module.exports = { generateInsights, ACTIONS };
