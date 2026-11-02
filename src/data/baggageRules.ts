/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirlineBaggageRule, CabinClass, LegBaggageEstimate } from '../types';

export const AIRLINE_BAGGAGE_RULES: Record<string, AirlineBaggageRule> = {
  'IndiGo': {
    airlineCode: '6E',
    airlineName: 'IndiGo',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      business: 10
    },
    checkInAllowanceKg: {
      economy: 15,
      business: 30
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 550,
    prebookTiersInr: {
      plus3kg: 1350,
      plus5kg: 2250,
      plus10kg: 4500,
      plus15kg: 6750,
      plus30kg: 13500
    },
    specialEquipmentFeeInr: 1500,
    notes: 'Free cabin allowance: 1 piece up to 7 kg + 1 small personal item (up to 3 kg). Standard domestic check-in is 15 kg.'
  },
  'Air India': {
    airlineCode: 'AI',
    airlineName: 'Air India',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      premium_economy: 10,
      business: 12
    },
    checkInAllowanceKg: {
      economy: 25, // Generous full-service carrier allowance
      premium_economy: 30,
      business: 35
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 600,
    prebookTiersInr: {
      plus5kg: 2400,
      plus10kg: 4800,
      plus15kg: 7200
    },
    internationalConcept: 'weight',
    extraPieceRateInr: 8000,
    specialEquipmentFeeInr: 2000,
    notes: 'Air India provides one of the most generous domestic check-in allowances in India: 25 kg in Economy and 35 kg in Business.'
  },
  'Vistara': {
    airlineCode: 'UK',
    airlineName: 'Vistara',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      premium_economy: 10,
      business: 12
    },
    checkInAllowanceKg: {
      economy: 20,
      premium_economy: 25,
      business: 35
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 550,
    prebookTiersInr: {
      plus5kg: 2250,
      plus10kg: 4500,
      plus15kg: 6750
    },
    specialEquipmentFeeInr: 1500,
    notes: 'Premium full-service airline. Economy includes 20 kg check-in, Premium Economy 25 kg, Business Class 35 kg.'
  },
  'Akasa Air': {
    airlineCode: 'QP',
    airlineName: 'Akasa Air',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      business: 10
    },
    checkInAllowanceKg: {
      economy: 15,
      business: 25
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 550,
    prebookTiersInr: {
      plus5kg: 2100,
      plus10kg: 4200,
      plus15kg: 6300,
      plus30kg: 12600
    },
    specialEquipmentFeeInr: 1500,
    notes: 'Standard allowance: 15 kg check-in and 7 kg cabin bag. Pre-booking additional weight online saves ~25% compared to airport desk.'
  },
  'SpiceJet': {
    airlineCode: 'SG',
    airlineName: 'SpiceJet',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      business: 10
    },
    checkInAllowanceKg: {
      economy: 15,
      business: 30
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 550,
    prebookTiersInr: {
      plus5kg: 2250,
      plus10kg: 4500,
      plus15kg: 6750
    },
    specialEquipmentFeeInr: 1500,
    notes: '15 kg check-in and 7 kg hand baggage included. SpiceMax seats occasionally bundle additional priority luggage.'
  },
  'Air India Express': {
    airlineCode: 'IX',
    airlineName: 'Air India Express',
    isDomesticDefault: true,
    cabinAllowanceKg: {
      economy: 7,
      business: 10
    },
    checkInAllowanceKg: {
      economy: 15,
      business: 25
    },
    cabinPieces: 1,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 550,
    prebookTiersInr: {
      plus3kg: 1200,
      plus5kg: 2100,
      plus10kg: 4200,
      plus15kg: 6300
    },
    specialEquipmentFeeInr: 1500,
    notes: 'Domestic routes offer 15 kg check-in; Gulf flights offer 20 kg to 30 kg depending on fare family selected.'
  },
  'Emirates': {
    airlineCode: 'EK',
    airlineName: 'Emirates',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 7,
      premium_economy: 10,
      business: 14
    },
    checkInAllowanceKg: {
      economy: 30,
      premium_economy: 35,
      business: 40
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 2200,
    prebookTiersInr: {
      plus5kg: 9500,
      plus10kg: 18000,
      plus15kg: 26000
    },
    internationalConcept: 'weight',
    extraPieceRateInr: 12000,
    specialEquipmentFeeInr: 4500,
    notes: 'Emirates operates generous weight-concept allowances across Europe, Middle East, and Asia (30 kg Economy, 40 kg Business).'
  },
  'Singapore Airlines': {
    airlineCode: 'SQ',
    airlineName: 'Singapore Airlines',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 7,
      premium_economy: 7,
      business: 14
    },
    checkInAllowanceKg: {
      economy: 30,
      premium_economy: 35,
      business: 40
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 2400,
    prebookTiersInr: {
      plus5kg: 10000,
      plus10kg: 19000,
      plus15kg: 27500
    },
    internationalConcept: 'weight',
    extraPieceRateInr: 12500,
    specialEquipmentFeeInr: 4000,
    notes: 'World-class full-service allowance: 30 kg Economy (Standard/Flexi), 35 kg Premium Economy, 40 kg Business.'
  },
  'Qatar Airways': {
    airlineCode: 'QR',
    airlineName: 'Qatar Airways',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 7,
      business: 15
    },
    checkInAllowanceKg: {
      economy: 30,
      business: 40
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 2300,
    prebookTiersInr: {
      plus5kg: 9800,
      plus10kg: 18500,
      plus15kg: 26500
    },
    internationalConcept: 'weight',
    extraPieceRateInr: 12000,
    specialEquipmentFeeInr: 4200,
    notes: '30 kg Economy checked allowance on most international corridors; 2 pieces up to 23 kg each for flights to/from Americas.'
  },
  'British Airways': {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 23, // BA allows 23kg cabin bag if you can lift it into the overhead bin!
      premium_economy: 23,
      business: 23
    },
    checkInAllowanceKg: {
      economy: 23, // 1 piece of 23kg
      premium_economy: 46, // 2 pieces of 23kg
      business: 64 // 2 pieces of 32kg
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 1800,
    prebookTiersInr: {
      plus5kg: 7500,
      plus10kg: 14000,
      plus15kg: 20000
    },
    internationalConcept: 'piece',
    extraPieceRateInr: 7200,
    specialEquipmentFeeInr: 3500,
    notes: 'Piece concept: Economy includes 1 checked bag up to 23 kg. British Airways offers one of the heaviest cabin allowances (up to 23 kg hand luggage).'
  },
  'Lufthansa': {
    airlineCode: 'LH',
    airlineName: 'Lufthansa',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 8,
      premium_economy: 8,
      business: 16
    },
    checkInAllowanceKg: {
      economy: 23,
      premium_economy: 46,
      business: 64
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 1900,
    prebookTiersInr: {
      plus5kg: 7800,
      plus10kg: 14500,
      plus15kg: 21000
    },
    internationalConcept: 'piece',
    extraPieceRateInr: 7500,
    specialEquipmentFeeInr: 3800,
    notes: '1 bag up to 23 kg in Economy Classic; 2 bags up to 23 kg in Premium Economy; 2 bags up to 32 kg in Business.'
  },
  'United Airlines': {
    airlineCode: 'UA',
    airlineName: 'United Airlines',
    isDomesticDefault: false,
    cabinAllowanceKg: {
      economy: 10,
      business: 15
    },
    checkInAllowanceKg: {
      economy: 23,
      business: 64
    },
    cabinPieces: 2,
    maxPieceWeightKg: 32,
    excessRatePerKgAirportInr: 2000,
    prebookTiersInr: {
      plus5kg: 8000,
      plus10kg: 15000,
      plus15kg: 22000
    },
    internationalConcept: 'piece',
    extraPieceRateInr: 7800,
    specialEquipmentFeeInr: 4000,
    notes: 'Standard transcontinental allowance: 1 free 23 kg bag for international flights; $75 to $100 for a second checked bag.'
  }
};

