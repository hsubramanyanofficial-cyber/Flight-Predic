import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import { Bell, Scale, SlidersHorizontal, Plane } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    unreadNotifsCount,
    setNotificationDrawerOpen,
    comparisonList,
    userPreferences
  } = useApp();

  const navLinks: { tab: NavTab; label: string }[] = [
    { tab: 'home', label: 'Home' },
    { tab: 'search', label: 'Search' },
    { tab: 'predictions', label: 'Predictions' },
    { tab: 'analytics', label: 'Fare Analytics' },
    { tab: 'tracked', label: 'Price Alerts' },
    { tab: 'recommendations', label: 'For You' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white transition hover:text-sky-400"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Plane className="h-4 w-4" />
            </div>
            <span className="whitespace-nowrap">FPPS <span className="font-normal text-slate-400">· Airfare Intelligence</span></span>
          </button>
        </div>

        {/* Zone 2: 4-6 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map(({ tab, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap transition-colors py-1 ${
                  isActive
                    ? 'text-sky-400 font-semibold border-b-2 border-sky-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Compare counter, Notifications bell, User Profile) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Comparison Tool Shortcut */}
          <button
            onClick={() => setActiveTab('compare')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition ${
              activeTab === 'compare'
                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title="Side-by-side flight comparison"
          >
            <Scale className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compare</span>
            {comparisonList.length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {comparisonList.length}
              </span>
            )}
          </button>

          {/* In-app Notification Alert Bell */}
          <button
            onClick={() => setNotificationDrawerOpen(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Profile shortcut */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-md border text-xs font-medium transition ${
              activeTab === 'profile'
                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-sky-400 border border-slate-700">
              {userPreferences?.displayName ? userPreferences.displayName.charAt(0) : 'S'}
            </div>
            <span className="hidden lg:inline truncate max-w-[90px]">
              {userPreferences?.displayName || 'Settings'}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile nav strip */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-4 text-xs font-medium scrollbar-none">
        {navLinks.map(({ tab, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeTab === tab
                ? 'bg-sky-500/20 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('compare')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'compare' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          Compare ({comparisonList.length})
        </button>
      </div>
    </header>
  );
};
