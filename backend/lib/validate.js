'use strict';

const MAX_NUMERIC = 1_000_000; // sanity ceiling, prevents overflow / abuse via absurd values
const ALLOWED_CAR_FUEL = ['petrol', 'diesel', 'cng', 'electric'];
const ALLOWED_TRANSIT_MODE = ['bus', 'train', 'metro'];
const ALLOWED_DIET = ['vegan', 'vegetarian', 'pescatarian', 'low_meat', 'medium_meat', 'heavy_meat'];

function isFiniteNumberInRange(value, min = 0, max = MAX_NUMERIC) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

/**
 * Validates the shape the frontend sends to /api/calculate and /api/insights.
 * Returns { valid: boolean, errors: string[] } - never throws.
 */
function validateFootprintInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const { transport = {}, electricity = {}, diet = {}, waste = {} } = body;

  const numericFields = [
    [transport.carKmPerWeek, 'transport.carKmPerWeek', 0, 5000],
    [transport.twoWheelerKmPerWeek, 'transport.twoWheelerKmPerWeek', 0, 5000],
    [transport.publicTransitKmPerWeek, 'transport.publicTransitKmPerWeek', 0, 5000],
    [transport.flightsShortHaulPerYear, 'transport.flightsShortHaulPerYear', 0, 100],
    [transport.flightsLongHaulPerYear, 'transport.flightsLongHaulPerYear', 0, 100],
    [electricity.monthlyKwh, 'electricity.monthlyKwh', 0, 20000],
    [electricity.renewablePercent, 'electricity.renewablePercent', 0, 100],
    [waste.wasteKgPerWeek, 'waste.wasteKgPerWeek', 0, 1000],
    [waste.recyclingPercent, 'waste.recyclingPercent', 0, 100],
    [waste.compostingPercent, 'waste.compostingPercent', 0, 100]
  ];

  for (const [value, name, min, max] of numericFields) {
    if (value !== undefined && !isFiniteNumberInRange(value, min, max)) {
      errors.push(`${name} must be a number between ${min} and ${max}.`);
    }
  }

  if (transport.carFuel !== undefined && !ALLOWED_CAR_FUEL.includes(transport.carFuel)) {
    errors.push(`transport.carFuel must be one of: ${ALLOWED_CAR_FUEL.join(', ')}.`);
  }
  if (transport.publicTransitMode !== undefined && !ALLOWED_TRANSIT_MODE.includes(transport.publicTransitMode)) {
    errors.push(`transport.publicTransitMode must be one of: ${ALLOWED_TRANSIT_MODE.join(', ')}.`);
  }
  if (diet.dietType !== undefined && !ALLOWED_DIET.includes(diet.dietType)) {
    errors.push(`diet.dietType must be one of: ${ALLOWED_DIET.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidAnonymousId(id) {
  return typeof id === 'string' && UUID_V4_RE.test(id);
}

module.exports = { validateFootprintInput, isValidAnonymousId };