/**
 * Returns matching airline baggage rules or a sensible default.
 */
export function getAirlineBaggageRule(airlineNameOrCode?: string): AirlineBaggageRule {
  if (!airlineNameOrCode) {
    return AIRLINE_BAGGAGE_RULES['IndiGo'];
  }

  const query = airlineNameOrCode.toLowerCase().trim();

  // Try exact or substring match in rule keys
  for (const [key, rule] of Object.entries(AIRLINE_BAGGAGE_RULES)) {
    if (
      key.toLowerCase() === query ||
      rule.airlineCode.toLowerCase() === query ||
      rule.airlineName.toLowerCase().includes(query) ||
      query.includes(rule.airlineName.toLowerCase())
    ) {
      return rule;
    }
  }

  // Fallback default
  return AIRLINE_BAGGAGE_RULES['IndiGo'];
}

export interface BaggageCalculationParams {
  airlineName?: string;
  cabinClass: CabinClass;
  isDomestic?: boolean;
  passengers?: number;
  checkedBagsCount: number;
  totalCheckedWeightKg: number;
  carryOnBagsCount: number;
  carryOnWeightKg: number;
  specialEquipment?: 'none' | 'golf' | 'cricket' | 'skis' | 'guitar_music' | 'bicycle';
  legId?: string;
}

/**
 * Computes exact baggage allowances, excess fees, and pre-booking savings.
 */
