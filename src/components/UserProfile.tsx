import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INDIAN_AIRPORTS } from '../data/airports';
import { CabinClass } from '../types';
import { User, Settings, ShieldCheck, Database, Key, CheckCircle, Bell, Sliders, Cpu, Save } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const {
    userPreferences,
    updatePreferences,
    currentUser,
    signInWithGoogle,
    logout,
    trackedFlights
  } = useApp();

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

      {/* Firebase Authentication & Cloud Firestore Integration Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Firebase Authentication & Cloud Firestore</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Provisioned & Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Database: <code className="text-slate-300">ai-studio-flightpricepredi-8b026c20-f06c-404d-abba-d01536911377</code>
              </p>
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition flex items-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {currentUser ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Authenticated Account</span>
              <span className="font-semibold text-white truncate block">
                {currentUser.displayName || 'Google Traveller'}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">{currentUser.email}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Security & Rules</span>
              <span className="font-semibold text-emerald-400 block">RBAC & Owner Rules Deployed</span>
              <span className="text-[11px] text-slate-400 block">UID: {currentUser.uid.slice(0, 14)}...</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Synced Watchlist</span>
              <span className="font-semibold text-sky-400 block">{trackedFlights.length} Tracked Flight{trackedFlights.length !== 1 ? 's' : ''}</span>
              <span className="text-[11px] text-slate-400 block">Real-time Firestore Snapshot</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">Guest Mode Active</span>
              Your flight searches and alerts are stored locally. Sign in with Google to synchronize your alerts across all devices and receive price drop alerts.
            </div>
            <button
              onClick={signInWithGoogle}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold transition"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>

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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Database <code className="text-sky-300">ai-studio-flightpricepredi-8b026c20-f06c-404d-abba-d01536911377</code> active on project <code className="text-sky-300">superb-bedrock-16ppv</code> with deployed security rules.
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
