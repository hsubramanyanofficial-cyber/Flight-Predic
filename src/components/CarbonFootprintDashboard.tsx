import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { calculateAirDistanceKm, getAirportByCode } from '../data/airports';
import { formatCurrency } from '../utils/currency';
import { Leaf, TreePine, Car, Plane, Compass, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Globe } from 'lucide-react';

interface OffsetProject {
  id: string;
  title: string;
  location: string;
  description: string;
  pricePerTonInr: number;
  image: string;
  sdgGoals: string[];
}

export const CarbonFootprintDashboard: React.FC = () => {
  const { searchParams, currency } = useApp();

  const [origin, setOrigin] = useState(searchParams.origin || 'DEL');
  const [destination, setDestination] = useState(searchParams.destination || 'LHR');
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business'>(searchParams.cabinClass || 'economy');
  const [passengers, setPassengers] = useState<number>(searchParams.passengers || 1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj_1');
  const [offsetSupported, setOffsetSupported] = useState<boolean>(false);

  const originAirport = getAirportByCode(origin);
  const destAirport = getAirportByCode(destination);

  // Distance calculation
  const distanceKm = calculateAirDistanceKm(origin, destination);

  // CO2 calculation factors (kg CO2 per passenger-km)
  // Economy ~0.115, Premium Economy ~0.185, Business ~0.320
  const cabinMultiplier = cabinClass === 'business' ? 2.8 : cabinClass === 'premium_economy' ? 1.6 : 1.0;
  const co2PerPassengerKg = (distanceKm * 0.115 * cabinMultiplier);
  const totalCo2Kg = Math.round(co2PerPassengerKg * passengers);
  const totalCo2Tonnes = (totalCo2Kg / 1000).toFixed(2);

  // Equivalencies
  const treesNeeded = Math.round(totalCo2Kg / 21); // 1 mature tree absorbs ~21kg CO2 per year
  const carKmEquivalent = Math.round(totalCo2Kg / 0.171); // Average car emits ~171g CO2 per km

  const offsetProjects: OffsetProject[] = [
    {
      id: 'proj_1',
      title: 'Amazon Rainforest Biodiversity & Reforestation',
      location: 'Pará, Brazil',
      description: 'Protects 45,000 hectares of threatened rainforest from illegal logging while empowering indigenous stewardship communities.',
      pricePerTonInr: 1250,
      image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=600&q=80',
      sdgGoals: ['Climate Action', 'Life on Land', 'No Poverty']
    },
    {
      id: 'proj_2',
      title: 'Thar & Jaisalmer Wind Power Generation Grid',
      location: 'Rajasthan, India',
      description: 'Replaces fossil fuel electricity generation with clean 300MW wind turbine capacity across high-wind corridors.',
      pricePerTonInr: 950,
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=600&q=80',
      sdgGoals: ['Clean Energy', 'Decent Work', 'Climate Action']
    },
    {
      id: 'proj_3',
      title: 'Sundarbans Mangrove Coastal Restoration',
      location: 'West Bengal, India',
      description: 'Restores vital coastal mangrove ecosystems that absorb carbon up to 4x faster than tropical rainforests while protecting against storm surges.',
      pricePerTonInr: 1100,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      sdgGoals: ['Life Below Water', 'Climate Action', 'Sustainable Communities']
    }
  ];

  const activeProject = offsetProjects.find(p => p.id === selectedProjectId) || offsetProjects[0];
  const totalOffsetCostInr = Math.round((Number(totalCo2Tonnes) * activeProject.pricePerTonInr));

  const handleSupportOffset = () => {
    setOffsetSupported(true);
    setTimeout(() => setOffsetSupported(false), 4000);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Leaf className="h-3 w-3" /> Sustainable Aviation & Carbon Offset
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Flight Carbon Footprint & Offset Dashboard
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Calculate accurate CO2 emissions based on great circle distance, aircraft class, and passenger count. Support verified global offset projects to achieve carbon neutrality.
          </p>
        </div>

        {/* Route Picker */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-xl shrink-0 flex-wrap">
          <div className="w-36">
            <AirportInput label="Origin" value={origin} onChange={setOrigin} type="origin" />
          </div>
          <div className="w-36">
            <AirportInput label="Destination" value={destination} onChange={setDestination} type="destination" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Cabin Class</label>
            <select
              value={cabinClass}
              onChange={e => setCabinClass(e.target.value as any)}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Flight Distance</span>
            <Compass className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {distanceKm.toLocaleString()} <span className="text-xs font-sans text-slate-400">km</span>
          </div>
          <p className="text-[11px] text-slate-500">{originAirport?.city} to {destAirport?.city}</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
            <span>Total CO2 Emissions</span>
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {totalCo2Kg.toLocaleString()} <span className="text-xs font-sans text-slate-300">kg CO2</span>
          </div>
          <p className="text-[11px] text-emerald-400/80">{totalCo2Tonnes} Tonnes ({passengers} passenger{passengers > 1 ? 's' : ''})</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tree Sequestration</span>
            <TreePine className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {treesNeeded.toLocaleString()} <span className="text-xs font-sans text-slate-400">trees</span>
          </div>
          <p className="text-[11px] text-slate-500">Grown for 10 years to offset</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Car Driving Equivalent</span>
            <Car className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {carKmEquivalent.toLocaleString()} <span className="text-xs font-sans text-slate-400">km</span>
          </div>
          <p className="text-[11px] text-slate-500">Equivalent passenger car emissions</p>
        </div>

      </div>

      {/* Carbon Offset Projects Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Verified Carbon Offset Projects</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Support certified global sustainability initiatives to neutralize your flight carbon footprint instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offsetProjects.map(proj => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`rounded-2xl border transition overflow-hidden bg-slate-900/90 flex flex-col justify-between cursor-pointer ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-2xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="h-40 w-full relative">
                    <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-emerald-400 border border-slate-700 backdrop-blur-md">
                      {proj.location}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white">{proj.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.sdgGoals.map((goal, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/80 mt-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Offset Cost</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {formatCurrency(Math.round((Number(totalCo2Tonnes) * proj.pricePerTonInr)), currency)}
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold' : 'border-slate-700 bg-slate-800 text-transparent'
                  }`}>
                    ✓
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Checkout Banner */}
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Selected Initiative: {activeProject.title}</div>
            <h3 className="text-xl font-bold text-white">Neutralize {totalCo2Tonnes} Tonnes of CO2 for {formatCurrency(totalOffsetCostInr, currency)}</h3>
            <p className="text-xs text-slate-300">100% of your contribution directly funds verified tree planting and renewable energy deployment.</p>
          </div>

          <button
            onClick={handleSupportOffset}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
          >
            {offsetSupported ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-slate-950" />
                <span>Offset Verified & Funded!</span>
              </>
            ) : (
              <>
                <Leaf className="h-4 w-4 text-slate-950" />
                <span>Offset Flight Footprint ({formatCurrency(totalOffsetCostInr, currency)})</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
