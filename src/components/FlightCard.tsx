import React, { useState } from 'react';
import { FlightOffer, PricePrediction, PriceIntelligence } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, ShieldCheck, ChevronDown, ChevronUp, Bell, Scale, ExternalLink, Sparkles, Check, Luggage, Utensils } from 'lucide-react';

interface FlightCardProps {
  flight: FlightOffer;
  prediction?: PricePrediction;
  intelligence?: PriceIntelligence | null;
  onTrackSuccess?: () => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, prediction, intelligence, onTrackSuccess }) => {
  const {
    addToComparison,
    removeFromComparison,
    isFlightInComparison,
    trackFlight,
    trackedFlights
  } = useApp();

  const [expanded, setExpanded] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSuccess, setTrackingSuccess] = useState(false);

  const inComparison = isFlightInComparison(flight.id);
  const isAlreadyTracked = trackedFlights.some(
    t => t.origin === flight.origin && t.destination === flight.destination && t.isActive
  );

  const depDate = new Date(flight.departureTime);
  const arrDate = new Date(flight.arrivalTime);
  
  const depTimeStr = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const arrTimeStr = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const durationHours = Math.floor(flight.durationMinutes / 60);
  const durationMins = flight.durationMinutes % 60;

  const handleTrack = async () => {
    setTrackingLoading(true);
    try {
      await trackFlight({
        origin: flight.origin,
        destination: flight.destination,
        originCity: flight.originCity,
        destinationCity: flight.destinationCity,
        departureDate: flight.departureTime.split('T')[0],
        cabinClass: flight.cabinClass,
        targetPriceInr: Math.round(flight.fare * 0.92), // Target 8% drop
        initialPriceInr: flight.fare,
        preferredAirline: flight.airlineName
      });
      setTrackingSuccess(true);
      if (onTrackSuccess) onTrackSuccess();
      setTimeout(() => setTrackingSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Assessment styling
  const getAssessmentBadge = () => {
    if (!intelligence) return null;
    switch (intelligence.assessment) {
      case 'RELATIVELY_LOW':
        return (
          <span className="text-xs font-semibold text-emerald-400">
            Relatively Low {intelligence.savingsVsAvgInr ? `(₹${intelligence.savingsVsAvgInr.toLocaleString('en-IN')} below avg)` : ''}
          </span>
        );
      case 'RELATIVELY_HIGH':
        return (
          <span className="text-xs font-semibold text-rose-400">
            Relatively High (Surge pricing detected)
          </span>
        );
      case 'NEAR_TYPICAL_RANGE':
        return (
          <span className="text-xs font-semibold text-sky-400">
            Near Typical Range (Fair market price)
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-slate-400">
            Insufficient Historical Data
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition duration-200 shadow-sm overflow-hidden">
      
      {/* Top Bar inside card: Airline metadata and Price Intelligence */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-400 font-mono text-[11px]">
              {flight.airlineCode}
            </span>
            <span>{flight.airlineName}</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-400">{flight.flightNumber}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 capitalize">{flight.cabinClass.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-3">
          {getAssessmentBadge()}
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-mono text-slate-400">
            {flight.provider === 'SandboxEngine' ? 'Sandbox Tariff' : 'Live GDS Fare'}
          </span>
        </div>
      </div>

      {/* Main Flight Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Timeline block (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-7 items-center gap-2">
          
          {/* Origin & Departure */}
          <div className="col-span-2 text-left">
            <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {depTimeStr}
            </div>
            <div className="text-xs font-semibold text-sky-400 font-mono mt-0.5">
              {flight.origin}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {flight.originCity}
            </div>
          </div>

          {/* Duration & Stops Graphic */}
          <div className="col-span-3 text-center px-2">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>{durationHours}h {durationMins}m</span>
            </div>
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full h-[2px] bg-slate-700 relative">
                {flight.stops > 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                )}
              </div>
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              {flight.stops === 0 ? (
                <span className="text-emerald-400 font-semibold">Non-stop</span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  {flight.stops} Stop {flight.stopAirports ? `(${flight.stopAirports.join(', ')})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Destination & Arrival */}
          <div className="col-span-2 text-right">
            <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
              {arrTimeStr}
            </div>
            <div className="text-xs font-semibold text-sky-400 font-mono mt-0.5">
              {flight.destination}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {flight.destinationCity}
            </div>
          </div>

        </div>

        {/* Pricing & CTA block (4 cols) */}
        <div className="lg:col-span-4 lg:border-l lg:border-slate-800 lg:pl-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-baseline justify-between lg:justify-end gap-2">
              <span className="text-xs text-slate-400 font-medium">Total Fare</span>
              <span className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                ₹{flight.fare.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Prediction Comparison pill */}
            {prediction && (
              <div className="mt-1 flex items-center justify-between lg:justify-end gap-1.5 text-xs text-slate-400 font-mono">
                <Sparkles className="h-3 w-3 text-sky-400" />
                <span>ML Predicted: ₹{prediction.predictedFare.toLocaleString('en-IN')}</span>
              </div>
            )}
            
            <div className="text-[11px] text-slate-400 mt-1 text-right">
              Incl. ₹{flight.taxesAndFees.toLocaleString('en-IN')} taxes & fees
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                if (inComparison) removeFromComparison(flight.id);
                else addToComparison(flight);
              }}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1.5 ${
                inComparison
                  ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>{inComparison ? 'Compared' : 'Compare'}</span>
            </button>

            <a
              href={flight.bookingUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-4 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <span>Book</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>

      </div>

      {/* Accordion Footer: Baggage, Policies, and Track Button */}
      <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Amenities & Baggage */}
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5" title="Cabin & Check-in Baggage">
            <Luggage className="h-3.5 w-3.5 text-slate-400" />
            <span>Cabin {flight.fareRestrictions.baggageCabinKg}kg · Check-in {flight.fareRestrictions.baggageCheckinKg}kg</span>
          </div>

          <div className="flex items-center gap-1.5" title="Meal Policy">
            <Utensils className="h-3.5 w-3.5 text-slate-400" />
            <span>{flight.fareRestrictions.mealIncluded ? 'Meal Included' : 'Buy on Board'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{flight.fareRestrictions.refundable ? 'Refundable with fee' : 'Non-refundable'}</span>
          </div>
        </div>

        {/* Right side: Tracking trigger + Details toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTrack}
            disabled={trackingLoading || isAlreadyTracked}
            className={`flex items-center gap-1.5 text-xs font-medium transition ${
              isAlreadyTracked || trackingSuccess
                ? 'text-emerald-400'
                : 'text-slate-300 hover:text-sky-400'
            }`}
          >
            {isAlreadyTracked || trackingSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Tracking</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                <span>Track Fare</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <span>{expanded ? 'Less Details' : 'Fare Details'}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* Expanded Details Drawer */}
      {expanded && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <span className="font-semibold text-slate-200">Fare Breakdown</span>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>Base Airfare</span>
                <span>₹{flight.baseFare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>Aviation Security Fee & Fuel</span>
                <span>₹{Math.round(flight.taxesAndFees * 0.65).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>User Development Fee (UDF) & GST</span>
                <span>₹{Math.round(flight.taxesAndFees * 0.35).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white font-bold font-mono tabular-nums border-t border-slate-800 pt-1">
                <span>Total Amount</span>
                <span>₹{flight.fare.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <span className="font-semibold text-slate-200">Cancellation & Changes</span>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>Refundability</span>
                <span className={flight.fareRestrictions.refundable ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                  {flight.fareRestrictions.refundable ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>Cancellation Fee</span>
                <span>₹{flight.fareRestrictions.cancellationFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono tabular-nums">
                <span>Date Change Fee</span>
                <span>₹{flight.fareRestrictions.rescheduleFee.toLocaleString('en-IN')} + fare diff</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <span className="font-semibold text-slate-200">Carrier Operations</span>
              <div className="flex justify-between text-slate-400">
                <span>Operating Aircraft</span>
                <span className="text-slate-300 font-mono">Airbus A321neo</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Historic Punctuality</span>
                <span className="text-emerald-400 font-mono font-semibold">{flight.onTimePerformance || 88.5}% on-time</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Observation Timestamp</span>
                <span className="text-slate-400 font-mono">{new Date(flight.observationTimestamp).toLocaleTimeString()}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
