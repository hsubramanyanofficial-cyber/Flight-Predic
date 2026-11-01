import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INDIAN_AIRPORTS } from '../data/airports';
import * as api from '../services/api';
import { MapPin, Navigation, ExternalLink, RefreshCw, Compass, Search, ShieldCheck } from 'lucide-react';

export const AirportGrounding: React.FC = () => {
  const { searchParams } = useApp();

  const [selectedAirport, setSelectedAirport] = useState(searchParams.origin || 'DEL');
  const [customPrompt, setCustomPrompt] = useState('What are the best executive departure lounges, transit hotels, and metro connections available at this airport?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; groundingChunks: any[]; airport: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGrounding = async (airportCodeToUse?: string, promptToUse?: string) => {
    const code = airportCodeToUse || selectedAirport;
    const prompt = promptToUse || customPrompt;

    setError(null);
    setLoading(true);
    try {
      const data = await api.queryMapsGrounding({
        prompt: `Provide grounded terminal details for ${code} Airport: ${prompt}`,
        airportCode: code
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Maps grounding query failed.');
    } finally {
      setLoading(false);
    }
  };

  const sampleGroundingQueries = [
    'Terminal lounges (Encalm / Adani / 080) and complimentary credit card access',
    'Airport express metro line and inter-terminal shuttle bus transfer',
    'Transit hotels and sleep pods inside departure security area',
    'Long-term car parking charges and premium pick-up zones'
  ];

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <Navigation className="h-4 w-4" />
          <span>Google Maps Grounded Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Airport Ground Navigation & Verified Transit
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Grounded with Google Maps tool using <code className="text-sky-300">gemini-3.8-flash</code> to fetch verified terminal lounges, metro connectivity, sleep pods, and transit routes across Indian airports.
        </p>
      </div>

      {/* Control Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Select Airport
            </label>
            <select
              value={selectedAirport}
              onChange={e => setSelectedAirport(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
            >
              {INDIAN_AIRPORTS.slice(0, 12).map(a => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Ground Query
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Ask about lounges, metro transit, terminals..."
                className="flex-1 p-2.5 text-xs text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => fetchGrounding()}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-sky-400 text-slate-950 text-xs font-semibold hover:bg-sky-300 transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Search className="h-4 w-4" />
                <span>Explore Ground</span>
              </button>
            </div>
          </div>

        </div>

        {/* Quick query chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Suggested:</span>
          {sampleGroundingQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setCustomPrompt(q);
                fetchGrounding(selectedAirport, q);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse flex items-center justify-center text-slate-400 text-xs gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
          <span>Retrieving verified Google Maps terminal data...</span>
        </div>
      ) : result ? (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-bold text-white">{result.airport}</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Google Maps Grounded</span>
            </span>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {result.text}
          </div>

          {/* Google Maps Grounding Chunks with real links */}
          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Grounded Google Maps Places & URIs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.groundingChunks.map((chunk, idx) => {
                  const mapData = chunk.maps || {};
                  return (
                    <a
                      key={idx}
                      href={mapData.uri || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-xs flex items-center justify-between gap-2 text-sky-400 hover:text-sky-300 transition"
                    >
                      <span className="truncate">{mapData.title || `Map Reference ${idx + 1}`}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
};
