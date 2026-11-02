import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AirportInput } from './AirportInput';
import { ShieldCheck, Sparkles, Globe, AlertTriangle, Syringe, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { getAirportByCode } from '../data/airports';

interface TravelAdvisory {
  destination: string;
  country: string;
  visaRequirements: {
    touristVisaType: string;
    processingTime: string;
    maxStay: string;
    requirementsSummary: string;
    evisaAvailable: boolean;
  };
  healthAndVaccinations: {
    mandatoryVaccines: string[];
    recommendedVaccines: string[];
    healthAdvisory: string;
  };
  customsAndSecurity: {
    currencyRestrictions: string;
    prohibitedItems: string[];
    customsAllowance: string;
  };
  lastVerified: string;
}

export const TravelAdvisoryHub: React.FC = () => {
  const { searchParams } = useApp();

  const [origin, setOrigin] = useState(searchParams.origin || 'DEL');
  const [destination, setDestination] = useState(searchParams.destination || 'DXB');
  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const destAirport = getAirportByCode(destination);
  const destCityName = destAirport?.city || destination;
  const destCountryName = destAirport?.country || destination;

  const fetchAdvisory = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/travel/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, destinationCity: destCityName, destinationCountry: destCountryName })
      });
      const data = await res.json();
      if (data.success) {
        setAdvisory(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch travel advisory');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve real-time travel and visa intelligence');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAdvisory();
  }, [destination]);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Real-Time Visa & Health Advisory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Destination Entry & Vaccination Requirements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time immigration, visa rules, mandatory vaccinations, and customs allowances grounded with Gemini intelligence.
          </p>
        </div>

        {/* Airport Picker */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-xl">
          <div className="w-36">
            <AirportInput
              label="From"
              value={origin}
              onChange={setOrigin}
              type="origin"
            />
          </div>
          <div className="w-36">
            <AirportInput
              label="To"
              value={destination}
              onChange={setDestination}
              type="destination"
            />
          </div>
          <div className="pt-5">
            <button
              onClick={fetchAdvisory}
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Check Rules</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading || !advisory ? (
        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <Sparkles className="h-6 w-6 text-emerald-400 animate-spin" />
          <span>Consulting immigration databases and real-time travel intelligence for {destCityName}...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Visa & Immigration (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visa Card */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Visa & Entry Permit Guidelines</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  advisory.visaRequirements.evisaAvailable ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {advisory.visaRequirements.evisaAvailable ? 'e-Visa / Visa on Arrival Available' : 'Consulate Visa Required'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="text-slate-400 text-[11px]">Visa Category</div>
                  <div className="text-white font-semibold mt-1">{advisory.visaRequirements.touristVisaType}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="text-slate-400 text-[11px]">Max Authorized Stay</div>
                  <div className="text-white font-semibold mt-1">{advisory.visaRequirements.maxStay}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 text-xs">
                <div className="font-semibold text-slate-200">Processing Time & Documentation Summary</div>
                <p className="text-slate-300 leading-relaxed">
                  {advisory.visaRequirements.requirementsSummary}
                </p>
                <div className="text-slate-400 font-mono text-[11px] pt-1">
                  Estimated Processing: <span className="text-white">{advisory.visaRequirements.processingTime}</span>
                </div>
              </div>
            </div>

            {/* Customs & Security Card */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pb-3 border-b border-slate-800">
                <AlertTriangle className="h-4 w-4" />
                <span>Customs Allowances & Currency Restrictions</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                  <span className="text-slate-400 font-semibold">Duty-Free Allowances:</span>
                  <p className="text-white">{advisory.customsAndSecurity.customsAllowance}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                  <span className="text-slate-400 font-semibold">Currency Declarations:</span>
                  <p className="text-white">{advisory.customsAndSecurity.currencyRestrictions}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                  <span className="text-slate-400 font-semibold">Prohibited & Restricted Articles:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {advisory.customsAndSecurity.prohibitedItems.map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Health & Vaccinations (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-slate-900/90 shadow-xl space-y-5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm pb-3 border-b border-slate-800">
                <Syringe className="h-4 w-4" />
                <span>Health & Vaccination Mandates</span>
              </div>

              <div className="space-y-4 text-xs">
                
                <div>
                  <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Mandatory Vaccinations</span>
                  </div>
                  {advisory.healthAndVaccinations.mandatoryVaccines.length === 0 ? (
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-400">
                      No mandatory vaccinations required for entry from your origin corridor.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {advisory.healthAndVaccinations.mandatoryVaccines.map((vac, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 font-medium flex items-center justify-between">
                          <span>{vac}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Required</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-200 mb-2">Recommended Immunizations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {advisory.healthAndVaccinations.recommendedVaccines.map((vac, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {vac}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                  <div className="font-semibold text-sky-400">General Health & Safety Advisory</div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {advisory.healthAndVaccinations.healthAdvisory}
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 font-mono text-right pt-2 border-t border-slate-800">
                  Last Verified: {new Date(advisory.lastVerified).toLocaleDateString()} via Gemini Grounding
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
