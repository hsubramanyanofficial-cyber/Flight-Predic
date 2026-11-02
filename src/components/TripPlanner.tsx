import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TripItinerary, TripLeg, CabinClass, TrackedFlight } from '../types';
import { formatCurrency } from '../utils/currency';
import { calculateAirDistanceKm, getAirportByCode, searchAirports } from '../data/airports';
import { AirportInput } from './AirportInput';
import {
  Calendar,
  Compass,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Bell,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Share2,
  Clock,
  Plane,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  CalendarPlus,
  Download,
  Luggage,
  CheckSquare
} from 'lucide-react';
import { downloadTripIcs, downloadLegIcs } from '../utils/icsExport';
import { BaggageFeeCalculator } from './BaggageFeeCalculator';
import { PackingChecklist } from './PackingChecklist';
import { PackingChecklistData } from '../types';

export const TripPlanner: React.FC = () => {
  const {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    addLegToTrip,
    removeLegFromTrip,
    linkTrackedFlightToLeg,
    unlinkTrackedFlightFromLeg,
    trackedFlights,
    trackFlight,
    currency,
    setActiveTab,
    setSearchParams
  } = useApp();

  // Active selected trip
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    return trips.length > 0 ? trips[0].id : '';
  });

  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // Modals state
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isAddLegModalOpen, setIsAddLegModalOpen] = useState(false);
  const [linkingLeg, setLinkingLeg] = useState<TripLeg | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [exportedIcs, setExportedIcs] = useState(false);
  const [exportedLegId, setExportedLegId] = useState<string | null>(null);
  const [tripSubTab, setTripSubTab] = useState<'itinerary' | 'baggage' | 'checklist'>('itinerary');

  // New Trip form state
  const [tripForm, setTripForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    budgetInr: 150000
  });

  // New Leg form state
  const [legForm, setLegForm] = useState({
    origin: 'DEL',
    destination: 'DXB',
    date: '',
    flightNumber: '',
    airlineName: '',
    departureTime: '',
    arrivalTime: '',
    cabinClass: 'economy' as CabinClass,
    fareInr: 15000,
    notes: '',
    linkWithTrackedId: ''
  });

  // Calculate Itinerary stats
  const totalLegs = activeTrip?.legs?.length || 0;
  const totalEstimatedCostInr = activeTrip?.legs?.reduce((sum, leg) => {
    // If linked to tracked flight, use current lowest price
    if (leg.linkedTrackedFlightId) {
      const tf = trackedFlights.find(f => f.id === leg.linkedTrackedFlightId);
      if (tf?.currentLowestPriceInr) return sum + tf.currentLowestPriceInr;
    }
    return sum + (leg.fareInr || 0);
  }, 0) || 0;

  const budgetInr = activeTrip?.budgetInr || 0;
  const budgetVarianceInr = budgetInr - totalEstimatedCostInr;
  const budgetUsedPercent = budgetInr > 0 ? Math.min(Math.round((totalEstimatedCostInr / budgetInr) * 100), 100) : 0;

  // Calculate cumulative air travel distance
  const totalAirDistanceKm = activeTrip?.legs?.reduce((acc, leg) => {
    return acc + calculateAirDistanceKm(leg.origin, leg.destination);
  }, 0) || 0;

  // Open Create Trip Modal
  const handleOpenNewTrip = () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 21);
    setTripForm({
      title: 'Global Exploration 2026',
      description: 'Multi-destination travel itinerary with tracked fare optimization.',
      startDate: today.toISOString().split('T')[0],
      endDate: futureDate.toISOString().split('T')[0],
      budgetInr: 180000
    });
    setIsNewTripModalOpen(true);
  };

  // Submit Create Trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.title.trim()) return;

    const created = await createTrip({
      title: tripForm.title.trim(),
      description: tripForm.description.trim(),
      startDate: tripForm.startDate,
      endDate: tripForm.endDate,
      budgetInr: Number(tripForm.budgetInr) || 0,
      legs: []
    });

    setSelectedTripId(created.id);
    setIsNewTripModalOpen(false);
  };

  // Open Add Leg Modal
  const handleOpenAddLeg = () => {
    if (!activeTrip) return;
    const lastLeg = activeTrip.legs[activeTrip.legs.length - 1];
    const defaultOrigin = lastLeg ? lastLeg.destination : 'DEL';
    const defaultDate = lastLeg ? lastLeg.date : (activeTrip.startDate || new Date().toISOString().split('T')[0]);

    setLegForm({
      origin: defaultOrigin,
      destination: defaultOrigin === 'DEL' ? 'DXB' : 'DEL',
      date: defaultDate,
      flightNumber: '',
      airlineName: '',
      departureTime: '10:00',
      arrivalTime: '13:30',
      cabinClass: 'economy',
      fareInr: 12000,
      notes: '',
      linkWithTrackedId: ''
    });
    setIsAddLegModalOpen(true);
  };

  // Submit Add Leg
  const handleAddLeg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    const originAp = getAirportByCode(legForm.origin);
    const destAp = getAirportByCode(legForm.destination);

    await addLegToTrip(activeTrip.id, {
      origin: legForm.origin,
      destination: legForm.destination,
      originCity: originAp?.city || legForm.origin,
      destinationCity: destAp?.city || legForm.destination,
      date: legForm.date,
      flightNumber: legForm.flightNumber || undefined,
      airlineName: legForm.airlineName || undefined,
      departureTime: legForm.departureTime || undefined,
      arrivalTime: legForm.arrivalTime || undefined,
      cabinClass: legForm.cabinClass,
      fareInr: Number(legForm.fareInr) || 0,
      notes: legForm.notes || undefined,
      status: legForm.linkWithTrackedId ? 'tracked' : 'planned',
      linkedTrackedFlightId: legForm.linkWithTrackedId || undefined
    });

    setIsAddLegModalOpen(false);
  };

  // Quick Action: Search Flights for Leg
  const handleSearchForLeg = (leg: TripLeg) => {
    setSearchParams({
      origin: leg.origin,
      destination: leg.destination,
      departureDate: leg.date,
      passengers: 1,
      cabinClass: leg.cabinClass
    });
    setActiveTab('search');
  };

  // Quick Action: Predict price for Leg
  const handlePredictForLeg = (leg: TripLeg) => {
    setSearchParams({
      origin: leg.origin,
      destination: leg.destination,
      departureDate: leg.date,
      passengers: 1,
      cabinClass: leg.cabinClass
    });
    setActiveTab('predictions');
  };

  // Quick Action: Create a price tracker for this leg and link it
  const handleTrackAndLinkLeg = async (leg: TripLeg) => {
    if (!activeTrip) return;
    try {
      const createdTrack = await trackFlight({
        origin: leg.origin,
        destination: leg.destination,
        originCity: leg.originCity,
        destinationCity: leg.destinationCity,
        departureDate: leg.date,
        cabinClass: leg.cabinClass,
        targetPriceInr: leg.fareInr ? Math.round(leg.fareInr * 0.9) : 10000,
        initialPriceInr: leg.fareInr || 12000,
        preferredAirline: leg.airlineName
      });

      await linkTrackedFlightToLeg(activeTrip.id, leg.id, createdTrack.id);
      setLinkingLeg(null);
    } catch (err) {
      console.error('Failed to create and link tracking:', err);
    }
  };

  // Format Itinerary text for sharing
  const generateItinerarySummary = () => {
    if (!activeTrip) return '';
    let text = `✈️ ITINERARY: ${activeTrip.title.toUpperCase()}\n`;
    if (activeTrip.description) text += `${activeTrip.description}\n`;
    text += `Dates: ${activeTrip.startDate} to ${activeTrip.endDate}\n`;
    text += `Total Distance: ${totalAirDistanceKm.toLocaleString()} km across ${totalLegs} flight legs\n`;
    text += `Estimated Airfare: ${formatCurrency(totalEstimatedCostInr, currency)} / Budget: ${formatCurrency(budgetInr, currency)}\n\n`;
    text += `FLIGHT SEGMENTS:\n`;

    activeTrip.legs.forEach((leg, index) => {
      text += `Leg ${index + 1}: ${leg.originCity} (${leg.origin}) ➔ ${leg.destinationCity} (${leg.destination})\n`;
      text += `  • Date: ${leg.date}\n`;
      if (leg.flightNumber || leg.airlineName) {
        text += `  • Flight: ${leg.airlineName || ''} ${leg.flightNumber || ''}\n`;
      }
      text += `  • Cabin: ${leg.cabinClass.replace('_', ' ')}\n`;
      text += `  • Fare: ${formatCurrency(leg.fareInr || 0, currency)}\n`;
      if (leg.notes) text += `  • Notes: ${leg.notes}\n`;
      text += `\n`;
    });

    text += `Generated with FPPS Global Airfare Intelligence Platform`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateItinerarySummary();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Export full multi-leg itinerary to standard .ics calendar file
  const handleExportToCalendar = () => {
    if (!activeTrip || activeTrip.legs.length === 0) return;
    downloadTripIcs(activeTrip, currency);
    setExportedIcs(true);
    setTimeout(() => setExportedIcs(false), 3000);
  };

  // Export a single flight segment to .ics calendar file
  const handleExportLegToCalendar = (leg: TripLeg) => {
    if (!activeTrip) return;
    downloadLegIcs(leg, activeTrip.title, currency);
    setExportedLegId(leg.id);
    setTimeout(() => setExportedLegId(null), 3000);
  };

  // Apply calculated pre-booking baggage fees to a trip leg
  const handleUpdateLegFare = (legId: string, additionalBaggageFeeInr: number) => {
    if (!activeTrip) return;
    const updatedLegs = activeTrip.legs.map(leg => {
      if (leg.id === legId) {
        return {
          ...leg,
          fareInr: (leg.fareInr || 0) + additionalBaggageFeeInr,
          notes: leg.notes
            ? `${leg.notes} · Includes +₹${additionalBaggageFeeInr.toLocaleString('en-IN')} baggage`
            : `Includes +₹${additionalBaggageFeeInr.toLocaleString('en-IN')} pre-booked baggage`
        };
      }
      return leg;
    });
    updateTrip(activeTrip.id, { legs: updatedLegs });
  };

  // Persist updated checklist data to active trip
  const handleUpdateTripChecklist = (tripId: string, checklist: PackingChecklistData) => {
    updateTrip(tripId, { packingChecklist: checklist });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Compass className="h-3 w-3" /> Multi-City Trip Planner
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Fare Alerts & Itinerary Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Plan Multi-City Global Itineraries
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Organize complex multi-destination flight legs, monitor cumulative airfare against your trip budget, and directly attach real-time price alerts to specific travel dates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleExportToCalendar}
            disabled={!activeTrip || activeTrip.legs.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold transition disabled:opacity-40 disabled:pointer-events-none shadow-sm cursor-pointer"
            title="Export organized flight segments to an .ics calendar file for Apple Calendar, Google Calendar, Outlook, etc."
          >
            {exportedIcs ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Calendar Exported!</span>
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4 text-sky-400" />
                <span>Export to Calendar (.ics)</span>
              </>
            )}
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-850 text-slate-200 text-xs font-medium transition"
            title="Copy formatted itinerary summary"
          >
            {copiedSummary ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span>{copiedSummary ? 'Copied Summary' : 'Share Itinerary'}</span>
          </button>

          <button
            onClick={handleOpenNewTrip}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700 shadow-sm"
          >
            <Plus className="h-4 w-4 text-sky-400" />
            <span>New Trip</span>
          </button>

          <button
            onClick={handleOpenAddLeg}
            disabled={!activeTrip}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            <Plane className="h-4 w-4" />
            <span>Add Flight Leg</span>
          </button>
        </div>
      </div>

      {/* Itinerary Selection Bar if multiple trips exist */}
      {trips.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            Saved Trips ({trips.length}):
          </span>
          {trips.map(trip => (
            <button
              key={trip.id}
              onClick={() => setSelectedTripId(trip.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                activeTrip?.id === trip.id
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{trip.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                {trip.legs.length} legs
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Trip Feature Mode Switcher Tabs */}
      {activeTrip && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTripSubTab('itinerary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
              tripSubTab === 'itinerary'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Plane className="h-4 w-4" />
            <span>Itinerary & Flight Legs</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              tripSubTab === 'itinerary' ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalLegs}
            </span>
          </button>

          <button
            onClick={() => setTripSubTab('baggage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
              tripSubTab === 'baggage'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Luggage className="h-4 w-4" />
            <span>Baggage Fees Calculator</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              tripSubTab === 'baggage' ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              Airline Rules & Tariffs
            </span>
          </button>

          <button
            onClick={() => setTripSubTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
              tripSubTab === 'checklist'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Packing Checklist</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              tripSubTab === 'checklist' ? 'bg-slate-950/20 text-white font-bold' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            }`}>
              Climate Intelligence
            </span>
          </button>
        </div>
      )}

      {/* Main Active Itinerary Dashboard or Sub-Views */}
      {activeTrip ? (
        tripSubTab === 'baggage' ? (
          <BaggageFeeCalculator
            activeTrip={activeTrip}
            onUpdateLegFare={handleUpdateLegFare}
          />
        ) : tripSubTab === 'checklist' ? (
          <PackingChecklist
            activeTrip={activeTrip}
            onUpdateTripChecklist={handleUpdateTripChecklist}
          />
        ) : (
          <div className="space-y-6">
            {/* Card 1: Overview, Budget Progress, and Route Path */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeTrip.title}
                  </h2>
                  <button
                    onClick={() => {
                      setTripForm({
                        title: activeTrip.title,
                        description: activeTrip.description || '',
                        startDate: activeTrip.startDate,
                        endDate: activeTrip.endDate,
                        budgetInr: activeTrip.budgetInr || 150000
                      });
                      setIsEditTripModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    title="Edit Trip Title and Budget"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {trips.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the trip "${activeTrip.title}"?`)) {
                          deleteTrip(activeTrip.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                      title="Delete Trip"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {activeTrip.description && (
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    {activeTrip.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    {activeTrip.startDate} → {activeTrip.endDate}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-emerald-400" />
                    {totalLegs} Flight Segments
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    ~{totalAirDistanceKm.toLocaleString()} km Total Great Circle Flight Distance
                  </span>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setTripSubTab('baggage')}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition cursor-pointer"
                    title="Open Baggage Fees Calculator"
                  >
                    <Luggage className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Baggage Rules</span>
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setTripSubTab('checklist')}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-purple-400 transition cursor-pointer"
                    title="Open AI Packing Checklist"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>AI Packing List</span>
                  </button>
                </div>
              </div>

              {/* Budget / Cost Widget */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 min-w-[260px] shrink-0">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Itinerary Airfare Budget</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(budgetInr, currency)}
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      budgetUsedPercent > 95
                        ? 'bg-rose-500'
                        : budgetUsedPercent > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${budgetUsedPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Current Total</span>
                    <span className="font-mono font-bold text-sky-300">
                      {formatCurrency(totalEstimatedCostInr, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {budgetVarianceInr >= 0 ? 'Surplus Left' : 'Over Budget'}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        budgetVarianceInr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(Math.abs(budgetVarianceInr), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Route Journey Path */}
            {activeTrip.legs.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Multi-City Flight Routing Sequence
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {activeTrip.legs.map((leg, idx) => (
                    <React.Fragment key={leg.id}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                            <span>{leg.origin}</span>
                            <ArrowRight className="h-3 w-3 text-slate-500" />
                            <span>{leg.destination}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {leg.date} · {leg.destinationCity}
                          </div>
                        </div>
                      </div>
                      {idx < activeTrip.legs.length - 1 && (
                        <div className="h-0.5 w-6 bg-slate-800 shrink-0 relative flex items-center justify-center">
                          <Plane className="h-3 w-3 text-slate-600 rotate-90" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Flight Legs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Travel Legs & Linked Price Alerts
                </h3>
                <p className="text-xs text-slate-400">
                  Manage individual flight legs, link active price trackers, or search live airfares.
                </p>
              </div>

              <button
                onClick={handleOpenAddLeg}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
              >
                <Plus className="h-3.5 w-3.5 text-sky-400" />
                <span>Add Leg</span>
              </button>
            </div>

            {activeTrip.legs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                <Plane className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">No flight legs added yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Add your first flight segment to start organizing dates, routing, and tracking live airfare changes.
                </p>
                <button
                  onClick={handleOpenAddLeg}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Flight Leg</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrip.legs.map((leg, index) => {
                  const linkedTrackedFlight = leg.linkedTrackedFlightId
                    ? trackedFlights.find(tf => tf.id === leg.linkedTrackedFlightId)
                    : null;

                  const airDistanceKm = calculateAirDistanceKm(leg.origin, leg.destination);

                  return (
                    <div
                      key={leg.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md hover:border-slate-700 transition shadow-lg relative group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        {/* Leg Origin / Destination Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-sky-400 border border-slate-700">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Leg {index + 1}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {leg.date}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize border border-slate-700">
                              {leg.cabinClass.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-xl font-black text-white font-mono tracking-wider">
                                {leg.origin}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {leg.originCity}
                              </div>
                            </div>

                            <div className="flex flex-col items-center px-2">
                              <span className="text-[10px] text-slate-500 font-mono mb-0.5">
                                {airDistanceKm.toLocaleString()} km
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <div className="h-0.5 w-8 bg-slate-700" />
                                <Plane className="h-3.5 w-3.5 text-sky-400" />
                                <div className="h-0.5 w-8 bg-slate-700" />
                              </div>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Direct / Non-stop
                              </span>
                            </div>

                            <div>
                              <div className="text-xl font-black text-white font-mono tracking-wider">
                                {leg.destination}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {leg.destinationCity}
                              </div>
                            </div>
                          </div>

                          {/* Flight details if present */}
                          {(leg.flightNumber || leg.airlineName || leg.notes) && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                              {leg.airlineName && (
                                <span className="font-medium text-slate-300">
                                  {leg.airlineName} {leg.flightNumber}
                                </span>
                              )}
                              {leg.notes && (
                                <span className="italic text-slate-500 text-[11px]">
                                  "{leg.notes}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Linked Tracked Flight Status Box */}
                        <div className="lg:w-80 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shrink-0">
                          {linkedTrackedFlight ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Tracked Alert Active
                                </span>
                                <button
                                  onClick={() => unlinkTrackedFlightFromLeg(activeTrip.id, leg.id)}
                                  className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
                                  title="Unlink this tracked flight"
                                >
                                  <Unlink className="h-3 w-3" /> Unlink
                                </button>
                              </div>

                              <div className="flex items-baseline justify-between pt-1">
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                                    Current Lowest
                                  </span>
                                  <span className="text-base font-bold font-mono text-emerald-400">
                                    {formatCurrency(linkedTrackedFlight.currentLowestPriceInr, currency)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                                    Target Alert
                                  </span>
                                  <span className="text-xs font-mono text-slate-400">
                                    {formatCurrency(linkedTrackedFlight.targetPriceInr, currency)}
                                  </span>
                                </div>
                              </div>

                              {linkedTrackedFlight.currentLowestPriceInr <= linkedTrackedFlight.targetPriceInr && (
                                <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                  <TrendingDown className="h-3 w-3" /> Target Met! Ready to book
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Estimated Fare</span>
                                <span className="font-mono font-bold text-white">
                                  {formatCurrency(leg.fareInr || 0, currency)}
                                </span>
                              </div>

                              <div className="pt-1 flex items-center gap-2">
                                <button
                                  onClick={() => setLinkingLeg(leg)}
                                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-medium transition"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  <span>Link Tracked Flight</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Leg Actions Toolbar */}
                        <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                          <button
                            onClick={() => handleSearchForLeg(leg)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold transition"
                            title="Search live flight offers for this route and date"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Search</span>
                          </button>

                          <button
                            onClick={() => handlePredictForLeg(leg)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition"
                            title="Inspect ML Price Forecast for this leg"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                            <span>Forecast</span>
                          </button>

                          <button
                            onClick={() => setTripSubTab('baggage')}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                            title="Calculate airline baggage allowance and excess fees for this leg"
                          >
                            <Luggage className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Baggage</span>
                          </button>

                          <button
                            onClick={() => handleExportLegToCalendar(leg)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
                            title="Export this flight segment to Calendar (.ics)"
                          >
                            {exportedLegId === leg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Exported</span>
                              </>
                            ) : (
                              <>
                                <CalendarPlus className="h-3.5 w-3.5 text-sky-400" />
                                <span>Export .ics</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => removeLegFromTrip(activeTrip.id, leg.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Remove flight leg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )
      ) : (
        <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/50">
          <Compass className="h-12 w-12 text-sky-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Trips Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Get started by creating your first multi-city trip itinerary and attaching real-time price monitoring to every destination.
          </p>
          <button
            onClick={handleOpenNewTrip}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-sky-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Itinerary</span>
          </button>
        </div>
      )}

      {/* Modal 1: Create New Trip */}
      {isNewTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-sky-400" />
                <span>Create Multi-City Itinerary</span>
              </h3>
              <button
                onClick={() => setIsNewTripModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Trip Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Europe Business Tour 2026"
                  value={tripForm.title}
                  onChange={e => setTripForm({ ...tripForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Trip Notes / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Conference in London, partner meetings in Dubai, personal stay in Paris..."
                  value={tripForm.description}
                  onChange={e => setTripForm({ ...tripForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={tripForm.startDate}
                    onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={tripForm.endDate}
                    onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Airfare Budget ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tripForm.budgetInr}
                  onChange={e => setTripForm({ ...tripForm, budgetInr: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTripModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Trip Details & Budget */}
      {isEditTripModalOpen && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-sky-400" />
                <span>Edit Trip Details & Budget</span>
              </h3>
              <button
                onClick={() => setIsEditTripModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Trip Title
                </label>
                <input
                  type="text"
                  value={tripForm.title}
                  onChange={e => setTripForm({ ...tripForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Trip Description
                </label>
                <textarea
                  rows={2}
                  value={tripForm.description}
                  onChange={e => setTripForm({ ...tripForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripForm.startDate}
                    onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripForm.endDate}
                    onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Airfare Budget ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tripForm.budgetInr}
                  onChange={e => setTripForm({ ...tripForm, budgetInr: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditTripModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateTrip(activeTrip.id, {
                      title: tripForm.title,
                      description: tripForm.description,
                      startDate: tripForm.startDate,
                      endDate: tripForm.endDate,
                      budgetInr: Number(tripForm.budgetInr) || 0
                    });
                    setIsEditTripModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Flight Leg */}
      {isAddLegModalOpen && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plane className="h-5 w-5 text-sky-400" />
                <span>Add Flight Leg to {activeTrip.title}</span>
              </h3>
              <button
                onClick={() => setIsAddLegModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLeg} className="space-y-4">
              {/* Airport Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AirportInput
                  label="Origin Airport"
                  value={legForm.origin}
                  onChange={code => setLegForm({ ...legForm, origin: code })}
                  type="origin"
                />
                <AirportInput
                  label="Destination Airport"
                  value={legForm.destination}
                  onChange={code => setLegForm({ ...legForm, destination: code })}
                  type="destination"
                />
              </div>

              {/* Date & Cabin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Flight Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={legForm.date}
                    onChange={e => setLegForm({ ...legForm, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Cabin Class
                  </label>
                  <select
                    value={legForm.cabinClass}
                    onChange={e => setLegForm({ ...legForm, cabinClass: e.target.value as CabinClass })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business Class</option>
                  </select>
                </div>
              </div>

              {/* Optional Flight Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Airline Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Emirates, British Airways, IndiGo"
                    value={legForm.airlineName}
                    onChange={e => setLegForm({ ...legForm, airlineName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Flight Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EK-511, BA-108"
                    value={legForm.flightNumber}
                    onChange={e => setLegForm({ ...legForm, flightNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Estimated Fare & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Estimated Airfare ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={legForm.fareInr}
                    onChange={e => setLegForm({ ...legForm, fareInr: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Leg Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Morning meeting, 4-day stopover"
                    value={legForm.notes}
                    onChange={e => setLegForm({ ...legForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Link with Tracked Flight Option */}
              {trackedFlights.length > 0 && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                    <LinkIcon className="h-4 w-4" />
                    <span>Link to Existing Price Alert (Optional)</span>
                  </div>
                  <select
                    value={legForm.linkWithTrackedId}
                    onChange={e => setLegForm({ ...legForm, linkWithTrackedId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">Do not link right now (can link later)</option>
                    {trackedFlights.map(tf => (
                      <option key={tf.id} value={tf.id}>
                        {tf.origin} ➔ {tf.destination} ({tf.departureDate}) — Current: ₹{tf.currentLowestPriceInr?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLegModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                >
                  Add Flight Leg
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Link Tracked Flight to Leg */}
      {linkingLeg && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-sky-400" />
                  <span>Link Price Alert to Flight Leg</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {linkingLeg.origin} ➔ {linkingLeg.destination} on {linkingLeg.date}
                </p>
              </div>
              <button
                onClick={() => setLinkingLeg(null)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {/* List Matching or Available Tracked Flights */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select from Your Active Price Trackers:
              </div>

              {trackedFlights.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400 mb-3">You don't have any saved price alerts yet.</p>
                  <button
                    onClick={() => handleTrackAndLinkLeg(linkingLeg)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>Create & Link New Alert for {linkingLeg.origin}➔{linkingLeg.destination}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {trackedFlights.map(tf => {
                    const isExactMatch = tf.origin === linkingLeg.origin && tf.destination === linkingLeg.destination;

                    return (
                      <div
                        key={tf.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          isExactMatch
                            ? 'bg-sky-500/10 border-sky-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">
                              {tf.origin} ➔ {tf.destination}
                            </span>
                            {isExactMatch && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">
                                Matching Route
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Date: {tf.departureDate} · Target: {formatCurrency(tf.targetPriceInr, currency)}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            Current Lowest: {formatCurrency(tf.currentLowestPriceInr, currency)}
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            await linkTrackedFlightToLeg(activeTrip.id, linkingLeg.id, tf.id);
                            setLinkingLeg(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                        >
                          Link
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action: Create New Tracker if needed */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2">Want to monitor this exact leg from scratch?</div>
              <button
                onClick={() => handleTrackAndLinkLeg(linkingLeg)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
              >
                <Plus className="h-3.5 w-3.5 text-sky-400" />
                <span>Create New Price Alert for {linkingLeg.origin} ➔ {linkingLeg.destination} ({linkingLeg.date})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
