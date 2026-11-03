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
import { TripPlanner } from './components/TripPlanner';
import { PricePredictions } from './components/PricePredictions';
import { FareAnalytics } from './components/FareAnalytics';
import { TrackedFlights } from './components/TrackedFlights';
import { Recommendations } from './components/Recommendations';
import { TravelAdvisoryHub } from './components/TravelAdvisoryHub';
import { CarbonFootprintDashboard } from './components/CarbonFootprintDashboard';
import { UserProfile } from './components/UserProfile';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveVoiceAssistant } from './components/LiveVoiceAssistant';
import { AirportGrounding } from './components/AirportGrounding';
import { VideoGeneration } from './components/VideoGeneration';
import { AudioTranscription } from './components/AudioTranscription';
import { FlightGame } from './components/FlightGame';
import { Plane, ShieldCheck, Sparkles, Compass, Bell, Scale, Search } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, unreadNotifsCount, setNotificationDrawerOpen } = useApp();

  // Full-viewport Game Shell: never render website navbars or footers when active
  if (activeTab === 'game') {
    return <FlightGame onExit={() => setActiveTab('home')} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'search':
        return <SearchFlights />;
      case 'compare':
        return <FlightComparison />;
      case 'trips':
        return <TripPlanner />;
      case 'predictions':
        return <PricePredictions />;
      case 'analytics':
        return <FareAnalytics />;
      case 'tracked':
        return <TrackedFlights />;
      case 'recommendations':
        return <Recommendations />;
      case 'advisory':
        return <TravelAdvisoryHub />;
      case 'carbon':
        return <CarbonFootprintDashboard />;
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(2,6,23,0))]">
      {/* Top Bar Header */}
      <Header />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12">
        {renderActiveView()}
      </main>

      {/* Global In-app Alert Drawer */}
      <NotificationDrawer />

      {/* Floating Mobile Bottom Navigation Bar (Active on screens < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition cursor-pointer ${
            activeTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="h-4 w-4" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition cursor-pointer ${
            activeTab === 'search' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="h-4 w-4" />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition cursor-pointer ${
            activeTab === 'trips' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span className="text-[10px]">Trips</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition cursor-pointer ${
            activeTab === 'compare' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span className="text-[10px]">Compare</span>
        </button>

        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-slate-400 hover:text-slate-200 transition relative cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="text-[10px]">Alerts</span>
          {unreadNotifsCount > 0 && (
            <span className="absolute top-0 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </nav>

      {/* Clean Luxury Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-sky-400 border border-slate-800">
              <Plane className="h-3.5 w-3.5" />
            </div>
            <span>
              Flight Price Prediction System (FPPS) · Global Airfare Intelligence Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('search')} className="hover:text-white transition">Search</button>
            <button onClick={() => setActiveTab('trips')} className="hover:text-white transition">Trip Planner</button>
            <button onClick={() => setActiveTab('predictions')} className="hover:text-white transition">ML Predictions</button>
            <button onClick={() => setActiveTab('analytics')} className="hover:text-white transition">Fare Analytics</button>
            <button onClick={() => setActiveTab('tracked')} className="hover:text-white transition">Price Alerts</button>
            <button onClick={() => setActiveTab('chatbot')} className="hover:text-sky-400 transition flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-400" /> AI Concierge
            </button>
            <button onClick={() => setActiveTab('profile')} className="hover:text-white transition">Settings</button>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Global Multi-Currency Active</span>
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
