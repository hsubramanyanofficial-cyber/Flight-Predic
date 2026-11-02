import React, { useState } from 'react';
import { ALL_AIRPORTS, GlobalAirport } from '../data/airports';
import { FlightOffer } from '../types';
import { MapPin, Plane, Compass, Info, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface FlightMapProps {
  originCode: string;
  destinationCode: string;
  originCity?: string;
  destinationCity?: string;
  comparedFlights?: FlightOffer[];
  selectedFlight?: FlightOffer;
  title?: string;
}

export const FlightMap: React.FC<FlightMapProps> = ({
  originCode,
  destinationCode,
  originCity,
  destinationCity,
  comparedFlights = [],
  selectedFlight,
  title = 'Route Map & Flight Path Intelligence'
}) => {
  const [activeHoverPoint, setActiveHoverPoint] = useState<GlobalAirport | null>(null);
  const [mapScale, setMapScale] = useState<number>(1);
  const [showLayoverHubs, setShowLayoverHubs] = useState<boolean>(true);

  const originAirport = ALL_AIRPORTS.find(a => a.code.toUpperCase() === originCode.toUpperCase()) || {
    code: originCode,
    name: originCity || originCode,
    city: originCity || originCode,
    country: '',
    lat: 28.5562,
    lng: 77.1000
  };

  const destAirport = ALL_AIRPORTS.find(a => a.code.toUpperCase() === destinationCode.toUpperCase()) || {
    code: destinationCode,
    name: destinationCity || destinationCode,
    city: destinationCity || destinationCode,
    country: '',
    lat: 25.2532,
    lng: 55.3657
  };

  // Convert lat/lng to SVG coordinates on a standard equirectangular world map projection (800x420)
  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 420;
    return { x, y };
  };

  const originPt = projectCoordinates(originAirport.lat || 0, originAirport.lng || 0);
  const destPt = projectCoordinates(destAirport.lat || 0, destAirport.lng || 0);

  // Calculate midpoint with arc curve offset for curved flight paths
  const midX = (originPt.x + destPt.x) / 2;
  const midY = (originPt.y + destPt.y) / 2 - 40 * mapScale; // Arc curve elevation

  // Extract layover stop airports if any
  const layoverAirports: { airport: GlobalAirport; flightNumber: string }[] = [];
  if (selectedFlight && selectedFlight.stopAirports) {
    selectedFlight.stopAirports.forEach(code => {
      const ap = ALL_AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
      if (ap) {
        layoverAirports.push({ airport: ap, flightNumber: selectedFlight.flightNumber });
      }
    });
  }

  comparedFlights.forEach(fl => {
    if (fl.stopAirports) {
      fl.stopAirports.forEach(code => {
        if (!layoverAirports.some(l => l.airport.code === code)) {
          const ap = ALL_AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
          if (ap) {
            layoverAirports.push({ airport: ap, flightNumber: fl.flightNumber });
          }
        }
      });
    }
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl text-slate-100">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Compass className="h-4 w-4" />
            <span>Interactive Flight Path & Hub Map</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
            <span>{originAirport.code} ({originAirport.city})</span>
            <span className="text-sky-400">➔</span>
            <span>{destAirport.code} ({destAirport.city})</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowLayoverHubs(!showLayoverHubs)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
              showLayoverHubs
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Hubs ({layoverAirports.length})</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMapScale(prev => Math.max(prev - 0.2, 0.8))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">{Math.round(mapScale * 100)}%</span>
            <button
              onClick={() => setMapScale(prev => Math.min(prev + 0.3, 1.8))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG World Map Container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center">
        
        {/* World Map Grid Background Graticule */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 800 420"
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${mapScale})` }}
        >
          {/* Simplified World Continents Outlines / Graticules for Aviation Aesthetic */}
          <g className="text-slate-800" stroke="currentColor" strokeWidth="0.5" fill="none">
            {/* Equator & Prime Meridian */}
            <line x1="0" y1="210" x2="800" y2="210" strokeDasharray="4 4" opacity="0.3" />
            <line x1="400" y1="0" x2="400" y2="420" strokeDasharray="4 4" opacity="0.3" />

            {/* Continents Wireframe Representation */}
            {/* North America */}
            <path d="M 120 80 Q 180 70 220 120 T 160 200 Z" fill="#0f172a" opacity="0.5" />
            {/* South America */}
            <path d="M 220 220 Q 280 250 250 350 T 190 280 Z" fill="#0f172a" opacity="0.5" />
            {/* Europe */}
            <path d="M 380 70 Q 450 60 460 120 T 390 140 Z" fill="#0f172a" opacity="0.5" />
            {/* Africa */}
            <path d="M 400 160 Q 480 180 460 300 T 380 240 Z" fill="#0f172a" opacity="0.5" />
            {/* Asia */}
            <path d="M 480 50 Q 650 40 700 150 T 520 180 Z" fill="#0f172a" opacity="0.5" />
            {/* Australia */}
            <path d="M 680 280 Q 750 290 730 360 T 670 330 Z" fill="#0f172a" opacity="0.5" />
          </g>

          {/* Flight Path Arc (Bezier Curve) */}
          <g>
            <path
              d={`M ${originPt.x} ${originPt.y} Q ${midX} ${midY} ${destPt.x} ${destPt.y}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
            {/* Direct shadow arc */}
            <path
              d={`M ${originPt.x} ${originPt.y} Q ${midX} ${midY} ${destPt.x} ${destPt.y}`}
              fill="none"
              stroke="#0284c7"
              strokeWidth="1"
              opacity="0.5"
            />
          </g>

          {/* Animated Flight Icon along midpoint */}
          <g transform={`translate(${midX}, ${midY})`}>
            <circle r="12" fill="#0284c7" opacity="0.3" className="animate-ping" />
            <circle r="6" fill="#38bdf8" />
            <text x="10" y="-5" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              {originAirport.code} ➔ {destAirport.code}
            </text>
          </g>

          {/* Layover / Hub Airports */}
          {showLayoverHubs && layoverAirports.map(({ airport }, idx) => {
            const pt = projectCoordinates(airport.lat || 0, airport.lng || 0);
            return (
              <g
                key={airport.code}
                className="cursor-pointer group"
                onMouseEnter={() => setActiveHoverPoint(airport)}
                onMouseLeave={() => setActiveHoverPoint(null)}
              >
                <circle cx={pt.x} cy={pt.y} r="8" fill="#fbbf24" opacity="0.3" className="animate-ping" />
                <circle cx={pt.x} cy={pt.y} r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
                <text x={pt.x + 8} y={pt.y + 3} fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  {airport.code} (Hub)
                </text>
              </g>
            );
          })}

          {/* Origin Airport Marker */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setActiveHoverPoint(originAirport as GlobalAirport)}
            onMouseLeave={() => setActiveHoverPoint(null)}
          >
            <circle cx={originPt.x} cy={originPt.y} r="10" fill="#34d399" opacity="0.3" className="animate-ping" />
            <circle cx={originPt.x} cy={originPt.y} r="5" fill="#34d399" stroke="#0f172a" strokeWidth="2" />
            <text x={originPt.x + 10} y={originPt.y - 4} fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
              {originAirport.code} ({originAirport.city})
            </text>
          </g>

          {/* Destination Airport Marker */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setActiveHoverPoint(destAirport as GlobalAirport)}
            onMouseLeave={() => setActiveHoverPoint(null)}
          >
            <circle cx={destPt.x} cy={destPt.y} r="10" fill="#f43f5e" opacity="0.3" className="animate-ping" />
            <circle cx={destPt.x} cy={destPt.y} r="5" fill="#f43f5e" stroke="#0f172a" strokeWidth="2" />
            <text x={destPt.x + 10} y={destPt.y - 4} fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">
              {destAirport.code} ({destAirport.city})
            </text>
          </g>
        </svg>

        {/* Hover / Status Overlay Badge */}
        {activeHoverPoint && (
          <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-xl text-xs space-y-0.5 shadow-xl backdrop-blur-md">
            <div className="font-bold text-white flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-sky-400" />
              <span>{activeHoverPoint.name} ({activeHoverPoint.code})</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              {activeHoverPoint.city}, {activeHoverPoint.country} · Lat: {activeHoverPoint.lat}, Lng: {activeHoverPoint.lng}
            </div>
          </div>
        )}

      </div>

      {/* Footer Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Origin: <strong className="text-white">{originAirport.city} ({originAirport.code})</strong></span>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-slate-400">Destination: <strong className="text-white">{destAirport.city} ({destAirport.code})</strong></span>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">Hubs/Stops: <strong className="text-white">{layoverAirports.length} Connected</strong></span>
        </div>
      </div>

    </div>
  );
};
