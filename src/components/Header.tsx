import React, { useState, useRef, useEffect } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  Bell,
  Scale,
  Plane,
  Sparkles,
  Mic,
  MapPin,
  Video,
  ChevronDown,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    unreadNotifsCount,
    setNotificationDrawerOpen,
    comparisonList,
    userPreferences,
    currentUser,
    signInWithGoogle,
    logout
  } = useApp();

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setAiMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks: { tab: NavTab; label: string }[] = [
    { tab: 'home', label: 'Home' },
    { tab: 'search', label: 'Search' },
    { tab: 'predictions', label: 'Predictions' },
    { tab: 'analytics', label: 'Fare Analytics' },
    { tab: 'tracked', label: 'Price Alerts' },
    { tab: 'recommendations', label: 'For You' }
  ];

  const aiTools: { tab: NavTab; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      tab: 'chatbot',
      label: 'AI Concierge',
      desc: 'Multi-turn flight advisory (Gemini 3.8/4)',
      icon: <Sparkles className="h-4 w-4 text-sky-400" />
    },
    {
      tab: 'voice',
      label: 'Live Voice Agent',
      desc: 'Real-time two-way voice via WebSocket',
      icon: <Mic className="h-4 w-4 text-emerald-400" />
    },
    {
      tab: 'maps',
      label: 'Airport & Transit Grounding',
      desc: 'Google Maps terminal & transit intelligence',
      icon: <MapPin className="h-4 w-4 text-amber-400" />
    },
    {
      tab: 'video',
      label: 'Destination Video Studio',
      desc: 'Prompt-to-video with Omni Flash',
      icon: <Video className="h-4 w-4 text-purple-400" />
    },
    {
      tab: 'transcribe',
      label: 'Voice-to-Search',
      desc: 'Speech transcription with Gemini 3.5',
      icon: <Mic className="h-4 w-4 text-cyan-400" />
    }
  ];

  const isAiTabActive = ['chatbot', 'voice', 'maps', 'video', 'transcribe'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
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

        {/* Zone 2: Concise single-line nav links + AI Features dropdown */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
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

          {/* AI Features Dropdown */}
          <div className="relative" ref={aiMenuRef}>
            <button
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                isAiTabActive
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'text-slate-300 border-transparent hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>AI Features</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${aiMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {aiMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900/98 p-2 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Gemini & Firebase Capabilities
                </div>
                {aiTools.map(({ tab, label, desc, icon }) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setAiMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition ${
                      activeTab === tab
                        ? 'bg-sky-500/15 text-sky-300'
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-1 rounded bg-slate-950/80 border border-slate-800">
                      {icon}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{label}</div>
                      <div className="text-[11px] text-slate-400">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Actions (Compare, Notifications, Auth / Profile) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Comparison Tool Shortcut */}
          <button
            onClick={() => setActiveTab('compare')}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition ${
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

          {/* Firebase Authentication / User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-md border text-xs font-medium transition ${
                  activeTab === 'profile'
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title={`Signed in as ${currentUser.email || currentUser.displayName}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-5 w-5 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline truncate max-w-[80px]">
                  {currentUser.displayName?.split(' ')[0] || 'Profile'}
                </span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition"
                title="Sign out of Firebase"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold transition"
              title="Sign in with Google to sync alerts & preferences across devices"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile nav strip with horizontal scroll */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-3 text-xs font-medium scrollbar-none">
        {navLinks.map(({ tab, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-2 py-1 rounded transition ${
              activeTab === tab
                ? 'bg-sky-500/20 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('chatbot')}
          className={`whitespace-nowrap px-2 py-1 rounded flex items-center gap-1 transition ${
            activeTab === 'chatbot' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="h-3 w-3 text-sky-400" /> AI Concierge
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`whitespace-nowrap px-2 py-1 rounded transition ${
            activeTab === 'voice' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          Voice
        </button>
        <button
          onClick={() => setActiveTab('maps')}
          className={`whitespace-nowrap px-2 py-1 rounded transition ${
            activeTab === 'maps' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          Maps
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`whitespace-nowrap px-2 py-1 rounded transition ${
            activeTab === 'video' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => setActiveTab('transcribe')}
          className={`whitespace-nowrap px-2 py-1 rounded transition ${
            activeTab === 'transcribe' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          Transcribe
        </button>
      </div>
    </header>
  );
};
