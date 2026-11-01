import assert from 'assert';
import { searchAirports, getAirportByCode } from '../src/data/airports.ts';
import { predictFlightFare, detectIndianFestivalPeak, FPPS_MODEL_METADATA } from '../src/ml/model.ts';
import { getRouteAnalytics, evaluatePriceIntelligence } from '../src/data/analytics.ts';
import { generateFlightOffers } from '../src/services/flightEngine.ts';

console.log('--- Running FPPS Automated Test Suite ---');

// Test 1: Airport Search & Retrieval
console.log('1. Testing Airport Database & Search...');
const del = getAirportByCode('DEL');
assert.strictEqual(del?.city, 'New Delhi', 'DEL city should be New Delhi');
assert.strictEqual(del?.isDomestic, true, 'DEL should be domestic');

const bomResults = searchAirports('Mumbai');
assert.ok(bomResults.some(a => a.code === 'BOM'), 'Search for Mumbai should return BOM');

const dxb = getAirportByCode('DXB');
assert.strictEqual(dxb?.isDomestic, false, 'DXB should be international');
console.log('✓ Airport tests passed.');

// Test 2: Machine Learning Price Prediction
console.log('2. Testing ML Airfare Prediction Engine...');
const predEconomy = predictFlightFare({
  origin: 'DEL',
  destination: 'BOM',
  travelDate: '2026-11-20',
  cabinClass: 'economy',
  airline: 'IndiGo',
  stops: 0,
  departureHour: 8
});

assert.ok(predEconomy.predictedFare > 2000, 'Predicted fare should be realistic (> ₹2000)');
assert.ok(predEconomy.lowerBoundFare < predEconomy.predictedFare, 'Lower bound should be less than predicted');
assert.ok(predEconomy.upperBoundFare > predEconomy.predictedFare, 'Upper bound should be greater than predicted');
assert.ok(predEconomy.factors.length > 0, 'Should include factor decomposition');
assert.strictEqual(predEconomy.modelVersion, FPPS_MODEL_METADATA.modelVersion, 'Model version should match metadata');

// Cabin class multiplier test
const predBusiness = predictFlightFare({
  origin: 'DEL',
  destination: 'BOM',
  travelDate: '2026-11-20',
  cabinClass: 'business',
  airline: 'Air India',
  stops: 0,
  departureHour: 8
});
assert.ok(predBusiness.predictedFare > predEconomy.predictedFare * 2, 'Business class should be substantially higher than economy');

// Festival peak detection
const diwaliCheck = detectIndianFestivalPeak('2026-11-05');
assert.strictEqual(diwaliCheck.isPeak, true, 'November 5th should trigger Diwali / Chhath peak surge');
console.log('✓ ML prediction tests passed.');

// Test 3: Historical Fare Analytics
console.log('3. Testing Historical Corridor Analytics...');
const analytics = getRouteAnalytics('DEL', 'BOM');
assert.strictEqual(analytics.route, 'DEL-BOM', 'Route should be DEL-BOM');
assert.strictEqual(analytics.currency, 'INR', 'Currency must be INR');
assert.strictEqual(analytics.trend30Days.length, 31, 'Should contain 31 days of trend points');
assert.ok(analytics.airlineComparison.length >= 4, 'Should contain comparisons for major carriers');
assert.ok(analytics.bookingWindowCurve.length > 0, 'Should contain booking window sweet-spot points');
console.log('✓ Historical analytics tests passed.');

// Test 4: Price Intelligence Benchmark
console.log('4. Testing Price Intelligence Categorization...');
const lowFareCheck = evaluatePriceIntelligence({
  origin: 'DEL',
  destination: 'BOM',
  fareInr: 3500 // Significantly below base 4950
});
assert.strictEqual(lowFareCheck.assessment, 'RELATIVELY_LOW', '₹3,500 on DEL-BOM should be classified as RELATIVELY_LOW');
assert.ok(lowFareCheck.savingsVsAvgInr! > 0, 'Should compute savings vs route average');

const highFareCheck = evaluatePriceIntelligence({
  origin: 'DEL',
  destination: 'BOM',
  fareInr: 8500 // High surge
});
assert.strictEqual(highFareCheck.assessment, 'RELATIVELY_HIGH', '₹8,500 on DEL-BOM should be classified as RELATIVELY_HIGH');
console.log('✓ Price intelligence tests passed.');

// Test 5: Flight Offers Engine & Sorting
console.log('5. Testing Flight Generation & Offer Normalization...');
const offers = generateFlightOffers({
  origin: 'DEL',
  destination: 'BLR',
  departureDate: '2026-11-15',
  passengers: 1,
  cabinClass: 'economy'
});
assert.ok(offers.length >= 8, 'Should generate multiple scheduled flight offers');
assert.ok(offers[0].fare > 0, 'Offer fare must be positive');
assert.strictEqual(offers[0].currency, 'INR', 'Currency must be INR');
assert.ok(offers[0].fareRestrictions.baggageCabinKg > 0, 'Baggage allowance should be set');
console.log('✓ Flight offers engine tests passed.');

console.log('\n=============================================');
console.log('ALL FPPS TEST SUITES PASSED CLEANLY (5/5)');
console.log('=============================================\n');
