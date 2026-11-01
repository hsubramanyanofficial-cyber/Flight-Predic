import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { CabinClass, PricePrediction } from '../types';
import { FPPS_MODEL_METADATA } from '../ml/model';
import * as api from '../services/api';
import { Sparkles, Calendar, Clock, Plane, ShieldAlert, Cpu, CheckCircle, Info, ArrowRight } from 'lucide-react';

export const PricePredictions: React.FC = () => {
  const { searchParams, setActiveTab } = useApp();

  const [origin, setOrigin] = useState(searchParams.origin || 'DEL');
  const [destination, setDestination] = useState(searchParams.destination || 'BOM');
  const [travelDate, setTravelDate] = useState(searchParams.departureDate);
  const [cabinClass, setCabinClass] = useState<CabinClass>(searchParams.cabinClass || 'economy');
  const [airline, setAirline] = useState('IndiGo');
  const [stops, setStops] = useState(0);
  const [departureHour, setDepartureHour] = useState(8);

  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const result = await api.getPrediction({
        origin,
        destination,
        travelDate,
        cabinClass,
        airline,
        stops,
        departureHour
      });
      setPrediction(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [origin, destination, travelDate, cabinClass, airline, stops, departureHour]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Machine-Learning Price Prediction Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Predict Future Flight Fares & Factor Decomposition
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Simulate airfares under varying booking windows, seasonal peaks, and itinerary conditions. Our model extracts dynamic pricing signals calibrated from 124,500 historical Indian domestic flight observations.
        </p>
      </div>

      {/* Main Grid: Interactive Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Feature Tuner (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Itinerary Features</h2>
            <span className="text-xs text-sky-400 font-mono">Real-time Inference</span>
          </div>

          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <AirportInput
                label="Origin"
                value={origin}
                onChange={setOrigin}
                type="origin"
              />
              <AirportInput
                label="Destination"
                value={destination}
                onChange={setDestination}
                type="destination"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Travel Date
              </label>
              <input
                type="date"
                value={travelDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setTravelDate(e.target.value)}
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-850 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Cabin Class
                </label>
                <select
                  value={cabinClass}
                  onChange={e => setCabinClass(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-850 text-white focus:outline-none"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business Class</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Carrier Tier
                </label>
                <select
                  value={airline}
                  onChange={e => setAirline(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-850 text-white focus:outline-none"
                >
                  <option value="IndiGo">IndiGo (LCC Benchmark)</option>
                  <option value="Air India">Air India (Full Service)</option>
                  <option value="Vistara">Vistara (Premium FS)</option>
                  <option value="Akasa Air">Akasa Air (LCC Modern)</option>
                  <option value="SpiceJet">SpiceJet (Budget)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Itinerary Stops
                </label>
                <select
                  value={stops}
                  onChange={e => setStops(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-850 text-white focus:outline-none"
                >
                  <option value="0">Non-stop (Direct)</option>
                  <option value="1">1 Stop (Connecting)</option>
                  <option value="2">2+ Stops</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Time Slot
                </label>
                <select
                  value={departureHour}
                  onChange={e => setDepartureHour(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-850 text-white focus:outline-none"
                >
                  <option value="6">Early Morning (06:00)</option>
                  <option value="9">Morning Peak (09:00)</option>
                  <option value="14">Mid-day (14:00)</option>
                  <option value="18">Evening Peak (18:00)</option>
                  <option value="23">Night / Red-eye (23:00)</option>
                </select>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setActiveTab('search');
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs hover:bg-sky-300 transition flex items-center justify-center gap-1.5"
            >
              <span>Search Real Flights on this Date</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Results & Influences (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {loading || !prediction ? (
            <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse flex items-center justify-center text-slate-500 text-xs">
              Computing model inference...
            </div>
          ) : (
            <>
              {/* Primary Prediction Output Card */}
              <div className="p-6 rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 text-white shadow-xl space-y-5">
                
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      Model Estimate · {prediction.route}
                    </span>
                    <div className="text-4xl font-extrabold font-mono text-white mt-1 tabular-nums">
                      ₹{prediction.predictedFare.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      90% Confidence Interval: ₹{prediction.lowerBoundFare.toLocaleString('en-IN')} – ₹{prediction.upperBoundFare.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-bold ${
                      prediction.advice === 'BUY_NOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : prediction.advice === 'WAIT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {prediction.advice === 'BUY_NOW' ? 'STRONGLY ADVISE BOOKING NOW' : prediction.advice === 'WAIT' ? 'WAIT FOR PROMOTIONAL DIP' : 'FAIR MARKET RATE'}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Confidence Score: {Math.round(prediction.confidenceScore * 100)}%
                    </div>
                  </div>
                </div>

                {/* Sub info bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
                  <div>Days to Departure: <span className="text-white font-semibold">{prediction.features.daysToDeparture}</span></div>
                  <div>Day: <span className="text-white font-semibold">{prediction.features.dayOfWeek}</span></div>
                  <div>Slot: <span className="text-white font-semibold">{prediction.features.departureSlot.split(' ')[0]}</span></div>
                  <div>Season: <span className="text-white font-semibold">{prediction.features.isFestivalPeak ? 'Festival Surge' : 'Regular'}</span></div>
                </div>

              </div>

              {/* Factor Decomposition Table */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Feature Impact Decomposition
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Additive Attribution</span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {prediction.factors.map((f, idx) => {
                    const isPositive = f.impactInr > 0;
                    return (
                      <div key={idx} className="py-3 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-200">{f.factor}</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{f.description}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-mono font-bold tabular-nums ${
                            isPositive ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isPositive ? `+₹${f.impactInr.toLocaleString('en-IN')}` : `-₹${Math.abs(f.impactInr).toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* Model Provenance & Evaluation Metrics */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-400" />
            <span>Model Provenance & Reproducible Validation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard metrics calculated from out-of-sample test partitioning on the Cleaned Indian Flight Dataset.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-xs text-slate-400">Mean Absolute Error (MAE)</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              ₹{FPPS_MODEL_METADATA.maeInr.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Average absolute delta on test split</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-xs text-slate-400">Root Mean Square Error</span>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              ₹{FPPS_MODEL_METADATA.rmseInr.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Penalizes large outlier swings</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-xs text-slate-400">R² Determination Score</span>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
              {FPPS_MODEL_METADATA.r2Score.toFixed(3)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Explains 88.2% of price variance</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-xs text-slate-400">Training Samples</span>
            <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
              {FPPS_MODEL_METADATA.trainingSamples.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Historical Indian flight observations</p>
          </div>
        </div>

        {/* Feature Importance weights */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Feature Importance Weightings (Ensemble Gradient Booster)
          </h3>
          <div className="space-y-2">
            {FPPS_MODEL_METADATA.featureImportance.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{item.feature}</span>
                  <span className="font-mono font-bold text-sky-400">{item.importancePercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${item.importancePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
