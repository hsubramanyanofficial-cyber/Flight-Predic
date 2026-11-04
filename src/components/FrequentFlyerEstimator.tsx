import React, { useState, useMemo } from 'react';
import { TripItinerary, TripLeg, CabinClass } from '../types';
import { calculateAirDistanceKm, getAirportByCode, ALL_AIRPORTS } from '../data/airports';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import {
  Award,
  Plane,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Layers,
  Crown,
  Gift,
  CheckCircle2,
  Percent,
  Compass,
  ArrowRight
} from 'lucide-react';

export interface LoyaltyProgram {
  id: string;
  airlineName: string;
  programName: string;
  alliance: 'Star Alliance' | 'oneworld' | 'SkyTeam' | 'Independent';
  allianceColor: string;
  pointsName: string;
  valuePerPointInr: number; // estimated value in INR per point/mile
  tierBonusPercent: Record<'member' | 'silver' | 'gold' | 'platinum', number>;
  cabinMultiplier: Record<CabinClass, number>;
  tierStatusName: string;
  goldThresholdPoints: number;
  perks: string[];
}

export const LOYALTY_PROGRAMS: LoyaltyProgram[] = [
  {
    id: 'ai_flying_returns',
    airlineName: 'Air India',
    programName: 'Flying Returns (Maharaja Club)',
    alliance: 'Star Alliance',
    allianceColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    pointsName: 'Maharaja Points',
    valuePerPointInr: 0.55,
    tierBonusPercent: { member: 0, silver: 25, gold: 50, platinum: 75 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.25, business: 2.0 },
    tierStatusName: 'Tier Points',
    goldThresholdPoints: 45000,
    perks: ['Star Alliance Gold Worldwide Lounge Access', '+20kg Extra Baggage', 'Priority Check-in & Boarding']
  },
  {
    id: 'sq_krisflyer',
    airlineName: 'Singapore Airlines',
    programName: 'KrisFlyer',
    alliance: 'Star Alliance',
    allianceColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    pointsName: 'KrisFlyer Miles',
    valuePerPointInr: 1.15,
    tierBonusPercent: { member: 0, silver: 25, gold: 25, platinum: 50 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.25, business: 1.75 },
    tierStatusName: 'Elite Miles',
    goldThresholdPoints: 50000,
    perks: ['SilverKris Lounge Access', 'Star Alliance Gold Recognition', '100% Miles on SIA & Scoot']
  },
  {
    id: 'ek_skywards',
    airlineName: 'Emirates',
    programName: 'Emirates Skywards',
    alliance: 'Independent',
    allianceColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    pointsName: 'Skywards Miles',
    valuePerPointInr: 0.90,
    tierBonusPercent: { member: 0, silver: 25, gold: 50, platinum: 75 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.3, business: 1.9 },
    tierStatusName: 'Tier Miles',
    goldThresholdPoints: 50000,
    perks: ['Emirates Business Lounge Worldwide', 'Free Wi-Fi in Flight', '+16kg Extra Baggage Allowance']
  },
  {
    id: 'ba_exec_club',
    airlineName: 'British Airways',
    programName: 'Executive Club',
    alliance: 'oneworld',
    allianceColor: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    pointsName: 'Avios',
    valuePerPointInr: 1.25,
    tierBonusPercent: { member: 0, silver: 50, gold: 100, platinum: 100 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.35, business: 2.25 },
    tierStatusName: 'Tier Points (TP)',
    goldThresholdPoints: 1500, // TP system
    perks: ['oneworld Sapphire / Emerald Lounge Access', 'Free Seat Selection at Booking', 'Priority Baggage']
  },
  {
    id: 'qr_privilege',
    airlineName: 'Qatar Airways',
    programName: 'Privilege Club',
    alliance: 'oneworld',
    allianceColor: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    pointsName: 'Avios',
    valuePerPointInr: 1.20,
    tierBonusPercent: { member: 0, silver: 25, gold: 75, platinum: 100 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.3, business: 2.0 },
    tierStatusName: 'Qpoints',
    goldThresholdPoints: 300,
    perks: ['Al Mourjan Business Lounge Access', 'Tier Upgrade for Family', '+15kg Extra Checked Baggage']
  },
  {
    id: 'indigo_6e',
    airlineName: 'IndiGo',
    programName: '6E Rewards (BluChip)',
    alliance: 'Independent',
    allianceColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    pointsName: '6E BluChips',
    valuePerPointInr: 1.00,
    tierBonusPercent: { member: 0, silver: 15, gold: 30, platinum: 50 },
    cabinMultiplier: { economy: 1.0, premium_economy: 1.2, business: 1.5 },
    tierStatusName: 'BluChip Flights',
    goldThresholdPoints: 25000,
    perks: ['No Blackout Dates on Indian Domestic Routes', 'Free Seat & Meal Selection', 'Fast Forward Priority Check-in']
  }
];

