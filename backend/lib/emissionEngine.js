'use strict';

const factors = require('../data/factors.json');
const { num, round2 } = require('./utils');

/**
 * All functions here are pure (no I/O, no side effects) so they are easy to
 * unit test and reuse from the API layer, a CLI, or a future mobile client.
 */

/**
 * @param {object} input
 *  carKmPerWeek, carFuel ('petrol'|'diesel'|'cng'|'electric')
 *  twoWheelerKmPerWeek
 *  publicTransitKmPerWeek, publicTransitMode ('bus'|'train'|'metro')
 *  flightsShortHaulPerYear, flightsLongHaulPerYear
 */
function calculateTransport(input = {}) {
  const f = factors.transport;
  const carFactorKey = `car_${input.carFuel || 'petrol'}_km`;
  const carFactor = f[carFactorKey] ?? f.car_petrol_km;
  const transitFactorKey = `${input.publicTransitMode || 'bus'}_km`;
  const transitFactor = f[transitFactorKey] ?? f.bus_km;

  const carAnnualKm = num(input.carKmPerWeek) * 52;
  const twoWheelerAnnualKm = num(input.twoWheelerKmPerWeek) * 52;
  const transitAnnualKm = num(input.publicTransitKmPerWeek) * 52;

  const carKg = carAnnualKm * carFactor;
  const twoWheelerKg = twoWheelerAnnualKm * f.two_wheeler_km;
  const transitKg = transitAnnualKm * transitFactor;
  const shortFlightsKg = num(input.flightsShortHaulPerYear) * 1500 * f.flight_short_haul_km;
  const longFlightsKg = num(input.flightsLongHaulPerYear) * 6000 * f.flight_long_haul_km;

  return round2(carKg + twoWheelerKg + transitKg + shortFlightsKg + longFlightsKg);
}

/**
 * @param {object} input  monthlyKwh, renewablePercent (0-100)
 */
function calculateElectricity(input = {}) {
  const f = factors.electricity;
  const monthlyKwh = num(input.monthlyKwh);
  const renewablePct = Math.min(100, Math.max(0, num(input.renewablePercent)));
  const renewableShare = renewablePct / 100;

  const annualKwh = monthlyKwh * 12;
  const renewableKg = annualKwh * renewableShare * f.renewable_kg_per_kwh;
  const gridKg = annualKwh * (1 - renewableShare) * f.grid_kg_per_kwh;

  return round2(renewableKg + gridKg);
}

/**
 * @param {object} input  dietType ('vegan'|'vegetarian'|'pescatarian'|'low_meat'|'medium_meat'|'heavy_meat')
 */
function calculateDiet(input = {}) {
  const f = factors.diet;
  const key = `${input.dietType || 'medium_meat'}_daily_kg`;
  const dailyKg = f[key] ?? f.medium_meat_daily_kg;
  return round2(dailyKg * 365);
}

/**
 * @param {object} input  wasteKgPerWeek, recyclingPercent, compostingPercent
 */
function calculateWaste(input = {}) {
  const f = factors.waste;
  const weeklyKg = num(input.wasteKgPerWeek);
  const recyclePct = Math.min(100, Math.max(0, num(input.recyclingPercent)));
  const compostPct = Math.min(100, Math.max(0, num(input.compostingPercent)));
  const landfillPct = Math.max(0, 100 - recyclePct - compostPct);

  const annualKg = weeklyKg * 52;
  const recycledKg = annualKg * (recyclePct / 100) * f.recycled_kg_per_kg;
  const compostedKg = annualKg * (compostPct / 100) * f.composted_kg_per_kg;
  const landfillKg = annualKg * (landfillPct / 100) * f.landfill_kg_per_kg;

  return round2(recycledKg + compostedKg + landfillKg);
}

function calculateTotal(input = {}) {
  const transport = calculateTransport(input.transport);
  const electricity = calculateElectricity(input.electricity);
  const diet = calculateDiet(input.diet);
  const waste = calculateWaste(input.waste);

  const totalKg = round2(transport + electricity + diet + waste);

  return {
    breakdown: { transport, electricity, diet, waste },
    totalKgPerYear: totalKg,
    totalTonnesPerYear: round2(totalKg / 1000),
    benchmarks: factors.benchmarks
  };
}

module.exports = {
  calculateTransport,
  calculateElectricity,
  calculateDiet,
  calculateWaste,
  calculateTotal
};
