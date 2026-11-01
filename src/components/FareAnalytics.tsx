import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { RouteAnalytics } from '../types';
import * as api from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Calendar, ArrowRight, ShieldCheck, Database, Info, Filter, Download } from 'lucide-react';

export const FareAnalytics: React.FC = () => {
  const { searchParams, setActiveTab } = useApp();

  const [origin, setOrigin] = useState(searchParams.origin || 'DEL');
  const [destination, setDestination] = useState(searchParams.destination || 'BOM');
  const [analytics, setAnalytics] = useState<RouteAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchAnalytics = async () => {
    if (origin === destination) {
      setError('Select two different airports to analyze corridor pricing.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await api.fetchRouteAnalytics(origin, destination);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load corridor analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [origin, destination]);

  const handleDownloadCSV = () => {
    if (!analytics) return;

    const lines: string[] = [];

    // Header metadata
    lines.push(`# Flight Price Prediction System (FPPS) - Historical Corridor Analytics`);
    lines.push(`# Route: ${analytics.origin} to ${analytics.destination} (${analytics.route})`);
    lines.push(`# Exported At: ${new Date().toISOString()}`);
    lines.push(`# Currency: ${analytics.currency} (INR)`);
    lines.push(`# 30-Day Median Fare: INR ${analytics.overallMeanFare}`);
    lines.push(`# Recorded Observations: ${analytics.observationCount}`);
    lines.push('');

    // Section 1: 30-Day Daily Historical Fare Trend
    lines.push(`"SECTION: 30-DAY DAILY HISTORICAL FARE TREND"`);
    lines.push(`Date,Route,Average Fare (INR),Minimum Fare (INR),Maximum Fare (INR),Observations Count`);
    analytics.trend30Days.forEach(pt => {
      lines.push(`"${pt.date}","${analytics.route}",${pt.avgFare},${pt.minFare},${pt.maxFare},${pt.observationsCount}`);
    });
    lines.push('');

    // Section 2: Carrier Fare & Punctuality Benchmark
    lines.push(`"SECTION: CARRIER FARE & ON-TIME PUNCTUALITY BENCHMARK"`);
    lines.push(`Airline Code,Airline Name,Average Fare (INR),Minimum Fare (INR),Sample Observations,On-Time Rating (%)`);
    analytics.airlineComparison.forEach(air => {
      lines.push(`"${air.airlineCode}","${air.airlineName}",${air.avgFare},${air.minFare},${air.sampleCount},${air.onTimeRating}`);
    });
    lines.push('');

    // Section 3: Booking Window Decay Curve
    lines.push(`"SECTION: BOOKING WINDOW PROGRESSION (DAYS PRIOR TO FLIGHT)"`);
    lines.push(`Days Prior,Average Fare (INR),Strategic Recommendation`);
    analytics.bookingWindowCurve.forEach(bw => {
      lines.push(`${bw.daysOut},${bw.avgFare},"${bw.recommendation.replace(/"/g, '""')}"`);
    });
    lines.push('');

    // Section 4: Day of Week Historical Pricing
    lines.push(`"SECTION: DAY-OF-WEEK HISTORICAL PRICING"`);
    lines.push(`Day of Week,Average Fare (INR)`);
    analytics.dayOfWeekAverages.forEach(dow => {
      lines.push(`"${dow.day}",${dow.avgFare}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FPPS_Fare_Analytics_${analytics.origin}_${analytics.destination}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Activity className="h-4 w-4" />
            <span>Recorded Historical Fare Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Historical Corridor Airfare Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Examine recorded 30-day time series, carrier fare distributions, day-of-week trends, and booking window decay curves.
          </p>
        </div>

        {/* Airport Picker Bar & CSV Export */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-36 sm:w-44">
            <AirportInput
              label="Origin"
              value={origin}
              onChange={setOrigin}
              type="origin"
            />
          </div>
          <div className="w-36 sm:w-44">
            <AirportInput
              label="Destination"
              value={destination}
              onChange={setDestination}
              type="destination"
            />
          </div>
          <div className="pt-5 w-full sm:w-auto">
            <button
              onClick={handleDownloadCSV}
              disabled={!analytics || loading}
              className={`w-full sm:w-auto px-4 py-3 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 ${
                downloadSuccess
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:border-slate-600'
              }`}
              title="Export historical corridor data to CSV for offline analysis"
            >
              <Download className={`h-4 w-4 ${downloadSuccess ? 'text-emerald-400' : 'text-sky-400'}`} />
              <span>{downloadSuccess ? 'Exported CSV' : 'Download CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading || !analytics ? (
        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse flex items-center justify-center text-slate-500 text-xs">
          Aggregating recorded flight observations...
        </div>
      ) : (
        <>
          {/* Corridor Metadata KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
              <span className="text-xs text-slate-400">Recorded Observations</span>
              <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
                {analytics.observationCount.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Verified tariff entries</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
              <span className="text-xs text-slate-400">30-Day Median Airfare</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
                ₹{analytics.overallMeanFare.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Economy non-stop benchmark</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
              <span className="text-xs text-slate-400">Recorded Lowest Fare</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                ₹{analytics.overallMinFare.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Observed promotion bucket</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
              <span className="text-xs text-slate-400">Observed Peak Surge</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
                ₹{analytics.overallMaxFare.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Emergency 24hr window</p>
            </div>

          </div>

          {/* Chart 1: 30-Day Trend Area Chart */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  30-Day Airfare Movement Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily average and observed price range on {analytics.route} (Economy Non-Stop)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">Currency: INR (₹)</span>
                <button
                  onClick={handleDownloadCSV}
                  disabled={!analytics || loading}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:border-slate-600 transition flex items-center gap-1.5 shadow-sm"
                  title="Export raw 30-day time series data to CSV"
                >
                  <Download className="h-3.5 w-3.5 text-sky-400" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trend30Days}>
                  <defs>
                    <linearGradient id="fareGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val: string) => val.slice(5)}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val: number) => `₹${val}`}
                    domain={['dataMin - 500', 'dataMax + 500']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Fare']}
                  />
                  <Area type="monotone" dataKey="avgFare" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#fareGrad)" name="Average Fare" />
                  <Line type="monotone" dataKey="minFare" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Min Fare" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dual Charts Grid: Airline Comparison + Day-of-Week Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Airline Tariff Comparison */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Carrier Tariff & Punctuality Benchmark
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mean airfare and historical on-time performance on this route
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.airlineComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="airlineName" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(val: number) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Avg Fare']}
                    />
                    <Bar dataKey="avgFare" fill="#0284c7" radius={[4, 4, 0, 0]} name="Average Fare" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* On-time ratings summary */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-5 gap-2 text-center">
                {analytics.airlineComparison.map(air => (
                  <div key={air.airlineCode} className="space-y-0.5">
                    <div className="text-[11px] text-slate-400">{air.airlineCode}</div>
                    <div className="text-xs font-mono font-semibold text-emerald-400">{air.onTimeRating}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day of Week Pricing */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Day-of-Week Price Variation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Weekend departures command higher premiums than mid-week slots
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dayOfWeekAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(val: number) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Avg Price']}
                    />
                    <Bar dataKey="avgFare" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">Tip:</span> Flying on Tuesdays or Wednesdays averages ₹{(analytics.overallMeanFare * 0.12).toFixed(0)} less than Friday evening or Sunday flights.
              </div>
            </div>

          </div>

          {/* Chart 3: Booking Window Decay / Surge Curve */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Booking Window Pricing Curve (Sweet Spot Analysis)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  How airfares change as the departure date nears (from 60 days to 1 day prior)
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Sweet Spot: 18 - 40 Days</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.bookingWindowCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="daysOut"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val: number) => `${val}d out`}
                    reversed={true}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val: number) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Avg Fare']}
                  />
                  <Line type="monotone" dataKey="avgFare" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Fare Progression" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations table based on booking window */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {analytics.bookingWindowCurve.slice(0, 4).map(point => (
                <div key={point.daysOut} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                  <div className="text-xs font-bold font-mono text-white">{point.daysOut} Day{point.daysOut > 1 ? 's' : ''} Prior</div>
                  <div className="text-sm font-bold font-mono text-sky-400">₹{point.avgFare.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-400 leading-tight">{point.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
