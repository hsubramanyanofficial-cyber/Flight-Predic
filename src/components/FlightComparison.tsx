import React from 'react';
import { useApp } from '../context/AppContext';
import { Scale, X, ExternalLink, Sparkles, Check, Clock, Luggage, Utensils, ShieldCheck, ArrowRight } from 'lucide-react';
import { evaluatePriceIntelligence } from '../data/analytics';
import { predictFlightFare } from '../ml/model';

export const FlightComparison: React.FC = () => {
  const { comparisonList, removeFromComparison, clearComparison, setActiveTab } = useApp();

  if (comparisonList.length === 0) {
    return (
      <div className="py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 max-w-xl mx-auto">
        <div className="h-12 w-12 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
          <Scale className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">No Flights in Comparison</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select "Compare" on any 2 or 3 flights in your search results to inspect side-by-side airfares, baggage allowances, cancellation charges, and machine learning price assessments.
        </p>
        <button
          onClick={() => setActiveTab('search')}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs hover:bg-sky-300 transition"
        >
          <span>Search Flights</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Scale className="h-4 w-4" />
            <span>Flight Comparison Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Comparing {comparisonList.length} Flight{comparisonList.length > 1 ? 's' : ''}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 transition"
          >
            + Add Another Flight
          </button>
          <button
            onClick={clearComparison}
            className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <div className={`grid grid-cols-${comparisonList.length} gap-4 min-w-[700px]`}>
          {comparisonList.map(flight => {
            const dep = new Date(flight.departureTime);
            const arr = new Date(flight.arrivalTime);
            const depTime = dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const arrTime = arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const durHours = Math.floor(flight.durationMinutes / 60);
            const durMins = flight.durationMinutes % 60;
            
            const intelligence = evaluatePriceIntelligence({
              origin: flight.origin,
              destination: flight.destination,
              fareInr: flight.fare
            });

            const prediction = predictFlightFare({
              origin: flight.origin,
              destination: flight.destination,
              travelDate: flight.departureTime.split('T')[0],
              cabinClass: flight.cabinClass,
              actualFare: flight.fare
            });

            return (
              <div
                key={flight.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-6 relative flex flex-col justify-between"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFromComparison(flight.id)}
                  className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Remove from comparison"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="space-y-4">
                  
                  {/* Airline & Number */}
                  <div className="pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-400">
                        {flight.airlineCode}
                      </span>
                      <span className="font-semibold text-white text-sm">{flight.airlineName}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {flight.flightNumber} · Airbus A320/321
                    </div>
                  </div>

                  {/* Big Price */}
                  <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-center">
                    <div className="text-xs text-slate-400">Total Price</div>
                    <div className="text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
                      ₹{flight.fare.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Base ₹{flight.baseFare.toLocaleString('en-IN')} + ₹{flight.taxesAndFees.toLocaleString('en-IN')} Tax
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Timing</span>
                      <span className="font-mono font-bold text-white">{depTime} → {arrTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Route</span>
                      <span className="font-mono text-sky-400">{flight.origin} - {flight.destination}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Total Duration</span>
                      <span className="font-mono">{durHours}h {durMins}m</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Stops</span>
                      <span className={flight.stops === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                        {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
                      </span>
                    </div>
                  </div>

                  {/* ML Assessment */}
                  <div className="space-y-2 text-xs">
                    <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Price Intelligence</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex justify-between text-slate-300">
                        <span>Classification</span>
                        <span className={`font-semibold ${
                          intelligence.assessment === 'RELATIVELY_LOW'
                            ? 'text-emerald-400'
                            : intelligence.assessment === 'RELATIVELY_HIGH'
                            ? 'text-rose-400'
                            : 'text-sky-400'
                        }`}>
                          {intelligence.assessment.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono">
                        <span>Predicted Fare</span>
                        <span>₹{prediction.predictedFare.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono">
                        <span>30-Day Median</span>
                        <span>₹{intelligence.historicalMean.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Baggage & In-flight Service */}
                  <div className="space-y-2 py-3 border-t border-slate-800/80 text-xs">
                    <div className="text-xs font-semibold text-slate-200">Amenities & Baggage</div>
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Luggage className="h-3.5 w-3.5" /> Check-in Bag
                      </span>
                      <span className="font-mono font-medium text-white">{flight.fareRestrictions.baggageCheckinKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Luggage className="h-3.5 w-3.5" /> Cabin Bag
                      </span>
                      <span className="font-mono font-medium text-white">{flight.fareRestrictions.baggageCabinKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Utensils className="h-3.5 w-3.5" /> Meal
                      </span>
                      <span>{flight.fareRestrictions.mealIncluded ? 'Included' : 'Chargeable'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Cancellation
                      </span>
                      <span className={flight.fareRestrictions.refundable ? 'text-emerald-400' : 'text-slate-400'}>
                        {flight.fareRestrictions.refundable ? `₹${flight.fareRestrictions.cancellationFee}` : 'Non-refundable'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Booking link */}
                <a
                  href={flight.bookingUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Select & Book</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