interface FrequentFlyerEstimatorProps {
  activeTrip: TripItinerary;
}

export const FrequentFlyerEstimator: React.FC<FrequentFlyerEstimatorProps> = ({ activeTrip }) => {
  const { currency } = useApp();

  // Selection scope: full trip or specific leg
  const [selectedScope, setSelectedScope] = useState<string>('full_trip');
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [tierLevel, setTierLevel] = useState<'member' | 'silver' | 'gold' | 'platinum'>('member');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ai_flying_returns');

  // Custom route if needed
  const [customOrigin, setCustomOrigin] = useState<string>('DEL');
  const [customDestination, setCustomDestination] = useState<string>('LHR');

  // Calculate route distance in statute miles and kilometers
  const routeMetrics = useMemo(() => {
    let totalKm = 0;
    const legsList: { origin: string; destination: string; distanceKm: number; distanceMiles: number }[] = [];

    if (selectedScope === 'full_trip' && activeTrip.legs.length > 0) {
      activeTrip.legs.forEach(leg => {
        const km = calculateAirDistanceKm(leg.origin, leg.destination);
        const miles = Math.round(km * 0.621371);
        totalKm += km;
        legsList.push({ origin: leg.origin, destination: leg.destination, distanceKm: km, distanceMiles: miles });
      });
    } else if (selectedScope !== 'full_trip' && selectedScope !== 'custom') {
      const leg = activeTrip.legs.find(l => l.id === selectedScope);
      if (leg) {
        const km = calculateAirDistanceKm(leg.origin, leg.destination);
        const miles = Math.round(km * 0.621371);
        totalKm = km;
        legsList.push({ origin: leg.origin, destination: leg.destination, distanceKm: km, distanceMiles: miles });
      }
    } else {
      // Custom or fallback
      const km = calculateAirDistanceKm(customOrigin, customDestination);
      const miles = Math.round(km * 0.621371);
      totalKm = km;
      legsList.push({ origin: customOrigin, destination: customDestination, distanceKm: km, distanceMiles: miles });
    }

    const totalMiles = Math.round(totalKm * 0.621371);
    return {
      totalKm,
      totalMiles: Math.max(500, totalMiles), // minimum segment guarantee
      legsList
    };
  }, [selectedScope, activeTrip, customOrigin, customDestination]);

  // Compute points per loyalty program
  const programEstimations = useMemo(() => {
    return LOYALTY_PROGRAMS.map(prog => {
      const classMult = prog.cabinMultiplier[cabinClass] || 1.0;
      const tierBonus = 1 + (prog.tierBonusPercent[tierLevel] / 100);

      // Base flight miles earned
      const basePoints = Math.round(routeMetrics.totalMiles * classMult);
      const bonusPoints = Math.round(basePoints * (prog.tierBonusPercent[tierLevel] / 100));
      const totalPoints = basePoints + bonusPoints;

      // Tier/Elite status credits
      let statusCredits = Math.round(routeMetrics.totalMiles * classMult);
      if (prog.id === 'ba_exec_club') {
        // BA uses Tier Points (20 to 140 TP per flight leg)
        const tpPerLeg = cabinClass === 'business' ? 140 : cabinClass === 'premium_economy' ? 90 : 35;
        statusCredits = tpPerLeg * Math.max(1, routeMetrics.legsList.length);
      } else if (prog.id === 'qr_privilege') {
        const qpPerLeg = cabinClass === 'business' ? 30 : cabinClass === 'premium_economy' ? 20 : 10;
        statusCredits = qpPerLeg * Math.max(1, routeMetrics.legsList.length);
      }

      const estMonetaryValueInr = Math.round(totalPoints * prog.valuePerPointInr);

      // Progress towards Gold Elite
      const goldProgressPercent = Math.min(100, Math.round((statusCredits / prog.goldThresholdPoints) * 100));

      return {
        ...prog,
        basePoints,
        bonusPoints,
        totalPoints,
        statusCredits,
        estMonetaryValueInr,
        goldProgressPercent
      };
    });
  }, [routeMetrics, cabinClass, tierLevel]);

  const activeEstimations = programEstimations.find(p => p.id === selectedProgramId) || programEstimations[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Award className="h-3.5 w-3.5" /> Airline Frequent Flyer Miles Estimator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Star Alliance · oneworld · SkyTeam · Low-Cost
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Loyalty Points & Miles Reward Calculator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Estimate frequent flyer miles, elite tier points, and monetary redemption value for your flight path across global airline loyalty alliances.
            </p>
          </div>

          {/* Quick Route Summary Pill */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-500 text-[10px] block">TOTAL FLIGHT DISTANCE</span>
              <span className="text-base font-bold text-white block">
                {routeMetrics.totalMiles.toLocaleString()} <span className="text-xs text-slate-400">Miles</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 text-[10px] block">DISTANCE IN KM</span>
              <span className="text-base font-bold text-sky-400 block">
                {routeMetrics.totalKm.toLocaleString()} <span className="text-xs text-slate-400">km</span>
              </span>
            </div>
          </div>
        </div>

        {/* Flight Scope & Parameters Toolbar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Scope Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Selected Itinerary Flight Path
            </label>
            <select
              value={selectedScope}
              onChange={e => setSelectedScope(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              {activeTrip.legs.length > 0 && (
                <option value="full_trip">
                  Full Multi-City Trip ({activeTrip.legs.length} Legs · {routeMetrics.totalMiles} Miles)
                </option>
              )}
              {activeTrip.legs.map((leg, idx) => (
                <option key={leg.id} value={leg.id}>
                  Leg {idx + 1}: {leg.origin} ➔ {leg.destination} ({leg.airlineName || 'Flight'})
                </option>
              ))}
              <option value="custom">Custom Airport Corridor Pair</option>
            </select>
          </div>

          {/* Cabin Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Travel Cabin Class (Multiplier)
            </label>
            <select
              value={cabinClass}
              onChange={e => setCabinClass(e.target.value as CabinClass)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-medium focus:outline-none focus:border-amber-500 capitalize"
            >
              <option value="economy">Economy Class (100% Miles)</option>
              <option value="premium_economy">Premium Economy (125% - 135% Miles)</option>
              <option value="business">Business Class (175% - 225% Miles)</option>
            </select>
          </div>

          {/* Frequent Flyer Status Level */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Current Loyalty Tier Status
            </label>
            <select
              value={tierLevel}
              onChange={e => setTierLevel(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-medium focus:outline-none focus:border-amber-500 capitalize"
            >
              <option value="member">Base Member (0% Bonus)</option>
              <option value="silver">Silver Tier (+25% Bonus Miles)</option>
              <option value="gold">Gold Tier (+50% Bonus Miles)</option>
              <option value="platinum">Platinum Tier (+75% Bonus Miles)</option>
            </select>
          </div>
        </div>

        {/* Custom Corridor inputs if selected */}
        {selectedScope === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
            <div className="w-40">
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Origin IATA</label>
              <input
                type="text"
                maxLength={3}
                value={customOrigin}
                onChange={e => setCustomOrigin(e.target.value.toUpperCase())}
                className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono uppercase text-xs"
              />
            </div>
            <span className="text-slate-500 pt-5">➔</span>
            <div className="w-40">
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Destination IATA</label>
              <input
                type="text"
                maxLength={3}
                value={customDestination}
                onChange={e => setCustomDestination(e.target.value.toUpperCase())}
                className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono uppercase text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Program Highlight Card & Perks Dashboard */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 p-6 shadow-2xl space-y-6">
        
        {/* Top Details */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeEstimations.allianceColor}`}>
                {activeEstimations.alliance}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeEstimations.airlineName}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {activeEstimations.programName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Flight route: {routeMetrics.legsList.map(l => `${l.origin}➔${l.destination}`).join(' · ')}
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400">Total Rewards Value</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">
              {formatCurrency(activeEstimations.estMonetaryValueInr, currency)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              ~₹{activeEstimations.valuePerPointInr} per point redemption rate
            </span>
          </div>
        </div>

        {/* 4 Metric KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
            <span className="text-[11px] text-slate-400 block">Base Flight Miles</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {activeEstimations.basePoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Based on {cabinClass} class</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
            <span className="text-[11px] text-slate-400 block">Tier Bonus Miles</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
              +{activeEstimations.bonusPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">{tierLevel} tier bonus</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <span className="text-[11px] text-amber-300 font-semibold block">Total Points Earned</span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block">
              {activeEstimations.totalPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400/80">{activeEstimations.pointsName}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
            <span className="text-[11px] text-slate-400 block">{activeEstimations.tierStatusName}</span>
            <span className="text-xl font-bold font-mono text-sky-400 mt-0.5 block">
              {activeEstimations.statusCredits.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Towards Elite Status</span>
          </div>
        </div>

        {/* Status Tier Progress Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>Gold Elite Qualification Progress with this Itinerary</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {activeEstimations.goldProgressPercent}% of Threshold
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, activeEstimations.goldProgressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Current: 0 Credits</span>
            <span>Earned: +{activeEstimations.statusCredits} Credits</span>
            <span>Target: {activeEstimations.goldThresholdPoints.toLocaleString()} Credits</span>
          </div>
        </div>

        {/* Perks & Redemption Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Elite Status Perks Unlocked</span>
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {activeEstimations.perks.map((perk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-sky-400" />
              <span>What You Can Redeem With {activeEstimations.totalPoints.toLocaleString()} Points</span>
            </span>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  {activeEstimations.totalPoints >= 5000
                    ? '✓ Enough for 1x Free One-Way Domestic Economy Flight Award'
                    : 'Partial credit towards free flight redemption'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>One-way cabin upgrade to Premium Economy or Business</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>Excess baggage voucher or priority airport security lane passes</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Program Comparison Table / Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>Cross-Alliance Loyalty Program Comparison</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any program to set it as active and view detailed status perks for this flight route.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {programEstimations.map(prog => {
            const isSelected = selectedProgramId === prog.id;
            return (
              <div
                key={prog.id}
                onClick={() => setSelectedProgramId(prog.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs truncate">{prog.airlineName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${prog.allianceColor}`}>
                      {prog.alliance}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{prog.programName}</div>
                </div>

                <div className="space-y-1 font-mono text-xs pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Miles:</span>
                    <span className="text-amber-400 font-bold">{prog.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status Credits:</span>
                    <span className="text-sky-400">{prog.statusCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Est. Cash Value:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(prog.estMonetaryValueInr, currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Gold Target: {prog.goldProgressPercent}%</span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
