import { FlightOffer, CabinClass, Airport } from '../types';
import { getAirportByCode } from '../data/airports';
import { estimateRouteBase } from '../ml/model';

export interface SearchFlightParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  maxStops?: number;
  airline?: string;
  sortBy?: 'price' | 'duration' | 'departure' | 'recommended';
}

const DOMESTIC_AIRLINES = [
  { code: '6E', name: 'IndiGo', aircrafts: ['Airbus A320neo', 'Airbus A321neo'], punctuality: 88.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'AI', name: 'Air India', aircrafts: ['Airbus A350-900', 'Boeing 787-8', 'Airbus A320neo'], punctuality: 82.0, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 25 },
  { code: 'UK', name: 'Vistara', aircrafts: ['Airbus A321neo', 'Boeing 787-9', 'Airbus A320neo'], punctuality: 89.8, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 20 },
  { code: 'QP', name: 'Akasa Air', aircrafts: ['Boeing 737 MAX 8'], punctuality: 87.2, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'SG', name: 'SpiceJet', aircrafts: ['Boeing 737-800', 'De Havilland Q400'], punctuality: 74.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'IX', name: 'Air India Express', aircrafts: ['Boeing 737 MAX 8', 'Airbus A320'], punctuality: 81.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 }
];

const INTERNATIONAL_AIRLINES = [
  { code: 'EK', name: 'Emirates', aircrafts: ['Boeing 777-300ER', 'Airbus A380-800'], punctuality: 91.2, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 30 },
  { code: 'SQ', name: 'Singapore Airlines', aircrafts: ['Airbus A350-900', 'Boeing 787-10'], punctuality: 93.4, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 30 },
  { code: 'QR', name: 'Qatar Airways', aircrafts: ['Airbus A350-1000', 'Boeing 777-300ER'], punctuality: 92.1, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 30 },
  { code: 'BA', name: 'British Airways', aircrafts: ['Boeing 787-9', 'Airbus A350-1000'], punctuality: 84.6, hasMealsFree: true, baggageCabin: 8, baggageCheckin: 23 },
  { code: 'LH', name: 'Lufthansa', aircrafts: ['Boeing 747-8 Intercontinental', 'Airbus A350-900'], punctuality: 86.8, hasMealsFree: true, baggageCabin: 8, baggageCheckin: 23 },
  { code: 'UA', name: 'United Airlines', aircrafts: ['Boeing 787-9 Dreamliner', 'Boeing 777-300ER'], punctuality: 83.2, hasMealsFree: true, baggageCabin: 9, baggageCheckin: 23 },
  { code: 'DL', name: 'Delta Air Lines', aircrafts: ['Airbus A350-900', 'Airbus A330-900neo'], punctuality: 89.0, hasMealsFree: true, baggageCabin: 9, baggageCheckin: 23 },
  { code: 'AF', name: 'Air France', aircrafts: ['Airbus A350-900', 'Boeing 777-300ER'], punctuality: 85.3, hasMealsFree: true, baggageCabin: 8, baggageCheckin: 23 },
  { code: 'AI', name: 'Air India', aircrafts: ['Airbus A350-900', 'Boeing 787-8'], punctuality: 82.0, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 25 },
  { code: 'QF', name: 'Qantas', aircrafts: ['Boeing 787-9 Dreamliner', 'Airbus A330-300'], punctuality: 87.5, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 30 },
  { code: 'NH', name: 'All Nippon Airways (ANA)', aircrafts: ['Boeing 787-9', 'Boeing 777-300ER'], punctuality: 94.2, hasMealsFree: true, baggageCabin: 10, baggageCheckin: 46 }
];

