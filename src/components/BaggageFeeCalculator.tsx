/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TripItinerary, TripLeg, CabinClass } from '../types';
import { AIRLINE_BAGGAGE_RULES, calculateBaggageFees, getAirlineBaggageRule } from '../data/baggageRules';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import {
  Luggage,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Scale,
  Plus,
  Minus,
  Check
} from 'lucide-react';

interface BaggageFeeCalculatorProps {
  activeTrip: TripItinerary;
  onUpdateLegFare?: (legId: string, additionalBaggageFeeInr: number) => void;
}

export const BaggageFeeCalculator: React.FC<BaggageFeeCalculatorProps> = ({
  activeTrip,
  onUpdateLegFare
}) => {
  const { currency } = useApp();

  // Selected leg or custom selection
  const [selectedLegId, setSelectedLegId] = useState<string>(() => {
    return activeTrip.legs.length > 0 ? activeTrip.legs[0].id : 'custom';
  });

  const activeLeg = activeTrip.legs.find(l => l.id === selectedLegId);

  // Form inputs
  const [airline, setAirline] = useState<string>(() => activeLeg?.airlineName || 'IndiGo');
  const [cabinClass, setCabinClass] = useState<CabinClass>(() => activeLeg?.cabinClass || 'economy');
  const [passengers, setPassengers] = useState<number>(1);
  const [checkedBagsCount, setCheckedBagsCount] = useState<number>(1);
  const [totalCheckedWeightKg, setTotalCheckedWeightKg] = useState<number>(20);
  const [carryOnBagsCount, setCarryOnBagsCount] = useState<number>(1);
  const [carryOnWeightKg, setCarryOnWeightKg] = useState<number>(7);
  const [specialEquipment, setSpecialEquipment] = useState<
    'none' | 'golf' | 'cricket' | 'skis' | 'guitar_music' | 'bicycle'
  >('none');
  const [showRulesDirectory, setShowRulesDirectory] = useState<boolean>(false);
  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);

  // When selected leg changes, synchronize form
  const handleLegChange = (legId: string) => {
    setSelectedLegId(legId);
    if (legId !== 'custom') {
      const leg = activeTrip.legs.find(l => l.id === legId);
      if (leg) {
        setAirline(leg.airlineName || 'IndiGo');
        setCabinClass(leg.cabinClass || 'economy');
      }
    }
  };

  // Calculate fees dynamically
  const estimate = useMemo(() => {
    return calculateBaggageFees({
      airlineName: airline,
      cabinClass,
      passengers,
      checkedBagsCount,
      totalCheckedWeightKg,
      carryOnBagsCount,
      carryOnWeightKg,
      specialEquipment,
      legId: selectedLegId
    });
  }, [
    airline,
    cabinClass,
    passengers,
    checkedBagsCount,
    totalCheckedWeightKg,
    carryOnBagsCount,
    carryOnWeightKg,
    specialEquipment,
    selectedLegId
  ]);

  const activeRule = getAirlineBaggageRule(airline);

  const handleApplyFeeToBudget = () => {
    if (activeLeg && onUpdateLegFare && estimate.prebookFeeInr > 0) {
      onUpdateLegFare(activeLeg.id, estimate.prebookFeeInr);
      setAppliedFeedback(true);
      setTimeout(() => setAppliedFeedback(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Luggage className="h-3 w-3" /> Airline Baggage Calculator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Domestic & International Tariffs
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Baggage Allowance & Excess Fee Estimator
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Estimate airline baggage charges, compare online pre-booking discounts against airport gate penalty rates, and inspect single-piece safety limits for your itinerary.
            </p>
          </div>

          <button
            onClick={() => setShowRulesDirectory(!showRulesDirectory)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium transition shrink-0"
          >
            <Info className="h-3.5 w-3.5 text-sky-400" />
            <span>{showRulesDirectory ? 'Hide Airline Directory' : 'Compare All Airline Rules'}</span>
          </button>
        </div>

        {/* Global Airline Rules Cheat Sheet Modal/Card */}
        {showRulesDirectory && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-sky-400" />
              Standard Free Allowances by Airline (Economy Class)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(AIRLINE_BAGGAGE_RULES).map(rule => (
                <div
                  key={rule.airlineName}
                  className={`p-3 rounded-xl border transition ${
                    rule.airlineName === activeRule.airlineName
                      ? 'bg-sky-500/10 border-sky-500/40 text-white'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span>{rule.airlineName} ({rule.airlineCode})</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Gate: ₹{rule.excessRatePerKgAirportInr}/kg
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Check-In: <strong className="text-white">{rule.checkInAllowanceKg.economy} kg</strong></span>
                    <span>Cabin: <strong className="text-white">{rule.cabinAllowanceKg.economy} kg</strong></span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    {rule.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Calculator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flight Leg & Luggage Parameters (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl space-y-5">
          {/* Leg Selector if trip has legs */}
          {activeTrip.legs.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Itinerary Flight Leg
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTrip.legs.map((leg, idx) => (
                  <button
                    key={leg.id}
                    onClick={() => handleLegChange(leg.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition ${
                      selectedLegId === leg.id
                        ? 'bg-sky-500/15 border-sky-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Leg {idx + 1}: {leg.origin} → {leg.destination}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {leg.airlineName || 'Any Carrier'} · {leg.date}
                      </div>
                    </div>
                    <Plane className={`h-4 w-4 shrink-0 ${selectedLegId === leg.id ? 'text-sky-400' : 'text-slate-600'}`} />
                  </button>
                ))}
                <button
                  onClick={() => handleLegChange('custom')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition ${
                    selectedLegId === 'custom'
                      ? 'bg-sky-500/15 border-sky-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">Custom Flight / Carrier</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Test any domestic or international airline</div>
                  </div>
                  <Scale className={`h-4 w-4 shrink-0 ${selectedLegId === 'custom' ? 'text-sky-400' : 'text-slate-600'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Carrier & Cabin Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Operating Airline
              </label>
              <select
                value={airline}
                onChange={e => setAirline(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {Object.keys(AIRLINE_BAGGAGE_RULES).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cabin Class
              </label>
              <select
                value={cabinClass}
                onChange={e => setCabinClass(e.target.value as CabinClass)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 capitalize"
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business Class</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Passengers
              </label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-center font-bold text-xs text-white font-mono">
                  {passengers}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengers(Math.min(9, passengers + 1))}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Checked Baggage Sliders */}
          <div className="pt-2 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Luggage className="h-4 w-4 text-sky-400" />
                Checked Luggage
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Free Allowance: <strong className="text-emerald-400">{estimate.freeCheckInKg} kg</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Number of Bags</span>
                  <span className="font-mono font-bold text-white">{checkedBagsCount} bag(s)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={checkedBagsCount}
                  onChange={e => setCheckedBagsCount(Number(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Total Checked Weight</span>
                  <span className={`font-mono font-bold ${totalCheckedWeightKg > estimate.freeCheckInKg ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {totalCheckedWeightKg} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={totalCheckedWeightKg}
                  onChange={e => setTotalCheckedWeightKg(Number(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Carry-on Hand Luggage Sliders */}
          <div className="pt-2 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-indigo-400" />
                Cabin Hand Luggage
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Free Cabin: <strong className="text-indigo-400">{estimate.freeCabinKg} kg</strong> (1 pc + personal item)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Carry-On Pieces</span>
                  <span className="font-mono font-bold text-white">{carryOnBagsCount} bag(s)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={carryOnBagsCount}
                  onChange={e => setCarryOnBagsCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Total Cabin Weight</span>
                  <span className={`font-mono font-bold ${carryOnWeightKg > estimate.freeCabinKg ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {carryOnWeightKg} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={carryOnWeightKg}
                  onChange={e => setCarryOnWeightKg(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Special Equipment Selector */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Special Luggage / Sports & Music Equipment
            </label>
            <select
              value={specialEquipment}
              onChange={e => setSpecialEquipment(e.target.value as any)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="none">None (Standard luggage only)</option>
              <option value="golf">Golf Bag / Kit (+₹{activeRule.specialEquipmentFeeInr})</option>
              <option value="cricket">Cricket Gear Kitbag (+₹{activeRule.specialEquipmentFeeInr})</option>
              <option value="skis">Ski / Snowboard Equipment (+₹{activeRule.specialEquipmentFeeInr})</option>
              <option value="guitar_music">Guitar / Musical Instrument (+₹{activeRule.specialEquipmentFeeInr})</option>
              <option value="bicycle">Bicycle (Boxed/Disassembled) (+₹{activeRule.specialEquipmentFeeInr})</option>
            </select>
          </div>
        </div>

        {/* Right Column: Calculations, Warnings & Pre-book Savings (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Fee Breakdown
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                estimate.isWithinAllowance
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {estimate.isWithinAllowance ? 'Within Free Allowance' : `${estimate.excessCheckInKg} kg Excess`}
              </span>
            </div>

            {/* Price comparison cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                  Online Pre-Book
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(estimate.prebookFeeInr, currency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Discounted airline web tariff
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
                <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold mb-1">
                  Airport Gate Desk
                </div>
                <div className="text-xl font-black font-mono text-slate-300">
                  {formatCurrency(estimate.airportFeeInr, currency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Penalty rate at check-in
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            {estimate.savingsByPrebookingInr > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Save {formatCurrency(estimate.savingsByPrebookingInr, currency)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    By booking additional baggage on {activeRule.airlineName}'s website before flight.
                  </div>
                </div>
              </div>
            )}

            {/* Warnings list */}
            {estimate.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {estimate.warnings.map((warn, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Policy Notes */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
                {activeRule.airlineName} Luggage Rule Details:
              </div>
              <p className="text-[11px] text-slate-400">
                {activeRule.notes}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                Max linear dimensions: 158 cm (62 in) total (L + W + H). Single piece weight limit: 32 kg.
              </div>
            </div>
          </div>

          {/* Action Button: Apply to Trip Budget */}
          {activeLeg && onUpdateLegFare && estimate.prebookFeeInr > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleApplyFeeToBudget}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                {appliedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Applied to Leg Fare!</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add {formatCurrency(estimate.prebookFeeInr, currency)} Baggage Fee to Leg</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
