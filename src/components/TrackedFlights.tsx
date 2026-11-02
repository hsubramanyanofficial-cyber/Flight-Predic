import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { CabinClass } from '../types';
import { Bell, Play, Pause, Trash2, Plus, RefreshCw, TrendingDown, ArrowRight, CheckCircle2, History } from 'lucide-react';

export const TrackedFlights: React.FC = () => {
  const {
    trackedFlights,
    trackFlight,
    toggleTrackingActive,
    removeTracking,
    runPriceMonitoringCheck,
    setActiveTab,
    setSearchParams
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrigin, setNewOrigin] = useState('DEL');
  const [newDest, setNewDest] = useState('BOM');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  });
  const [newTargetPrice, setNewTargetPrice] = useState('4500');
  const [newCabin, setNewCabin] = useState<CabinClass>('economy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<{ updatedCount: number; alertsTriggered: number } | null>(null);

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrigin === newDest) return;
    setIsSubmitting(true);
    try {
      await trackFlight({
        origin: newOrigin,
        destination: newDest,
        originCity: newOrigin,
        destinationCity: newDest,
        departureDate: newDate,
        cabinClass: newCabin,
        targetPriceInr: Number(newTargetPrice),
        initialPriceInr: Number(newTargetPrice) + 400
      });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunMonitoring = async () => {
    setCheckLoading(true);
    setCheckFeedback(null);
    try {
      const res = await runPriceMonitoringCheck();
      setCheckFeedback(res);
      setTimeout(() => setCheckFeedback(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Bell className="h-4 w-4" />
            <span>Autonomous Price Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Tracked Itineraries & Price Targets
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Continuous background monitoring across global domestic and international flight corridors. Get alerted when prices hit your threshold.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunMonitoring}
            disabled={checkLoading || trackedFlights.length === 0}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checkLoading ? 'animate-spin' : ''}`} />
            <span>{checkLoading ? 'Querying Fares...' : 'Check Fares Now'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-sky-400 text-slate-950 text-xs font-semibold hover:bg-sky-300 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Track New Route</span>
          </button>
        </div>
      </div>

      {/* Monitoring feedback banner */}
      {checkFeedback && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Monitoring run complete: {checkFeedback.updatedCount} route(s) checked · {checkFeedback.alertsTriggered} price drop alert(s) triggered!
            </span>
          </div>
          <span className="text-[11px] text-emerald-400">View in alerts drawer</span>
        </div>
      )}

      {/* Tracked Itineraries List */}
      {trackedFlights.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 max-w-md mx-auto">
          <Bell className="mx-auto h-8 w-8 text-slate-600" />
          <h2 className="text-base font-bold text-white">No Tracked Itineraries</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are not currently monitoring any flights. Add a route and set your desired target price in ₹ to activate continuous tracking.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs hover:bg-sky-300 transition"
          >
            Track Your First Route
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trackedFlights.map(track => {
            const hasReachedTarget = track.currentLowestPriceInr <= track.targetPriceInr;
            const priceDifference = track.initialPriceInr - track.currentLowestPriceInr;

            return (
              <div
                key={track.id}
                className={`p-5 rounded-xl border transition shadow-sm ${
                  track.isActive
                    ? 'border-slate-800 bg-slate-900/90'
                    : 'border-slate-800/60 bg-slate-950/40 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Left: Route and Date */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold font-mono text-white tracking-wider">
                        {track.origin} → {track.destination}
                      </div>
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                        track.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {track.isActive ? 'MONITORING ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Travel Date: <strong className="text-slate-200 font-mono">{track.departureDate}</strong></span>
                      <span>·</span>
                      <span className="capitalize">{track.cabinClass}</span>
                      {track.preferredAirline && (
                        <>
                          <span>·</span>
                          <span>Preferred: {track.preferredAirline}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle: Prices */}
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-xs text-slate-400">Target Threshold</div>
                      <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                        ₹{track.targetPriceInr.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Current Lowest</div>
                      <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${
                        hasReachedTarget ? 'text-emerald-400' : 'text-sky-400'
                      }`}>
                        ₹{track.currentLowestPriceInr.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {priceDifference !== 0 && (
                      <div className="hidden sm:block">
                        <div className="text-xs text-slate-400">Net Change</div>
                        <div className={`text-xs font-mono font-bold mt-1 ${
                          priceDifference > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {priceDifference > 0 ? `-₹${priceDifference.toLocaleString('en-IN')}` : `+₹${Math.abs(priceDifference).toLocaleString('en-IN')}`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTrackingActive(track.id, !track.isActive)}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
                      title={track.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {track.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setSearchParams(prev => ({
                          ...prev,
                          origin: track.origin,
                          destination: track.destination,
                          departureDate: track.departureDate,
                          cabinClass: track.cabinClass
                        }));
                        setActiveTab('search');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition flex items-center gap-1"
                    >
                      <span>Search</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => removeTracking(track.id)}
                      className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-slate-700 transition"
                      title="Remove tracking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>

                {/* Price History Sparkline & Last Checked */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    <span>Price Observations:</span>
                    <div className="flex items-center gap-2 font-mono">
                      {track.priceHistory.map((h, i) => (
                        <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          ₹{h.price}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-slate-500">
                    Last observed: {new Date(track.lastCheckedAt).toLocaleTimeString()}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add New Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Track Airfare Route</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <AirportInput
                  label="From"
                  value={newOrigin}
                  onChange={setNewOrigin}
                  type="origin"
                />
                <AirportInput
                  label="To"
                  value={newDest}
                  onChange={setNewDest}
                  type="destination"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Target Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={newTargetPrice}
                    onChange={e => setNewTargetPrice(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
                    placeholder="e.g. 4500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Cabin Class
                  </label>
                  <select
                    value={newCabin}
                    onChange={e => setNewCabin(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition"
                >
                  {isSubmitting ? 'Saving...' : 'Start Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
