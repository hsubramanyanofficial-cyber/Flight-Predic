/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { formatCurrency } from '../utils/currency';
import {
  ArrowRight,
  ArrowLeftRight,
  TrendingDown,
  Sparkles,
  Activity,
  ShieldCheck,
  Search,
  Globe,
  Plane,
  Compass,
  Luggage,
  Gamepad2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Zap,
  Users
} from 'lucide-react';

export const Home: React.FC = () => {
  const { setActiveTab, searchParams, setSearchParams, currency } = useApp();

  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [returnDate, setReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const quickRoutes = [
    { origin: 'DEL', destination: 'DXB', originCity: 'New Delhi', destinationCity: 'Dubai', priceInr: 14200, label: 'Bestseller' },
    { origin: 'BOM', destination: 'LHR', originCity: 'Mumbai', destinationCity: 'London', priceInr: 38000, label: 'Prime Long-Haul' },
    { origin: 'BLR', destination: 'SIN', originCity: 'Bengaluru', destinationCity: 'Singapore', priceInr: 11900, label: 'Best Value' },
    { origin: 'DEL', destination: 'BOM', originCity: 'New Delhi', destinationCity: 'Mumbai', priceInr: 4150, label: 'Top Domestic' },
    { origin: 'JFK', destination: 'LHR', originCity: 'New York', destinationCity: 'London', priceInr: 34500, label: 'Transatlantic' },
    { origin: 'BOM', destination: 'GOI', originCity: 'Mumbai', destinationCity: 'Goa', priceInr: 2850, label: 'Weekend Getaway' },
  ];

  const handleQuickRouteSelect = (origin: string, destination: string) => {
    setSearchParams(prev => ({
      ...prev,
      origin,
      destination
    }));
    setActiveTab('search');
  };

  const popularCorridors = [
    {
      origin: 'DEL',
      destination: 'DXB',
      originCity: 'New Delhi',
      destinationCity: 'Dubai',
      image: '/src/assets/images/bengaluru_airport_vista_1793549857175.jpg',
      avgFare: 16500,
      lowestSeen: 13800,
      typicalWindow: '21-45 days out',
      dealIndex: 'Middle East Gateway',
      flightTime: '3h 45m',
      carriers: 'IndiGo, Emirates, Air India'
    },
    {
      origin: 'DEL',
      destination: 'BOM',
      originCity: 'New Delhi',
      destinationCity: 'Mumbai',
      image: '/src/assets/images/delhi_mumbai_skyline_1793549855927.jpg',
      avgFare: 4950,
      lowestSeen: 4100,
      typicalWindow: '14-30 days out',
      dealIndex: 'Prime Trunk Route',
      flightTime: '2h 10m',
      carriers: 'Air India, IndiGo, Akasa'
    },
    {
      origin: 'JFK',
      destination: 'LHR',
      originCity: 'New York',
      destinationCity: 'London',
      image: '/src/assets/images/hero_aircraft_sky_1793549856138.jpg',
      avgFare: 42000,
      lowestSeen: 34500,
      typicalWindow: '28-60 days out',
      dealIndex: 'Transatlantic Classic',
      flightTime: '6h 50m',
      carriers: 'British Airways, Virgin, Delta'
    }
  ];

  const faqs = [
    {
      q: 'When is the optimal time to book domestic and international flights?',
      a: 'Our machine learning models analyzed 124,500+ records and reveal that domestic Indian flights hit their lowest price between 21 and 35 days before departure. For international flights from India (such as London, Dubai, or Singapore), the optimal window is 45 to 75 days out. Booking closer than 14 days out usually triggers dynamic airline surge algorithms that can increase fares by 40%–80%.'
    },
    {
      q: 'How do the ML price predictions and confidence scores work?',
      a: 'FPPS uses an ensemble machine learning regressor trained on actual historical airline observations. The model correlates 12 critical features: advance purchase window, historical route variance, airline tier, departure time of day, day of week, seasonal festival surcharges (such as Diwali, Chhath, and summer vacation), and seat capacity decay curves. Predictions include an expected fare, dynamic confidence bounds, and actionable buy/wait advice.'
    },
    {
      q: 'How does the Baggage Fees Calculator help me save money?',
      a: 'Airlines charge strict excess baggage penalty rates at airport check-in counters (typically ₹550–₹650 per kg for domestic Indian carriers and ₹1,800–₹2,400 per kg for international flights). By calculating your luggage weight in advance and pre-booking through the airline, you save an average of 25% to 50% on baggage fees.'
    },
    {
      q: 'What does the AI Packing Checklist consider when creating recommendations?',
      a: 'The checklist engine calls Gemini AI to evaluate destination meteorological patterns, seasonal temperature ranges, humidity, and duration for your exact travel dates. It customizes clothing counts (scaled to your trip length) and enforces essential aviation compliance rules—such as carrying power banks in hand luggage only and restricting carry-on liquids to ≤100ml transparent containers.'
    }
  ];

  return (
    <div className="space-y-16 pb-24">
      
      {/* Grand Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        {/* Background Visual Scrim with measured contrast */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_aircraft_sky_1793549856138.jpg"
            alt="Commercial airliner cruising in sunset sky"
            className="w-full h-full object-cover object-center opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/40" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-5 py-12 sm:px-8 md:py-16 lg:px-12 max-w-6xl mx-auto">
          
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Global Airfare Intelligence · ML Price Forecasting & Route Analytics</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Predict Airfares. Fly Smarter Worldwide.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Real-time flight offers combined with calibrated machine-learning price predictions, 30-day route analytics, automated price drop alerts, and intelligent multi-city trip planning.
            </p>
          </div>

          {/* Quick Popular Route Chips (Grand & One-Tap Easy) */}
          <div className="mt-8 pt-4 border-t border-slate-800/60 max-w-4xl mx-auto">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>One-Click Popular Routes</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto pb-2 scrollbar-none flex-wrap">
              {quickRoutes.map(qr => (
                <button
                  key={`${qr.origin}-${qr.destination}`}
                  type="button"
                  onClick={() => handleQuickRouteSelect(qr.origin, qr.destination)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 hover:border-sky-500/50 text-xs text-slate-200 transition group cursor-pointer shadow-sm"
                >
                  <Plane className="h-3 w-3 text-sky-400 group-hover:rotate-45 transition-transform" />
                  <span className="font-bold font-mono">{qr.origin} ➔ {qr.destination}</span>
                  <span className="text-slate-400 hidden sm:inline">({qr.destinationCity})</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(qr.priceInr, currency)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grand Search Console */}
          <div className="mt-4 p-5 sm:p-7 rounded-2xl border border-slate-800/90 bg-slate-900/95 backdrop-blur-2xl shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="space-y-5">
              
              {/* Trip Type & Cabin Class Pills */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRoundTrip(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      !isRoundTrip ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoundTrip(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isRoundTrip ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Round Trip
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    {(['economy', 'premium_economy', 'business'] as const).map(cClass => (
                      <button
                        key={cClass}
                        type="button"
                        onClick={() => setSearchParams(prev => ({ ...prev, cabinClass: cClass }))}
                        className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                          searchParams.cabinClass === cClass
                            ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cClass.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={searchParams.passengers}
                      onChange={e => setSearchParams(prev => ({ ...prev, passengers: Number(e.target.value) }))}
                      className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="1">1 Passenger</option>
                      <option value="2">2 Passengers</option>
                      <option value="3">3 Passengers</option>
                      <option value="4">4 Passengers</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Airport & Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                
                {/* Origin */}
                <div className="md:col-span-3">
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
                    className="h-11 w-11 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white hover:border-sky-500/60 transition cursor-pointer shadow-sm"
                    title="Swap Origin and Destination"
                    aria-label="Swap airports"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Destination */}
                <div className="md:col-span-3">
                  <AirportInput
                    label="Destination Airport"
                    value={searchParams.destination}
                    onChange={code => setSearchParams(prev => ({ ...prev, destination: code }))}
                    type="destination"
                  />
                </div>

                {/* Departure Date */}
                <div className={isRoundTrip ? 'md:col-span-2' : 'md:col-span-3'}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={searchParams.departureDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full p-3 text-xs font-mono font-medium rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Return Date (if Round-trip) */}
                {isRoundTrip ? (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      min={searchParams.departureDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full p-3 text-xs font-mono font-medium rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                ) : (
                  /* Action CTA in row */
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-[46px] text-xs sm:text-sm font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 whitespace-nowrap cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                      <span>Search Flights</span>
                    </button>
                  </div>
                )}

              </div>

              {/* If Round trip, show full-width search CTA */}
              {isRoundTrip && (
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 text-sm font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Round-Trip Flights & Predict Fare</span>
                  </button>
                </div>
              )}

            </form>
          </div>

          {/* Live Market Stats Ticker */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">Live Fare Engine:</span>
              <span>124,500+ Verified Observations</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Forecast Precision: <strong className="text-sky-300">R² 0.882 / MAE ₹542</strong></span>
              <span className="hidden sm:inline text-slate-600">·</span>
              <span className="hidden sm:inline">Active Currency: <strong className="text-white">{currency}</strong></span>
            </div>
          </div>

        </div>
      </section>

      {/* Featured 3D Flight Experience Banner */}
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-sky-500/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive 3D WebGL Flight Experience</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            3D Skyway Ace Simulator & Airline Liveries
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Fly a procedural 3D commercial airliner through dynamic cloudscapes and skyways. Switch between authentic liveries (IndiGo, Air India, Emirates, British Airways, Singapore Airlines) with procedural jet acoustics.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('game')}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          <Plane className="h-4 w-4" />
          <span>Launch 3D Flight Simulator</span>
        </button>
      </section>

      {/* High-Frequency Global Air Corridors */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-400" />
              <span>High-Frequency Global Air Corridors</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time benchmark fares, 30-day historical fluctuations, and optimal advance purchase windows.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All Corridors</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularCorridors.map(c => (
            <div
              key={`${c.origin}-${c.destination}`}
              onClick={() => handleQuickRouteSelect(c.origin, c.destination)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden hover:border-sky-500/50 hover:shadow-2xl transition duration-300 flex flex-col justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-800">
                <img
                  src={c.image}
                  alt={`${c.originCity} to ${c.destinationCity}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <div className="text-base font-bold">{c.originCity} ➔ {c.destinationCity}</div>
                    <div className="text-xs font-mono text-sky-300">{c.origin} · {c.destination} · {c.flightTime}</div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-sky-300">
                    {c.dealIndex}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>30-Day Median Fare</span>
                  <span className="text-white font-semibold">{formatCurrency(c.avgFare, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Recent Low</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(c.lowestSeen, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Booking Sweet Spot</span>
                  <span className="text-slate-300 font-medium">{c.typicalWindow}</span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                  <span>Inspect Live Flights</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FPPS Grand Operations Pillars: Trip Planner, ML Forecasting, Price Alerts */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Comprehensive Airfare Engineering Suite
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered to remove friction from complex flight booking, multi-city travel, and dynamic airline pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Trip Planner & Luggage */}
          <div
            onClick={() => setActiveTab('trips')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-4 group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                Multi-City Trip Planner
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Organize multi-leg global itineraries, calculate airline baggage excess fees, generate destination climate packing lists with AI, and export to calendar (.ics).
              </p>
            </div>
            <div className="text-xs text-purple-400 font-semibold flex items-center gap-1 pt-1">
              <span>Open Trip Planner</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: ML Airfare Forecast */}
          <div
            onClick={() => setActiveTab('predictions')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-4 group"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition">
                ML Price Prediction Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Trained on 124,500 flight observations analyzing days-to-departure, festival peaks (Diwali, Holi), airline tiering, and historical route variance with R² 0.882 accuracy.
              </p>
            </div>
            <div className="text-xs text-sky-400 font-semibold flex items-center gap-1 pt-1">
              <span>Inspect ML Model</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Price Drop Alerts */}
          <div
            onClick={() => setActiveTab('tracked')}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-4 group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Automated Price Alerts
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Track flights effortlessly. Set customized target price thresholds and receive in-app notifications whenever fares drop below your budget or route averages.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
              <span>View Tracked Flights</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Airfare Intelligence & FAQ Accordion */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Traveler Intelligence & Airline Regulations FAQ
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Essential facts on dynamic pricing, DGCA passenger protection guidelines, and luggage allowances.
          </p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-200 hover:text-white transition gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-sky-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed pr-6 animate-in fade-in duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
