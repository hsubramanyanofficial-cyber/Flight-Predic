import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INDIAN_AIRPORTS } from '../data/airports';
import { CabinClass } from '../types';
import { User, Settings, ShieldCheck, Database, Key, CheckCircle, Bell, Sliders, Cpu, Save } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { userPreferences, updatePreferences } = useApp();

  const [displayName, setDisplayName] = useState(userPreferences?.displayName || 'Subramanyan H.');
  const [email, setEmail] = useState(userPreferences?.email || 'h.subramanyanofficial@gmail.com');
  const [homeAirport, setHomeAirport] = useState(userPreferences?.homeAirport || 'DEL');
  const [preferredAirlines, setPreferredAirlines] = useState<string[]>(
    userPreferences?.preferredAirlines || ['IndiGo', 'Vistara', 'Air India']
  );
  const [defaultCabinClass, setDefaultCabinClass] = useState<CabinClass>(
    userPreferences?.defaultCabinClass || 'economy'
  );
  const [budgetThreshold, setBudgetThreshold] = useState(
    userPreferences?.budgetAlertThresholdPercent || 10
  );
  const [inAppAlerts, setInAppAlerts] = useState(userPreferences?.inAppAlerts ?? true);
  const [emailAlerts, setEmailAlerts] = useState(userPreferences?.emailAlerts ?? false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableAirlines = ['IndiGo', 'Air India', 'Vistara', 'Akasa Air', 'SpiceJet', 'Air India Express'];

  const toggleAirline = (air: string) => {
    if (preferredAirlines.includes(air)) {
      setPreferredAirlines(preferredAirlines.filter(a => a !== air));
    } else {
      setPreferredAirlines([...preferredAirlines, air]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences({
        displayName,
        email,
        homeAirport,
        preferredAirlines,
        defaultCabinClass,
        budgetAlertThresholdPercent: budgetThreshold,
        inAppAlerts,
        emailAlerts
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <Settings className="h-4 w-4" />
          <span>Traveller Profile & Engine Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Preferences & Integration Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure default flight search parameters, airline loyalty preferences, price alert thresholds, and examine system architecture.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-2 text-xs font-medium">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Preferences updated and saved to persistent storage.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-6">
        
        {/* User Identity */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <User className="h-4 w-4 text-sky-400" />
            <span>Traveller Identity</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Travel & Airport Preferences */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span>Flight & Airport Defaults</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Home Base Airport
              </label>
              <select
                value={homeAirport}
                onChange={e => setHomeAirport(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
              >
                {INDIAN_AIRPORTS.filter(a => a.isDomestic).map(a => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code}) - {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Default Cabin Class
              </label>
              <select
                value={defaultCabinClass}
                onChange={e => setDefaultCabinClass(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
              >
                <option value="economy">Economy (Most Affordable)</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferred Airlines */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Preferred Airline Carriers (Used for recommendation ranking)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableAirlines.map(airline => {
              const selected = preferredAirlines.includes(airline);
              return (
                <button
                  type="button"
                  key={airline}
                  onClick={() => toggleAirline(airline)}
                  className={`p-3 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                    selected
                      ? 'border-sky-500 bg-sky-500/15 text-white'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{airline}</span>
                  {selected && <CheckCircle className="h-4 w-4 text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert & Monitoring Settings */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Bell className="h-4 w-4 text-sky-400" />
            <span>Alert Sensitivities</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Price Drop Trigger Threshold
              </label>
              <select
                value={budgetThreshold}
                onChange={e => setBudgetThreshold(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none"
              >
                <option value="5">Notify on &ge; 5% Price Drop</option>
                <option value="10">Notify on &ge; 10% Price Drop (Standard)</option>
                <option value="15">Notify on &ge; 15% Price Drop (Major deals only)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={e => setInAppAlerts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>In-App Realtime Notification Banner</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={e => setEmailAlerts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>Email Notifications (Requires SendGrid/Postmark Secret)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs hover:bg-sky-300 transition flex items-center gap-2 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>

      </form>

      {/* External Integration & Cloud Architecture Status Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <span>Architecture & Secrets Manager Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System status and real-world deployment configuration documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Flight Provider API</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                Sandbox Active
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              To connect live GDS flight search, add <code className="text-sky-300">AMADEUS_CLIENT_ID</code> and <code className="text-sky-300">AMADEUS_CLIENT_SECRET</code> or <code className="text-sky-300">AVIATIONSTACK_API_KEY</code> in AI Studio Secrets.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Firestore Persistence</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                Ready for Provision
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              <code className="text-sky-300">firebase-blueprint.json</code> and zero-trust <code className="text-sky-300">firestore.rules</code> are generated. Currently utilizing atomic server-side JSON persistence across restarts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">External Python ML Service</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                Standalone Available
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Python Scikit-Learn/XGBoost microservice is packaged in <code className="text-sky-300">/ml_service</code>. Connect it anytime by setting <code className="text-sky-300">ML_SERVICE_URL</code>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