export function calculateBaggageFees(params: BaggageCalculationParams): LegBaggageEstimate {
  const {
    airlineName,
    cabinClass = 'economy',
    isDomestic = true,
    passengers = 1,
    checkedBagsCount,
    totalCheckedWeightKg,
    carryOnBagsCount,
    carryOnWeightKg,
    specialEquipment = 'none',
    legId = 'current_leg'
  } = params;

  const rule = getAirlineBaggageRule(airlineName);

  // Determine free allowances
  const baseFreeCheckIn =
    cabinClass === 'business'
      ? rule.checkInAllowanceKg.business
      : cabinClass === 'premium_economy' && rule.checkInAllowanceKg.premium_economy
      ? rule.checkInAllowanceKg.premium_economy
      : rule.checkInAllowanceKg.economy;

  const totalFreeCheckInKg = baseFreeCheckIn * Math.max(1, passengers);

  const baseFreeCabin =
    cabinClass === 'business'
      ? rule.cabinAllowanceKg.business
      : cabinClass === 'premium_economy' && rule.cabinAllowanceKg.premium_economy
      ? rule.cabinAllowanceKg.premium_economy
      : rule.cabinAllowanceKg.economy;

  const totalFreeCabinKg = baseFreeCabin * Math.max(1, passengers);

  // Calculate excesses
  const excessCheckInKg = Math.max(0, totalCheckedWeightKg - totalFreeCheckInKg);
  const excessCabinKg = Math.max(0, carryOnWeightKg - totalFreeCabinKg);

  // Pre-book pricing computation
  let prebookFeeInr = 0;
  if (excessCheckInKg > 0) {
    if (excessCheckInKg <= 3 && rule.prebookTiersInr.plus3kg) {
      prebookFeeInr = rule.prebookTiersInr.plus3kg;
    } else if (excessCheckInKg <= 5) {
      prebookFeeInr = rule.prebookTiersInr.plus5kg;
    } else if (excessCheckInKg <= 10) {
      prebookFeeInr = rule.prebookTiersInr.plus10kg;
    } else if (excessCheckInKg <= 15) {
      prebookFeeInr = rule.prebookTiersInr.plus15kg;
    } else if (excessCheckInKg <= 30 && rule.prebookTiersInr.plus30kg) {
      prebookFeeInr = rule.prebookTiersInr.plus30kg;
    } else {
      // Multiple tier packs
      const packsOf15 = Math.floor(excessCheckInKg / 15);
      const remainder = excessCheckInKg % 15;
      prebookFeeInr = packsOf15 * rule.prebookTiersInr.plus15kg;
      if (remainder > 0 && remainder <= 5) {
        prebookFeeInr += rule.prebookTiersInr.plus5kg;
      } else if (remainder > 5 && remainder <= 10) {
        prebookFeeInr += rule.prebookTiersInr.plus10kg;
      } else if (remainder > 10) {
        prebookFeeInr += rule.prebookTiersInr.plus15kg;
      }
    }
  }

  // Airport counter fee: charged at strict per-kg rate
  let airportFeeInr = excessCheckInKg * rule.excessRatePerKgAirportInr;

  // Add special equipment fee if applicable
  let specialEquipmentFee = 0;
  if (specialEquipment && specialEquipment !== 'none') {
    specialEquipmentFee = rule.specialEquipmentFeeInr;
    prebookFeeInr += specialEquipmentFee;
    airportFeeInr += specialEquipmentFee + 500; // Counter surcharge
  }

  const savingsByPrebookingInr = Math.max(0, airportFeeInr - prebookFeeInr);
  const isWithinAllowance = excessCheckInKg === 0 && excessCabinKg === 0;

  // Warnings and advisory
  const warnings: string[] = [];

  // Check 32 kg single piece OSHA/DGCA safety limit
  if (checkedBagsCount > 0) {
    const avgPieceWeight = totalCheckedWeightKg / checkedBagsCount;
    if (avgPieceWeight > 32 || (checkedBagsCount === 1 && totalCheckedWeightKg > 32)) {
      warnings.push('⚠️ Single piece limit exceeded: Airport health & safety regulations strictly forbid individual bags over 32 kg. Split your gear into two bags.');
    }
  }

  if (excessCabinKg > 0) {
    warnings.push(`⚠️ Hand luggage is ${excessCabinKg} kg over the ${totalFreeCabinKg} kg free cabin allowance. Airlines may gate-check this and charge an airport counter fee.`);
  }

  if (carryOnBagsCount > (rule.cabinPieces * Math.max(1, passengers))) {
    warnings.push(`⚠️ You have selected ${carryOnBagsCount} carry-on bags. ${rule.airlineName} strictly permits ${rule.cabinPieces} main piece per passenger.`);
  }

  if (excessCheckInKg > 0) {
    warnings.push(`💡 Pre-booking your ${excessCheckInKg} kg excess weight saves ~₹${savingsByPrebookingInr.toLocaleString('en-IN')} vs paying at the airport counter.`);
  }

  return {
    legId,
    airlineName: rule.airlineName,
    cabinClass,
    isDomestic,
    checkedBagsCount,
    totalCheckedWeightKg,
    carryOnBagsCount,
    carryOnWeightKg,
    specialEquipment: specialEquipment !== 'none' ? specialEquipment : undefined,
    freeCheckInKg: totalFreeCheckInKg,
    freeCabinKg: totalFreeCabinKg,
    excessCheckInKg,
    excessCabinKg,
    prebookFeeInr,
    airportFeeInr,
    savingsByPrebookingInr,
    isWithinAllowance,
    warnings
  };
}
