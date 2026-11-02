export type CabinClass = 'economy' | 'premium_economy' | 'business';
export type { SupportedCurrency } from '../utils/currency';

export interface Airport {
  code: string;
  name: string;
  city: string;
  stateOrCountry: string;
  country: string;
  isDomestic: boolean;
  tier?: 1 | 2 | 3;
}

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string; // ISO string
  arrivalTime: string;   // ISO string
  durationMinutes: number;
}

export interface FareRestriction {
  refundable: boolean;
  cancellationFee: number; // in INR
  rescheduleFee: number;   // in INR
  baggageCabinKg: number;
  baggageCheckinKg: number;
  mealIncluded: boolean;
  seatSelectionFee: number;
}

export interface FlightOffer {
  id: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopAirports?: string[];
  cabinClass: CabinClass;
  fare: number; // In INR (₹)
  baseFare: number;
  taxesAndFees: number;
  currency: 'INR';
  provider: 'Amadeus' | 'AviationStack' | 'GoogleFlights' | 'SandboxEngine';
  isLivePrice: boolean;
  observationTimestamp: string;
  fareRestrictions: FareRestriction;
  bookingUrl?: string;
  seatsRemaining?: number;
  onTimePerformance?: number; // e.g. 88 (%)
}

export interface PredictionFactor {
  factor: string;
  impactInr: number; // positive = increased price, negative = decreased price
  description: string;
}

export interface PricePrediction {
  route: string;
  origin: string;
  destination: string;
  travelDate: string;
  cabinClass: CabinClass;
  predictedFare: number; // In INR
  lowerBoundFare: number; // 90% confidence lower bound
  upperBoundFare: number; // 90% confidence upper bound
  meanMarketFare: number;
  confidenceScore: number; // 0 to 1
  modelVersion: string;
  predictionTimestamp: string;
  features: {
    daysToDeparture: number;
    dayOfWeek: string;
    departureSlot: string;
    stops: number;
    airline: string;
    isFestivalPeak: boolean;
    seasonalityIndex: number;
  };
  factors: PredictionFactor[];
  advice: 'BUY_NOW' | 'WAIT' | 'FAIR_PRICE';
  comparisonWithActual?: {
    actualFare: number;
    deltaInr: number;
    percentageDelta: number;
  };
}

export type PriceAssessment = 'RELATIVELY_LOW' | 'NEAR_TYPICAL_RANGE' | 'RELATIVELY_HIGH' | 'INSUFFICIENT_DATA';

export interface PriceIntelligence {
  assessment: PriceAssessment;
  percentile: number; // 0 to 100
  historicalMean: number;
  sampleSize: number;
  comparisonPeriod: string;
  explanation: string;
  savingsVsAvgInr?: number;
}

export interface HistoricalTrendPoint {
  date: string;
  avgFare: number;
  minFare: number;
  maxFare: number;
  observationsCount: number;
}

export interface AirlineStat {
  airlineCode: string;
  airlineName: string;
  avgFare: number;
  minFare: number;
  sampleCount: number;
  onTimeRating: number;
}

export interface RouteAnalytics {
  route: string;
  origin: string;
  destination: string;
  observationCount: number;
  lastUpdated: string;
  currency: 'INR';
  overallMeanFare: number;
  overallMinFare: number;
  overallMaxFare: number;
  trend30Days: HistoricalTrendPoint[];
  airlineComparison: AirlineStat[];
  priceDistribution: { range: string; count: number; percentage: number }[];
  dayOfWeekAverages: { day: string; avgFare: number }[];
  bookingWindowCurve: { daysOut: number; avgFare: number; recommendation: string }[];
}

export interface TrackedFlight {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  cabinClass: CabinClass;
  targetPriceInr: number;
  currentLowestPriceInr: number;
  initialPriceInr: number;
  currency: 'INR';
  isActive: boolean;
  createdAt: string;
  lastCheckedAt: string;
  preferredAirline?: string;
  priceHistory: { timestamp: string; price: number; airline: string }[];
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'PRICE_DROP' | 'TARGET_MET' | 'PREDICTION_UPDATE' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  route?: string;
  linkTab?: string;
  savingsInr?: number;
}

export interface UserPreferences {
  userId: string;
  displayName: string;
  email: string;
  homeAirport: string;
  preferredAirlines: string[];
  maxStops: number;
  defaultCabinClass: CabinClass;
  budgetAlertThresholdPercent: number; // e.g. 10%
  inAppAlerts: boolean;
  emailAlerts: boolean;
  theme: 'dark' | 'light';
}

export interface RecommendationOffer {
  offer: FlightOffer;
  score: number; // 0 to 100
  category: 'BEST_VALUE' | 'FASTEST' | 'BUDGET_PICK' | 'LOYALTY_CHOICE';
  rationale: string;
  priceIntelligence: PriceIntelligence;
  prediction?: PricePrediction;
}

export interface TripLeg {
  id: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  date: string; // YYYY-MM-DD
  flightNumber?: string;
  airlineName?: string;
  departureTime?: string;
  arrivalTime?: string;
  cabinClass: CabinClass;
  linkedTrackedFlightId?: string;
  fareInr?: number;
  notes?: string;
  status: 'planned' | 'tracked' | 'booked';
}

export interface PackingItem {
  id: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'essentials' | 'destination_specific';
  name: string;
  quantity?: number;
  packed: boolean;
  isEssential: boolean;
  notes?: string;
}

export interface PackingChecklistData {
  destinationClimate: string;
  weatherSummary: string;
  recommendedDressCode: string;
  durationDays: number;
  tripType?: 'leisure' | 'business' | 'adventure' | 'beach' | 'winter' | 'cultural';
  items: PackingItem[];
  lastGeneratedAt: string;
}

export interface AirlineBaggageRule {
  airlineCode: string;
  airlineName: string;
  isDomesticDefault: boolean;
  cabinAllowanceKg: {
    economy: number;
    premium_economy?: number;
    business: number;
  };
  checkInAllowanceKg: {
    economy: number;
    premium_economy?: number;
    business: number;
  };
  cabinPieces: number;
  maxPieceWeightKg: number;
  excessRatePerKgAirportInr: number;
  prebookTiersInr: {
    plus3kg?: number;
    plus5kg: number;
    plus10kg: number;
    plus15kg: number;
    plus30kg?: number;
  };
  internationalConcept?: 'weight' | 'piece';
  extraPieceRateInr?: number;
  specialEquipmentFeeInr: number;
  notes: string;
}

export interface LegBaggageEstimate {
  legId: string;
  airlineName: string;
  cabinClass: CabinClass;
  isDomestic: boolean;
  checkedBagsCount: number;
  totalCheckedWeightKg: number;
  carryOnBagsCount: number;
  carryOnWeightKg: number;
  specialEquipment?: string;
  freeCheckInKg: number;
  freeCabinKg: number;
  excessCheckInKg: number;
  excessCabinKg: number;
  prebookFeeInr: number;
  airportFeeInr: number;
  savingsByPrebookingInr: number;
  isWithinAllowance: boolean;
  warnings: string[];
}

export interface TripItinerary {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  budgetInr?: number;
  legs: TripLeg[];
  packingChecklist?: PackingChecklistData;
  baggageEstimates?: Record<string, LegBaggageEstimate>;
  createdAt: string;
  updatedAt: string;
}
