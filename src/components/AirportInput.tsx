import React, { useState, useRef, useEffect } from 'react';
import { Airport } from '../types';
import { searchAirports } from '../data/airports';
import { MapPin, PlaneTakeoff, PlaneLanding } from 'lucide-react';

interface AirportInputProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  type: 'origin' | 'destination';
}

export const AirportInput: React.FC<AirportInputProps> = ({ label, value, onChange, type }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const matched = searchAirports(query || value);
  const selectedAirport = matched.find(a => a.code.toUpperCase() === value.toUpperCase()) || matched[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setQuery('');
        }}
        className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-700 bg-slate-900/90 hover:border-slate-600 transition text-white"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-slate-400 shrink-0">
            {type === 'origin' ? <PlaneTakeoff className="h-4 w-4" /> : <PlaneLanding className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-sky-400 tracking-wider">
                {selectedAirport ? selectedAirport.code : value}
              </span>
              <span className="text-sm font-medium text-slate-200 truncate">
                {selectedAirport ? selectedAirport.city : value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {selectedAirport ? selectedAirport.name : 'Select Airport'}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-80 sm:w-96 rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-800 bg-slate-950/60">
            <input
              type="text"
              autoFocus
              placeholder="Search by city, airport, or IATA (e.g. BOM, Mumbai)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-white bg-slate-800/90 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
            {matched.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center">No matching airport found</div>
            ) : (
              matched.map(airport => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => {
                    onChange(airport.code);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left p-2.5 flex items-center justify-between transition hover:bg-slate-800 ${
                    airport.code === value ? 'bg-sky-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {airport.city} ({airport.code})
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {airport.name}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {airport.isDomestic ? 'Domestic' : 'International'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
