import React from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { formatCurrency } from '../utils/currency';
import { ArrowRight, ArrowLeftRight, TrendingDown, Sparkles, Activity, ShieldCheck, Search, Globe } from 'lucide-react';

export const Home: React.FC = () => {
  const { setActiveTab, searchParams, setSearchParams, currency } = useApp();

  const handleSwapAirports = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('search');
  };

  const popularCorridors = [
    {
      origin: 'JFK',
      destination: 'LHR',
      originCity: 'New York',
      destinationCity: 'London',
      image: '/src/assets/images/hero_aircraft_sky_1793549856138.jpg',
      avgFare: 42000,
      lowestSeen: 34500,
      typicalWindow: '28-60 days out',
      dealIndex: 'Transatlantic'
    },
    {
      origin: 'DEL',
      destination: 'BOM',
      originCity: 'New Delhi',
      destinationCity: 'Mumbai',
      image: '/src/assets/images/delhi_mumbai_skyline_1793549855927.jpg',
      avgFare: 4950,
      lowestSeen: 4100,
      typicalWindow: '21-35 days out',
      dealIndex: 'Prime Domestic'
    },
    {
      origin: 'LHR',
      destination: 'DXB',
      originCity: 'London',
      destinationCity: 'Dubai',
      image: '/src/assets/images/bengaluru_airport_vista_1793549857175.jpg',
      avgFare: 38000,
      lowestSeen: 31200,
      typicalWindow: '25-45 days out',
      dealIndex: 'Middle East Hub'
    }
  ];

  const handleCorridorClick = (origin: string, destination: string) => {
    setSearchParams(prev => ({
      ...prev,
      origin,
      destination
    }));
    setActiveTab('search');
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        {/* Background Visual with measured contrast scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_aircraft_sky_1793549856138.jpg"
            alt="Commercial airliner in twilight flight"
            className="w-full h-full object-cover object-center opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-12 md:py-16 lg:px-12 max-w-5xl mx-auto">
          
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Predictive Airfare Intelligence for Global Travellers
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Combine actual flight offers with calibrated machine-learning price predictions, 30-day corridor analytics, and automated price drop tracking across worldwide currencies.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="mt-10 p-4 sm:p-6 rounded-xl border border-slate-800/90 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
                
                {/* Origin */}
                <div className="md:col-span-4">
                  <AirportInput
                    label="Origin Airport"
                    value={searchParams.origin}
                    onChange={code => setSearchParams(prev => ({ ...prev, origin: code }))}
                    type="origin"
                  />
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={handleSwapAirports}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition"
                    title="Swap Origin and Destination"
                    aria-label="Swap airports"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Destination */}
                <div className="md:col-span-4">
                  <AirportInput
                    label="Destination Airport"
                    value={searchParams.destination}
                    onChange={code => setSearchParams(prev => ({ ...prev, destination: code }))}
                    type="destination"
                  />
                </div>

                {/* Departure Date */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Departure
                  </label>
                  <input
                    type="date"
                    value={searchParams.departureDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full p-3 text-xs font-mono font-medium rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

              </div>

              {/* Sub-bar: Passengers, Cabin, Search CTA */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Cabin:</span>
                    <select
                      value={searchParams.cabinClass}
                      onChange={e => setSearchParams(prev => ({ ...prev, cabinClass: e.target.value as any }))}
                      className="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Business Class</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Passengers:</span>
                    <select
                      value={searchParams.passengers}
                      onChange={e => setSearchParams(prev => ({ ...prev, passengers: Number(e.target.value) }))}
                      className="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="1">1 Adult</option>
                      <option value="2">2 Adults</option>
                      <option value="3">3 Adults</option>
                      <option value="4">4 Adults</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-sky-400 text-slate-950 hover:bg-sky-300 transition flex items-center gap-2 shadow-md whitespace-nowrap"
                >
                  <Search className="h-4 w-4" />
                  <span>Search Flights & Predict Price</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* Featured Indian Flight Corridors */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-400" />
              <span>High-Frequency Global Air Corridors</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live fare intelligence, 30-day benchmark ranges, and historical booking sweet spots.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>Explore All Corridors</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularCorridors.map(c => (
            <div
              key={`${c.origin}-${c.destination}`}
              onClick={() => handleCorridorClick(c.origin, c.destination)}
              className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden hover:border-slate-700 transition shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-800">
                <img
                  src={c.image}
                  alt={`${c.originCity} to ${c.destinationCity}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <div className="text-sm font-bold">{c.originCity} → {c.destinationCity}</div>
                    <div className="text-xs font-mono text-sky-300">{c.origin} · {c.destination}</div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-sky-400">
                    {c.dealIndex}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                  <span>30-Day Median</span>
                  <span className="text-white font-semibold">{formatCurrency(c.avgFare, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                  <span>Recent Low</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(c.lowestSeen, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Optimal Booking Window</span>
                  <span className="text-slate-300">{c.typicalWindow}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                  <span>Check Current Flights</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FPPS Intelligence Pillars */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Architecture for Realistic Fare Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered specifically for the dynamic pricing patterns of the Indian aviation market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Machine-Learning Price Predictions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained on 124,500 domestic records evaluating route distance, booking window dynamics, day of week, time slots, airline tiers, and Indian festival surges (Diwali, Holi, Summer).
            </p>
            <div className="text-xs text-sky-400 font-mono pt-1">
              MAE ₹542.80 · R² 0.882 Accuracy
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Historical Fare Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular 30-day time series, carrier price distributions, on-time punctuality percentages, and booking window decay curves rendered using responsive Recharts.
            </p>
            <div className="text-xs text-emerald-400 font-mono pt-1">
              4,000+ Recorded Observations
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automated Price Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor chosen itineraries persistently. Set target thresholds in ₹ and receive in-app notifications whenever fares drop or drop below the 30-day route average.
            </p>
            <div className="text-xs text-amber-400 font-mono pt-1">
              In-app & Real-time Trigger Checks
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