export function generateFlightOffers(params: SearchFlightParams): FlightOffer[] {
  const { origin, destination, departureDate, cabinClass } = params;
  const originAirport: Airport = getAirportByCode(origin) || { code: origin, name: `${origin} Airport`, city: origin, stateOrCountry: origin, country: 'International', isDomestic: false };
  const destAirport: Airport = getAirportByCode(destination) || { code: destination, name: `${destination} Airport`, city: destination, stateOrCountry: destination, country: 'International', isDomestic: false };
  
  const isDomesticRoute = originAirport.isDomestic && destAirport.isDomestic;
  const airlinePool = isDomesticRoute ? DOMESTIC_AIRLINES : INTERNATIONAL_AIRLINES;

  const base = estimateRouteBase(origin, destination);
  const baseDistKm = base.distanceKm;
  // Cruise speed approx 850 km/h + taxi/approach
  const baseTravelMinutes = Math.max(55, Math.round((baseDistKm / 850) * 60 + 40));
  
  const offers: FlightOffer[] = [];
  const scheduleSlots = isDomesticRoute
    ? [
        { hour: 6, min: 15, stops: 0 },
        { hour: 7, min: 45, stops: 0 },
        { hour: 9, min: 30, stops: 0 },
        { hour: 11, min: 20, stops: 1, layover: 'HYD' },
        { hour: 13, min: 10, stops: 0 },
        { hour: 15, min: 45, stops: 1, layover: 'BOM' },
        { hour: 17, min: 30, stops: 0 },
        { hour: 19, min: 15, stops: 0 },
        { hour: 20, min: 50, stops: 0 },
        { hour: 22, min: 30, stops: 0 }
      ]
    : [
        { hour: 2, min: 20, stops: 0 },
        { hour: 5, min: 45, stops: 1, layover: 'DXB' },
        { hour: 8, min: 15, stops: 0 },
        { hour: 11, min: 30, stops: 1, layover: 'DOH' },
        { hour: 14, min: 10, stops: 0 },
        { hour: 16, min: 50, stops: 1, layover: 'SIN' },
        { hour: 19, min: 25, stops: 0 },
        { hour: 21, min: 40, stops: 1, layover: 'LHR' },
        { hour: 23, min: 15, stops: 0 }
      ];

  scheduleSlots.forEach((slot, index) => {
    const airline = airlinePool[index % airlinePool.length];
    const flightNum = `${airline.code}-${100 + index * 47}`;
    
    // Departure and arrival timestamps
    const depTime = new Date(`${departureDate}T${String(slot.hour).padStart(2, '0')}:${String(slot.min).padStart(2, '0')}:00`);
    const durationMins = slot.stops === 0 ? baseTravelMinutes + (index % 3) * 5 : baseTravelMinutes + 120;
    const arrTime = new Date(depTime.getTime() + durationMins * 60 * 1000);

    // Price calculation
    let priceMultiplier = 1.0;
    if (slot.hour >= 7 && slot.hour <= 10) priceMultiplier += 0.12;
    if (slot.hour >= 17 && slot.hour <= 20) priceMultiplier += 0.15;
    if (slot.hour >= 22 || slot.hour < 5) priceMultiplier -= 0.08;
    if (slot.stops > 0) priceMultiplier -= 0.15;

    if (airline.hasMealsFree) priceMultiplier += 0.08;
    if (cabinClass === 'premium_economy') priceMultiplier *= 1.85;
    if (cabinClass === 'business') priceMultiplier *= 3.4;

    // Natural variation
    const variation = ((index * 211) % 900) - 450;
    const calculatedFare = Math.max(1800, Math.round((base.baseFare * priceMultiplier + variation) / 50) * 50);
    const taxes = Math.round(calculatedFare * 0.16);
    const baseFareOnly = calculatedFare - taxes;

    const aircraftModel = airline.aircrafts[index % airline.aircrafts.length];

    offers.push({
      id: `flt_${origin.toLowerCase()}_${destination.toLowerCase()}_${index + 1}`,
      airlineCode: airline.code,
      airlineName: airline.name,
      flightNumber: flightNum,
      origin: originAirport.code,
      originCity: originAirport.city,
      destination: destAirport.code,
      destinationCity: destAirport.city,
      departureTime: depTime.toISOString(),
      arrivalTime: arrTime.toISOString(),
      durationMinutes: durationMins,
      stops: slot.stops,
      stopAirports: slot.stops > 0 && slot.layover ? [slot.layover] : undefined,
      cabinClass,
      fare: calculatedFare,
      baseFare: baseFareOnly,
      taxesAndFees: taxes,
      currency: 'INR',
      provider: 'SandboxEngine',
      isLivePrice: false,
      observationTimestamp: new Date().toISOString(),
      fareRestrictions: {
        refundable: index % 2 === 0,
        cancellationFee: index % 2 === 0 ? Math.round(calculatedFare * 0.22) : 0,
        rescheduleFee: Math.round(calculatedFare * 0.12),
        baggageCabinKg: airline.baggageCabin,
        baggageCheckinKg: cabinClass === 'business' ? airline.baggageCheckin + 15 : airline.baggageCheckin,
        mealIncluded: airline.hasMealsFree || cabinClass !== 'economy',
        seatSelectionFee: index % 3 === 0 ? 0 : 450
      },
      bookingUrl: `https://www.google.com/travel/flights?q=flights%20from%20${origin}%20to%20${destination}`,
      seatsRemaining: 2 + ((index * 3) % 7),
      onTimePerformance: Math.round(airline.punctuality)
    });
  });

  return offers;
}
