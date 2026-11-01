/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Home } from './components/Home';
import { SearchFlights } from './components/SearchFlights';
import { FlightComparison } from './components/FlightComparison';
import { PricePredictions } from './components/PricePredictions';
import { FareAnalytics } from './components/FareAnalytics';
import { TrackedFlights } from './components/TrackedFlights';
import { Recommendations } from './components/Recommendations';
import { UserProfile } from './components/UserProfile';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveVoiceAssistant } from './components/LiveVoiceAssistant';
import { AirportGrounding } from './components/AirportGrounding';
import { VideoGeneration } from './components/VideoGeneration';
import { AudioTranscription } from './components/AudioTranscription';
import { Plane, ShieldCheck, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'search':
        return <SearchFlights />;
      case 'compare':
        return <FlightComparison />;
      case 'predictions':
        return <PricePredictions />;
      case 'analytics':
        return <FareAnalytics />;
      case 'tracked':
        return <TrackedFlights />;
      case 'recommendations':
        return <Recommendations />;
      case 'chatbot':
        return <GeminiChatbot />;
      case 'voice':
        return <LiveVoiceAssistant />;
      case 'maps':
        return <AirportGrounding />;
      case 'video':
        return <VideoGeneration />;
      case 'transcribe':
        return <AudioTranscription />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar Header */}
      <Header />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {renderActiveView()}
      </main>

      {/* Global In-app Alert Drawer */}
      <NotificationDrawer />

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-sky-400 border border-slate-800">
              <Plane className="h-3.5 w-3.5" />
            </div>
            <span>
              Flight Price Prediction System (FPPS) · Indian Airfare Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('search')} className="hover:text-white transition">Search</button>
            <button onClick={() => setActiveTab('predictions')} className="hover:text-white transition">ML Predictions</button>
            <button onClick={() => setActiveTab('analytics')} className="hover:text-white transition">Fare Analytics</button>
            <button onClick={() => setActiveTab('tracked')} className="hover:text-white transition">Price Alerts</button>
            <button onClick={() => setActiveTab('chatbot')} className="hover:text-sky-400 transition flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-400" /> AI Concierge
            </button>
            <button onClick={() => setActiveTab('voice')} className="hover:text-sky-400 transition">Live Voice</button>
            <button onClick={() => setActiveTab('maps')} className="hover:text-sky-400 transition">Airport Maps</button>
            <button onClick={() => setActiveTab('video')} className="hover:text-sky-400 transition">Video Studio</button>
            <button onClick={() => setActiveTab('transcribe')} className="hover:text-sky-400 transition">Voice-to-Search</button>
            <button onClick={() => setActiveTab('profile')} className="hover:text-white transition">Settings</button>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Currency: INR (₹)</span>
            <span>·</span>
            <span>Ensemble Regressor v2.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
