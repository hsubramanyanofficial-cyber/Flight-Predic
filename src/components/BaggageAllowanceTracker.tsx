import React, { useState, useEffect, useMemo } from 'react';
import { TripItinerary, TripLeg, CabinClass } from '../types';
import { AIRLINE_BAGGAGE_RULES, getAirlineBaggageRule } from '../data/baggageRules';
import { formatCurrency, SupportedCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import {
  Luggage,
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Sliders,
  ArrowRight,
  Plane,
  Sparkles,
  Copy,
  Check,
  Edit3
} from 'lucide-react';

export interface LuggageItem {
  id: string;
  name: string;
  type: 'cabin' | 'checked';
  weightKg: number;
  dimensionsCm?: string;
  notes?: string;
}

export interface CustomBaggagePolicy {
  airlineName: string;
  cabinAllowanceKg: number;
  checkInAllowanceKg: number;
  maxCabinPieces: number;
  maxCheckedPieces: number;
  excessRatePerKgInr: number;
  prebookDiscountPercent: number;
  cabinDimensionsCm: string;
  checkedDimensionsCm: string;
}

interface BaggageAllowanceTrackerProps {
  activeTrip: TripItinerary;
  onUpdateLegFare?: (legId: string, additionalBaggageFeeInr: number) => void;
}

export const BaggageAllowanceTracker: React.FC<BaggageAllowanceTrackerProps> = ({
  activeTrip,
  onUpdateLegFare
}) => {
  const { currency } = useApp();

  // Selected leg or custom selection
  const [selectedLegId, setSelectedLegId] = useState<string>(() => {
    return activeTrip.legs.length > 0 ? activeTrip.legs[0].id : 'custom';
  });

  const activeLeg = activeTrip.legs.find(l => l.id === selectedLegId);

  // Selected preset airline
  const [selectedAirline, setSelectedAirline] = useState<string>(() => activeLeg?.airlineName || 'IndiGo');
  const [cabinClass, setCabinClass] = useState<CabinClass>(() => activeLeg?.cabinClass || 'economy');

  // Custom Policy Mode toggle
  const [isCustomPolicy, setIsCustomPolicy] = useState<boolean>(false);

  // Active Policy state
  const presetRule = getAirlineBaggageRule(selectedAirline);
  const [policy, setPolicy] = useState<CustomBaggagePolicy>({
    airlineName: presetRule.airlineName,
    cabinAllowanceKg: presetRule.cabinAllowanceKg[cabinClass] || 7,
    checkInAllowanceKg: presetRule.checkInAllowanceKg[cabinClass] || 15,
    maxCabinPieces: 1,
    maxCheckedPieces: 1,
    excessRatePerKgInr: presetRule.excessRatePerKgAirportInr || 550,
    prebookDiscountPercent: 35,
    cabinDimensionsCm: '55 x 35 x 25 cm (115 cm total)',
    checkedDimensionsCm: '158 cm total linear dimensions'
  });

  // When airline or cabin class changes and not in custom mode, sync policy
  useEffect(() => {
    if (!isCustomPolicy) {
      const r = getAirlineBaggageRule(selectedAirline);
      setPolicy({
        airlineName: r.airlineName,
        cabinAllowanceKg: r.cabinAllowanceKg[cabinClass] || 7,
        checkInAllowanceKg: r.checkInAllowanceKg[cabinClass] || 15,
        maxCabinPieces: 1,
        maxCheckedPieces: cabinClass === 'business' ? 2 : 1,
        excessRatePerKgInr: r.excessRatePerKgAirportInr || 550,
        prebookDiscountPercent: 35,
        cabinDimensionsCm: '55 x 35 x 25 cm (115 cm total)',
        checkedDimensionsCm: '158 cm total linear dimensions'
      });
    }
  }, [selectedAirline, cabinClass, isCustomPolicy]);

  // When leg changes, sync airline and class
  const handleLegChange = (legId: string) => {
    setSelectedLegId(legId);
    if (legId !== 'custom') {
      const leg = activeTrip.legs.find(l => l.id === legId);
      if (leg) {
        if (leg.airlineName) setSelectedAirline(leg.airlineName);
        if (leg.cabinClass) setCabinClass(leg.cabinClass);
      }
    }
  };

  // Unit toggle: kg vs lbs
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const lbsToKg = (lbs: number) => Math.round((lbs / 2.20462) * 10) / 10;

  // Luggage Items List (persisted per trip)
  const storageKey = `fpps_luggage_${activeTrip.id}`;
  const [luggageItems, setLuggageItems] = useState<LuggageItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Defaults
    return [
      { id: 'bag_1', name: 'Main Rolling Suitcase', type: 'checked', weightKg: 16.5, notes: 'Clothes and shoes' },
      { id: 'bag_2', name: 'Cabin Trolley Bag', type: 'cabin', weightKg: 5.8, notes: 'Fits overhead bin' },
      { id: 'bag_3', name: 'Laptop Backpack', type: 'cabin', weightKg: 2.2, notes: 'Personal item under seat' }
    ];
  });

  // Save items to local storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(luggageItems));
    } catch {}
  }, [luggageItems, storageKey]);

  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'cabin' | 'checked'>('checked');
  const [newItemWeight, setNewItemWeight] = useState<number>(5);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const weightInKg = unit === 'lbs' ? lbsToKg(newItemWeight) : newItemWeight;

    const newItem: LuggageItem = {
      id: `bag_${Date.now()}`,
      name: newItemName.trim(),
      type: newItemType,
      weightKg: Math.max(0.1, Math.round(weightInKg * 10) / 10)
    };

    setLuggageItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemWeight(5);
  };

  const handleRemoveItem = (id: string) => {
    setLuggageItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemWeight = (id: string, deltaKg: number) => {
    setLuggageItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newW = Math.max(0.5, Math.round((item.weightKg + deltaKg) * 10) / 10);
          return { ...item, weightKg: newW };
        }
        return item;
      })
    );
  };

  // Calculations
  const cabinItems = luggageItems.filter(i => i.type === 'cabin');
  const checkedItems = luggageItems.filter(i => i.type === 'checked');

  const totalCabinWeightKg = Math.round(cabinItems.reduce((acc, i) => acc + i.weightKg, 0) * 10) / 10;
  const totalCheckedWeightKg = Math.round(checkedItems.reduce((acc, i) => acc + i.weightKg, 0) * 10) / 10;

  const cabinAllowance = policy.cabinAllowanceKg;
  const checkedAllowance = policy.checkInAllowanceKg;

  const cabinOverweightKg = Math.max(0, Math.round((totalCabinWeightKg - cabinAllowance) * 10) / 10);
  const checkedOverweightKg = Math.max(0, Math.round((totalCheckedWeightKg - checkedAllowance) * 10) / 10);

  const cabinPercent = Math.min(200, Math.round((totalCabinWeightKg / Math.max(1, cabinAllowance)) * 100));
  const checkedPercent = Math.min(200, Math.round((totalCheckedWeightKg / Math.max(1, checkedAllowance)) * 100));

  // Fee estimations
  const airportPenaltyFeeInr = checkedOverweightKg * policy.excessRatePerKgInr;
  const prebookDiscountRate = policy.excessRatePerKgInr * (1 - policy.prebookDiscountPercent / 100);
  const prebookFeeInr = Math.round(checkedOverweightKg * prebookDiscountRate);
  const potentialSavingsInr = airportPenaltyFeeInr - prebookFeeInr;

  // Copy manifest
  const [copied, setCopied] = useState(false);
  const handleCopyManifest = () => {
    const lines = [
      `BAGGAGE MANIFEST & ALLOWANCE TRACKER`,
      `Trip: ${activeTrip.title}`,
      `Flight: ${policy.airlineName} (${cabinClass.toUpperCase()})`,
      `---------------------------------------`,
      `CABIN ALLOWANCE: ${cabinAllowance} kg (Current: ${totalCabinWeightKg} kg) - ${cabinOverweightKg > 0 ? `OVERWEIGHT BY ${cabinOverweightKg} kg` : 'WITHIN LIMIT'}`,
      ...cabinItems.map(i => `  • ${i.name}: ${i.weightKg} kg`),
      ``,
      `CHECKED ALLOWANCE: ${checkedAllowance} kg (Current: ${totalCheckedWeightKg} kg) - ${checkedOverweightKg > 0 ? `OVERWEIGHT BY ${checkedOverweightKg} kg` : 'WITHIN LIMIT'}`,
      ...checkedItems.map(i => `  • ${i.name}: ${i.weightKg} kg`),
      `---------------------------------------`,
      checkedOverweightKg > 0 ? `Estimated Airport Gate Fee: ₹${airportPenaltyFeeInr} (Pre-book: ₹${prebookFeeInr})` : 'No excess baggage charges expected.'
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Luggage className="h-3 w-3" /> Visual Baggage Allowance Tracker
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Real-Time Weight Gauges & Policy Customizer
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Luggage Weight Tracker & Allowance Checker
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Input your airline's specific baggage policy or select a carrier preset. Track individual packed luggage items and monitor your cabin and checked weight against official limits.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Unit Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setUnit('kg')}
                className={`px-3 py-1 rounded-lg transition font-bold ${
                  unit === 'kg' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`px-3 py-1 rounded-lg transition font-bold ${
                  unit === 'lbs' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>

            {/* Copy Manifest */}
            <button
              onClick={handleCopyManifest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition"
              title="Copy packing manifest to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Manifest' : 'Copy Manifest'}</span>
            </button>
          </div>
        </div>

        {/* Itinerary Leg Selector if multiple legs */}
        {activeTrip.legs.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Sync With Flight Leg (Select to load carrier policy):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {activeTrip.legs.map((leg, idx) => (
                <button
                  key={leg.id}
                  onClick={() => handleLegChange(leg.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition flex items-center gap-2 ${
                    selectedLegId === leg.id
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Plane className="h-3 w-3 text-sky-400" />
                  <span>Leg {idx + 1}: {leg.origin} ➔ {leg.destination}</span>
                  <span className="text-[10px] text-slate-400">({leg.airlineName || 'Airline'})</span>
                </button>
              ))}
              <button
                onClick={() => handleLegChange('custom')}
                className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedLegId === 'custom'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3 w-3 text-emerald-400" />
                <span>Custom Flight</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Policy Editor + Dual Visual Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Airline Baggage Policy Input & Customizer (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Airline Baggage Policy
              </h3>
            </div>
            <button
              onClick={() => setIsCustomPolicy(!isCustomPolicy)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition ${
                isCustomPolicy
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isCustomPolicy ? 'Custom Policy (Active)' : 'Edit Policy Manually'}
            </button>
          </div>

          {/* Preset Selector */}
          <div className="space-y-4 text-xs">
            {!isCustomPolicy ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Airline Preset</label>
                  <select
                    value={selectedAirline}
                    onChange={e => setSelectedAirline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-sky-500"
                  >
                    {Object.keys(AIRLINE_BAGGAGE_RULES).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Cabin Class</label>
                  <select
                    value={cabinClass}
                    onChange={e => setCabinClass(e.target.value as CabinClass)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-sky-500 capitalize"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business Class</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Custom Input Fields */
              <div className="space-y-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Custom Airline Baggage Policy Inputs</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Airline / Flight Label</label>
                  <input
                    type="text"
                    value={policy.airlineName}
                    onChange={e => setPolicy({ ...policy, airlineName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Cabin Allowance (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={policy.cabinAllowanceKg}
                      onChange={e => setPolicy({ ...policy, cabinAllowanceKg: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Checked Allowance (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={policy.checkInAllowanceKg}
                      onChange={e => setPolicy({ ...policy, checkInAllowanceKg: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Excess Rate (₹/kg Gate)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={policy.excessRatePerKgInr}
                      onChange={e => setPolicy({ ...policy, excessRatePerKgInr: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Pre-book Discount (%)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="80"
                      value={policy.prebookDiscountPercent}
                      onChange={e => setPolicy({ ...policy, prebookDiscountPercent: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Current Policy Summary Table */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-white">{policy.airlineName}</span>
                <span className="font-mono text-sky-400">{cabinClass.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cabin Allowance:</span>
                  <span className="font-bold text-white font-mono">
                    {unit === 'lbs' ? `${kgToLbs(policy.cabinAllowanceKg)} lbs` : `${policy.cabinAllowanceKg} kg`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Checked Allowance:</span>
                  <span className="font-bold text-white font-mono">
                    {unit === 'lbs' ? `${kgToLbs(policy.checkInAllowanceKg)} lbs` : `${policy.checkInAllowanceKg} kg`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Airport Excess:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {formatCurrency(policy.excessRatePerKgInr, currency)}/kg
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pre-Book Excess:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(Math.round(policy.excessRatePerKgInr * (1 - policy.prebookDiscountPercent / 100)), currency)}/kg
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 space-y-0.5">
                <div>Cabin Dim: {policy.cabinDimensionsCm}</div>
                <div>Checked Dim: {policy.checkedDimensionsCm}</div>
              </div>
            </div>

            {/* Aviation Safety Compliance Notice */}
            <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-950/20 text-slate-300 text-[11px] space-y-1">
              <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Critical Compliance Guidelines</span>
              </div>
              <p className="text-slate-400">
                • <strong>Power banks & lithium batteries:</strong> Must be carried in cabin baggage ONLY. Strictly prohibited in checked bags.
              </p>
              <p className="text-slate-400">
                • <strong>Cabin liquids:</strong> Max 100ml per container in a transparent resealable bag.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Dual-Meters & Weight Tracker (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dual Visual Meters: Cabin & Checked */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gauge 1: Cabin Baggage Meter */}
            <div className={`p-5 rounded-2xl border shadow-xl space-y-3 transition ${
              cabinOverweightKg > 0
                ? 'border-rose-500/40 bg-rose-950/15'
                : cabinPercent > 85
                ? 'border-amber-500/40 bg-amber-950/15'
                : 'border-slate-800 bg-slate-900/80'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Scale className="h-4 w-4 text-indigo-400" />
                  <span>Cabin Hand Luggage</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  cabinOverweightKg > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : cabinPercent > 85
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {cabinOverweightKg > 0 ? 'Overweight!' : cabinPercent > 85 ? 'Near Limit' : 'Compliant'}
                </span>
              </div>

              {/* Weight Numbers */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black font-mono text-white">
                    {unit === 'lbs' ? kgToLbs(totalCabinWeightKg) : totalCabinWeightKg}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{unit}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Allowance: {unit === 'lbs' ? kgToLbs(cabinAllowance) : cabinAllowance} {unit}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    cabinOverweightKg > 0
                      ? 'bg-rose-500'
                      : cabinPercent > 85
                      ? 'bg-amber-400'
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${Math.min(100, cabinPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>{cabinItems.length} piece(s)</span>
                {cabinOverweightKg > 0 ? (
                  <span className="text-rose-400 font-bold">
                    +{unit === 'lbs' ? kgToLbs(cabinOverweightKg) : cabinOverweightKg} {unit} excess (Risk gate check)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">
                    {unit === 'lbs' ? kgToLbs(cabinAllowance - totalCabinWeightKg) : Math.round((cabinAllowance - totalCabinWeightKg) * 10) / 10} {unit} remaining buffer
                  </span>
                )}
              </div>
            </div>

            {/* Gauge 2: Checked Baggage Meter */}
            <div className={`p-5 rounded-2xl border shadow-xl space-y-3 transition ${
              checkedOverweightKg > 0
                ? 'border-rose-500/40 bg-rose-950/15'
                : checkedPercent > 85
                ? 'border-amber-500/40 bg-amber-950/15'
                : 'border-slate-800 bg-slate-900/80'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Luggage className="h-4 w-4 text-sky-400" />
                  <span>Checked Luggage</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  checkedOverweightKg > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : checkedPercent > 85
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {checkedOverweightKg > 0 ? 'Overweight!' : checkedPercent > 85 ? 'Near Limit' : 'Compliant'}
                </span>
              </div>

              {/* Weight Numbers */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black font-mono text-white">
                    {unit === 'lbs' ? kgToLbs(totalCheckedWeightKg) : totalCheckedWeightKg}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{unit}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Allowance: {unit === 'lbs' ? kgToLbs(checkedAllowance) : checkedAllowance} {unit}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    checkedOverweightKg > 0
                      ? 'bg-rose-500'
                      : checkedPercent > 85
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.min(100, checkedPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>{checkedItems.length} piece(s)</span>
                {checkedOverweightKg > 0 ? (
                  <span className="text-rose-400 font-bold">
                    +{unit === 'lbs' ? kgToLbs(checkedOverweightKg) : checkedOverweightKg} {unit} excess
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">
                    {unit === 'lbs' ? kgToLbs(checkedAllowance - totalCheckedWeightKg) : Math.round((checkedAllowance - totalCheckedWeightKg) * 10) / 10} {unit} remaining buffer
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Overweight Fee Warning & Savings Alert (if applicable) */}
          {checkedOverweightKg > 0 && (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Checked Baggage Exceeds Allowance by {checkedOverweightKg} kg</span>
                </div>
                <p className="text-slate-300">
                  Airport Counter Fee: <strong className="text-rose-400">{formatCurrency(airportPenaltyFeeInr, currency)}</strong>.
                  Pre-booking online costs only <strong className="text-emerald-400">{formatCurrency(prebookFeeInr, currency)}</strong>.
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 uppercase">Pre-Book Savings</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  Save {formatCurrency(potentialSavingsInr, currency)}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Luggage Items Tracker */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Luggage className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Packed Luggage Item Tracker ({luggageItems.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total Packed: {unit === 'lbs' ? kgToLbs(totalCabinWeightKg + totalCheckedWeightKg) : Math.round((totalCabinWeightKg + totalCheckedWeightKg) * 10) / 10} {unit}
              </span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Item / Bag Description</label>
                <input
                  type="text"
                  placeholder="e.g., Hardcase Trolley, Backpack..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs placeholder:text-slate-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={newItemType}
                  onChange={e => setNewItemType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs"
                >
                  <option value="checked">Checked Bag</option>
                  <option value="cabin">Cabin Carry-On</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Weight ({unit})</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={newItemWeight}
                  onChange={e => setNewItemWeight(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Bag</span>
                </button>
              </div>
            </form>

            {/* List of Items */}
            <div className="space-y-2 pt-1 max-h-80 overflow-y-auto">
              {luggageItems.map(item => {
                const displayWeight = unit === 'lbs' ? kgToLbs(item.weightKg) : item.weightKg;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${
                        item.type === 'cabin'
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      }`}>
                        {item.type === 'cabin' ? <Scale className="h-4 w-4" /> : <Luggage className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.type === 'cabin' ? 'Cabin Hand Luggage' : 'Checked Baggage'}
                          {item.notes ? ` · ${item.notes}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Weight Adjuster Buttons */}
                      <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 font-mono">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemWeight(item.id, -0.5)}
                          className="px-1 text-slate-400 hover:text-white"
                          title="-0.5 kg"
                        >
                          -
                        </button>
                        <span className="font-bold text-white px-1">
                          {displayWeight} {unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemWeight(item.id, 0.5)}
                          className="px-1 text-slate-400 hover:text-white"
                          title="+0.5 kg"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                        title="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
