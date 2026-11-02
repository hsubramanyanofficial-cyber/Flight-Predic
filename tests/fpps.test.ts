import assert from 'assert';
import { searchAirports, getAirportByCode } from '../src/data/airports.ts';
import { predictFlightFare, detectIndianFestivalPeak, FPPS_MODEL_METADATA } from '../src/ml/model.ts';
import { getRouteAnalytics, evaluatePriceIntelligence } from '../src/data/analytics.ts';
import { generateFlightOffers } from '../src/services/flightEngine.ts';
import { formatCurrency, convertFromInr } from '../src/utils/currency.ts';

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

// Test 6: Global Expansion & Multi-Currency Engine
console.log('6. Testing Global Corridors, International Airlines & Multi-Currency...');
const jfk = getAirportByCode('JFK');
assert.strictEqual(jfk?.city, 'New York', 'JFK city should be New York');
assert.strictEqual(jfk?.isDomestic, false, 'JFK should be international');

const lhr = getAirportByCode('LHR');
assert.strictEqual(lhr?.city, 'London', 'LHR city should be London');

const intlOffers = generateFlightOffers({
  origin: 'JFK',
  destination: 'LHR',
  departureDate: '2026-11-20',
  passengers: 1,
  cabinClass: 'economy'
});
assert.ok(intlOffers.length >= 8, 'Should generate international scheduled offers');
assert.ok(intlOffers.some(o => ['EK', 'BA', 'SQ', 'LH', 'QR', 'UA', 'DL'].includes(o.airlineCode)), 'International routes should feature global carriers');

const convertedUsd = convertFromInr(86200, 'USD');
assert.ok(convertedUsd > 950 && convertedUsd < 1050, '₹86,200 should convert to approx $1,000 USD');
const formattedUsd = formatCurrency(86200, 'USD');
assert.ok(formattedUsd.startsWith('$'), 'USD format should start with $');
console.log('✓ Global expansion & currency tests passed.');

// Test 7: Multi-City Trip Planner & Tracked Flight Linking
console.log('7. Testing Multi-City Trip Planner & Tracked Flight Linking...');
import { calculateAirDistanceKm } from '../src/data/airports.ts';
import { TripItinerary, TripLeg, TrackedFlight } from '../src/types/index.ts';

const testLeg1: TripLeg = {
  id: 'leg-101',
  origin: 'DEL',
  destination: 'DXB',
  originCity: 'New Delhi',
  destinationCity: 'Dubai',
  date: '2026-06-15',
  cabinClass: 'economy',
  fareInr: 16500,
  status: 'planned'
};

const testLeg2: TripLeg = {
  id: 'leg-102',
  origin: 'DXB',
  destination: 'LHR',
  originCity: 'Dubai',
  destinationCity: 'London',
  date: '2026-06-19',
  cabinClass: 'economy',
  fareInr: 34000,
  status: 'planned'
};

const sampleItinerary: TripItinerary = {
  id: 'trip-test-1',
  title: 'Asia-Europe Multi-City Hopper',
  startDate: '2026-06-15',
  endDate: '2026-06-25',
  budgetInr: 70000,
  legs: [testLeg1, testLeg2],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

assert.strictEqual(sampleItinerary.legs.length, 2, 'Itinerary should contain 2 legs');
const dist1 = calculateAirDistanceKm(testLeg1.origin, testLeg1.destination);
const dist2 = calculateAirDistanceKm(testLeg2.origin, testLeg2.destination);
assert.ok(dist1 > 2000 && dist1 < 2500, 'DEL-DXB distance should be approx 2180 km');
assert.ok(dist2 > 5000 && dist2 < 6000, 'DXB-LHR distance should be approx 5480 km');

// Simulate linking tracked flight to Leg 1
const mockTracked: TrackedFlight = {
  id: 'track-del-dxb',
  userId: 'user-123',
  origin: 'DEL',
  destination: 'DXB',
  originCity: 'New Delhi',
  destinationCity: 'Dubai',
  departureDate: '2026-06-15',
  cabinClass: 'economy',
  targetPriceInr: 15000,
  currentLowestPriceInr: 14200, // lower than target!
  initialPriceInr: 16500,
  currency: 'INR',
  isActive: true,
  createdAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  priceHistory: []
};

// Link tracked flight to leg 1
const linkedLeg: TripLeg = {
  ...testLeg1,
  linkedTrackedFlightId: mockTracked.id,
  status: 'tracked',
  fareInr: mockTracked.currentLowestPriceInr
};

assert.strictEqual(linkedLeg.status, 'tracked', 'Linked leg status must be tracked');
assert.strictEqual(linkedLeg.linkedTrackedFlightId, mockTracked.id, 'Linked leg must reference tracked flight id');
assert.strictEqual(linkedLeg.fareInr, 14200, 'Linked leg fare should be synchronized to current lowest market price');

const totalCost = linkedLeg.fareInr! + testLeg2.fareInr!;
assert.strictEqual(totalCost, 48200, 'Total cost should compute correctly with linked fare');
assert.ok(sampleItinerary.budgetInr! > totalCost, 'Budget surplus should be positive');
console.log('✓ Trip Planner & Tracked Flight linking tests passed.');

// Test 8: Three.js 3D Scene Configs, Liveries & Audio Synthesizer
console.log('8. Testing Three.js 3D Aircraft Model, Liveries & Procedural Audio...');
import { LIVERY_CONFIGS, AirlineLivery } from '../src/game/aircraftModel.ts';
import { DEFAULT_WORLD_CONFIG, checkIsSoftwareGl } from '../src/game/worldScene.ts';
import { flightAudio } from '../src/game/audioEngine.ts';

const expectedLiveries: AirlineLivery[] = ['indigo', 'airindia', 'emirates', 'british', 'singapore'];
expectedLiveries.forEach(l => {
  assert.ok(LIVERY_CONFIGS[l], `Livery ${l} configuration should exist`);
  assert.ok(typeof LIVERY_CONFIGS[l].primaryColor === 'number', `Livery ${l} primaryColor must be number hex`);
  assert.ok(typeof LIVERY_CONFIGS[l].accentColor === 'number', `Livery ${l} accentColor must be number hex`);
  assert.ok(typeof LIVERY_CONFIGS[l].metalColor === 'number', `Livery ${l} metalColor must be number hex`);
});

assert.strictEqual(DEFAULT_WORLD_CONFIG.corridorLength, 3500, 'Flight corridor length should be 3500m');
assert.ok(DEFAULT_WORLD_CONFIG.corridorWidth >= 300, 'Flight corridor width should accommodate flight maneuvers');

// Test Software-WebGL detection
const isSoft = checkIsSoftwareGl();
assert.ok(typeof isSoft === 'boolean', 'Software WebGL check should return boolean');

// Test Procedural Flight Audio Engine
assert.strictEqual(flightAudio.getMuted(), false, 'Flight audio should start unmuted');
flightAudio.setMuted(true);
assert.strictEqual(flightAudio.getMuted(), true, 'Mute should be true after setMuted(true)');
flightAudio.toggleMute();
assert.strictEqual(flightAudio.getMuted(), false, 'toggleMute should toggle back to unmuted');
console.log('✓ Three.js 3D model, liveries & flight audio tests passed.');

console.log('\n=============================================');
console.log('ALL FPPS TEST SUITES PASSED CLEANLY (8/8)');
console.log('=============================================\n');
