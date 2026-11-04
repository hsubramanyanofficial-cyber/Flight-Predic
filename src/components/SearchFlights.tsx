import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { FlightCard } from './FlightCard';
import { FlightMap } from './FlightMap';
import { CurrencyConverterWidget } from './CurrencyConverterWidget';
import { FlightOffer, PricePrediction, PriceIntelligence } from '../types';
import * as api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { ArrowLeftRight, SlidersHorizontal, ArrowUpDown, Sparkles, AlertCircle, RefreshCw, Info, Calendar } from 'lucide-react';

export const SearchFlights: React.FC = () => {
  const { searchParams, setSearchParams, setActiveTab, currency } = useApp();

  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  
  // Results & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [intelligence, setIntelligence] = useState<PriceIntelligence | null>(null);
  const [providerInfo, setProviderInfo] = useState<{ configured: boolean; providerName: string; mode: string; notice?: string } | null>(null);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState<'recommended' | 'price' | 'duration' | 'departure'>('recommended');
  const [filterStops, setFilterStops] = useState<number | 'all'>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [filterRefundableOnly, setFilterRefundableOnly] = useState(false);

  const executeSearch = async () => {
    if (searchParams.origin === searchParams.destination) {
      setError('Origin and destination airports cannot be identical.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await api.searchFlights({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: isRoundTrip ? returnDate : undefined,
        passengers: searchParams.passengers,
        cabinClass: searchParams.cabinClass,
        sortBy
      });

      setOffers(data.offers);
      setPrediction(data.prediction);
      setIntelligence(data.intelligence);
      setProviderInfo(data.provider);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch flight offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [searchParams.origin, searchParams.destination, searchParams.departureDate, searchParams.cabinClass, sortBy]);

  const handleSwap = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  // Filter client-side
  const filteredOffers = offers.filter(offer => {
    if (filterStops !== 'all' && offer.stops !== filterStops) return false;
    if (filterAirline !== 'all' && offer.airlineName !== filterAirline && offer.airlineCode !== filterAirline) return false;
    if (filterRefundableOnly && !offer.fareRestrictions.refundable) return false;
    return true;
  });

  const airlinesPresent = Array.from(new Set(offers.map(o => o.airlineName)));
  const lowestOfferFare = offers.length > 0 ? Math.min(...offers.map(o => o.fare)) : undefined;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Search Header Form */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-5">
        
        {/* Trip type selector */}
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tripType"
              checked={!isRoundTrip}
              onChange={() => setIsRoundTrip(false)}
              className="text-sky-500 focus:ring-sky-500"
            />
            <span>One Way</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tripType"
              checked={isRoundTrip}
              onChange={() => {
                setIsRoundTrip(true);
                if (!returnDate) {
                  const ret = new Date(searchParams.departureDate);
                  ret.setDate(ret.getDate() + 5);
                  setReturnDate(ret.toISOString().split('T')[0]);
                }
              }}
              className="text-sky-500 focus:ring-sky-500"
            />
            <span>Round Trip</span>
          </label>
        </div>

        {/* Airport and Date row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          
          <div className="md:col-span-3">
            <AirportInput
              label="From"
              value={searchParams.origin}
              onChange={code => setSearchParams(prev => ({ ...prev, origin: code }))}
              type="origin"
            />
          </div>

          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={handleSwap}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition"
              title="Swap Airports"
              aria-label="Swap airports"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div className="md:col-span-3">
            <AirportInput
              label="To"
              value={searchParams.destination}
              onChange={code => setSearchParams(prev => ({ ...prev, destination: code }))}
              type="destination"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Depart
            </label>
            <input
              type="date"
              value={searchParams.departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {isRoundTrip && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Return
              </label>
              <input
                type="date"
                value={returnDate}
                min={searchParams.departureDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full p-3 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div className={isRoundTrip ? 'md:col-span-1' : 'md:col-span-3'}>
            <button
              onClick={executeSearch}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Searching...' : 'Search Offers'}</span>
            </button>
          </div>

        </div>

        {/* Options & Preferences strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Cabin:</span>
              <select
                value={searchParams.cabinClass}
                onChange={e => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value as any }))}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>Passengers:</span>
              <select
                value={searchParams.passengers}
                onChange={e => setSearchParams(prev => ({ ...prev, passengers: Number(e.target.value) }))}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
              </select>
            </div>
          </div>

          {/* Active Provider Indicator */}
          {providerInfo && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Engine: {providerInfo.providerName}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{providerInfo.mode} Mode</span>
            </div>
          )}
        </div>

      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Intelligence & Prediction Summary Bar */}
      {prediction && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* ML Prediction Overview Card */}
          <div className="md:col-span-8 p-5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-slate-200 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>ML Airfare Prediction</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] font-mono lowercase text-slate-400">{prediction.modelVersion}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Expected Fare: {formatCurrency(prediction.predictedFare, currency)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  90% Confidence Interval: {formatCurrency(prediction.lowerBoundFare, currency)} – {formatCurrency(prediction.upperBoundFare, currency)}
                </p>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                  prediction.advice === 'BUY_NOW'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : prediction.advice === 'WAIT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {prediction.advice === 'BUY_NOW' ? 'RECOMMENDED TO BOOK NOW' : prediction.advice === 'WAIT' ? 'WAIT FOR BETTER DEAL' : 'FAIR MARKET VALUE'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {prediction.features.daysToDeparture} days until travel
                </p>
              </div>
            </div>

            {/* Factors breakdown */}
            <div className="mt-4 pt-3 border-t border-sky-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                {prediction.factors.slice(0, 2).map((fac, idx) => (
                  <span key={idx} className="font-mono text-[11px] text-slate-400">
                    {fac.impactInr > 0 ? `+₹${fac.impactInr}` : `-₹${Math.abs(fac.impactInr)}`} ({fac.factor})
                  </span>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('predictions')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap"
              >
                Inspect Prediction Factors →
              </button>
            </div>
          </div>

          {/* 30-Day Historical Corridor Benchmark */}
          {intelligence && (
            <div className="md:col-span-4 p-5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Corridor Benchmark</span>
                  <span className="font-mono">{searchParams.origin}-{searchParams.destination}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">30-Day Average</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {formatCurrency(intelligence.historicalMean, currency)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {intelligence.explanation}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-400">Sample: 4,000+ flights</span>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="font-semibold text-sky-400 hover:text-sky-300"
                >
                  View Charts →
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Real-Time Currency Conversion Tool */}
      <CurrencyConverterWidget
        lowestFareInr={lowestOfferFare}
        expectedFareInr={prediction?.predictedFare}
      />

      {/* Results Controls Bar (Sorting & Filtering) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Stops:</span>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setFilterStops('all')}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  filterStops === 'all' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStops(0)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  filterStops === 0 ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Non-stop
              </button>
              <button
                onClick={() => setFilterStops(1)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  filterStops === 1 ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                1 Stop
              </button>
            </div>
          </div>

          {/* Airline Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Airline:</span>
            <select
              value={filterAirline}
              onChange={e => setFilterAirline(e.target.value)}
              className="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All Airlines</option>
              {airlinesPresent.map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          </div>

          {/* Refundable Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={filterRefundableOnly}
              onChange={e => setFilterRefundableOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
            />
            <span>Refundable only</span>
          </label>
        </div>

        {/* Right: Sort By */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-white rounded border border-slate-700 px-2.5 py-1 text-xs focus:outline-none font-medium"
          >
            <option value="recommended">Recommended Value</option>
            <option value="price">Cheapest First</option>
            <option value="duration">Fastest Duration</option>
            <option value="departure">Earliest Departure</option>
          </select>
        </div>

      </div>

      {/* Interactive Flight Path Map Component */}
      <FlightMap
        originCode={searchParams.origin}
        destinationCode={searchParams.destination}
        comparedFlights={offers}
      />

      {/* Flight Offers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="py-16 text-center border border-slate-800 rounded-2xl bg-slate-900/40 space-y-3">
            <Info className="mx-auto h-8 w-8 text-slate-500" />
            <h3 className="text-base font-semibold text-white">No flights matching criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your stop limits or airline filters, or choose a different travel date.
            </p>
          </div>
        ) : (
          filteredOffers.map(offer => (
            <FlightCard
              key={offer.id}
              flight={offer}
              prediction={prediction || undefined}
              intelligence={intelligence}
            />
          ))
        )}
      </div>

    </div>
  );
};
