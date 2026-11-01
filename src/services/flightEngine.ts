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

const AIRLINES = [
  { code: '6E', name: 'IndiGo', aircrafts: ['Airbus A320neo', 'Airbus A321neo'], punctuality: 88.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'AI', name: 'Air India', aircrafts: ['Airbus A350-900', 'Boeing 787-8', 'Airbus A320neo'], punctuality: 82.0, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 25 },
  { code: 'UK', name: 'Vistara', aircrafts: ['Airbus A321neo', 'Boeing 787-9', 'Airbus A320neo'], punctuality: 89.8, hasMealsFree: true, baggageCabin: 7, baggageCheckin: 20 },
  { code: 'QP', name: 'Akasa Air', aircrafts: ['Boeing 737 MAX 8'], punctuality: 87.2, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'SG', name: 'SpiceJet', aircrafts: ['Boeing 737-800', 'De Havilland Q400'], punctuality: 74.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 },
  { code: 'IX', name: 'Air India Express', aircrafts: ['Boeing 737 MAX 8', 'Airbus A320'], punctuality: 81.5, hasMealsFree: false, baggageCabin: 7, baggageCheckin: 15 }
];

export function generateFlightOffers(params: SearchFlightParams): FlightOffer[] {
  const { origin, destination, departureDate, cabinClass } = params;
  const originAirport: Airport = getAirportByCode(origin) || { code: origin, name: `${origin} Airport`, city: origin, stateOrCountry: 'India', country: 'India', isDomestic: true };
  const destAirport: Airport = getAirportByCode(destination) || { code: destination, name: `${destination} Airport`, city: destination, stateOrCountry: 'India', country: 'India', isDomestic: true };
  
  const base = estimateRouteBase(origin, destination);
  const baseDistKm = base.distanceKm;
  const baseTravelMinutes = Math.max(65, Math.round((baseDistKm / 800) * 60 + 35));
  
  const offers: FlightOffer[] = [];
  const scheduleSlots = [
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
  ];

  scheduleSlots.forEach((slot, index) => {
    const airline = AIRLINES[index % AIRLINES.length];
    const flightNum = `${airline.code}-${100 + index * 47}`;
    
    // Departure and arrival timestamps
    const depTime = new Date(`${departureDate}T${String(slot.hour).padStart(2, '0')}:${String(slot.min).padStart(2, '0')}:00`);
    const durationMins = slot.stops === 0 ? baseTravelMinutes + (index % 3) * 5 : baseTravelMinutes + 95;
    const arrTime = new Date(depTime.getTime() + durationMins * 60 * 1000);

    // Price calculation
    let priceMultiplier = 1.0;
    if (slot.hour >= 7 && slot.hour <= 10) priceMultiplier += 0.12;
    if (slot.hour >= 17 && slot.hour <= 20) priceMultiplier += 0.15;
    if (slot.hour >= 22) priceMultiplier -= 0.10;
    if (slot.stops > 0) priceMultiplier -= 0.12;

    if (airline.hasMealsFree) priceMultiplier += 0.15;
    if (cabinClass === 'premium_economy') priceMultiplier *= 1.75;
    if (cabinClass === 'business') priceMultiplier *= 3.15;

    // Pseudo variation
    const variation = ((index * 137) % 700) - 350;
    const calculatedFare = Math.round((base.baseFare * priceMultiplier + variation) / 50) * 50;
    const taxes = Math.round(calculatedFare * 0.18);
    const baseFareOnly = calculatedFare - taxes;

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
      seatsRemaining: Math.floor(3 + (index * 7) % 18),
      onTimePerformance: airline.punctuality,
      fareRestrictions: {
        refundable: index % 2 === 0,
        cancellationFee: index % 2 === 0 ? 3000 : 4999,
        rescheduleFee: index % 2 === 0 ? 1500 : 3250,
        baggageCabinKg: airline.baggageCabin,
        baggageCheckinKg: cabinClass === 'business' ? 35 : airline.baggageCheckin,
        mealIncluded: airline.hasMealsFree || cabinClass !== 'economy',
        seatSelectionFee: airline.hasMealsFree ? 0 : 250
      },
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${departureDate}`
    });
  });

  return offers;
}
