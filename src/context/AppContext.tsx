import React, { createContext, useContext, useState, useEffect } from 'react';
import { FlightOffer, TrackedFlight, InAppNotification, UserPreferences, CabinClass } from '../types';
import * as api from '../services/api';

export type NavTab = 'home' | 'search' | 'compare' | 'predictions' | 'analytics' | 'tracked' | 'recommendations' | 'profile';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userPreferences: UserPreferences | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  trackedFlights: TrackedFlight[];
  loadTrackedFlights: () => Promise<void>;
  trackFlight: (data: {
    origin: string;
    destination: string;
    originCity: string;
    destinationCity: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: CabinClass;
    targetPriceInr: number;
    initialPriceInr?: number;
    preferredAirline?: string;
  }) => Promise<TrackedFlight>;
  toggleTrackingActive: (id: string, isActive: boolean) => Promise<void>;
  removeTracking: (id: string) => Promise<void>;
  runPriceMonitoringCheck: () => Promise<{ updatedCount: number; alertsTriggered: number }>;
  notifications: InAppNotification[];
  unreadNotifsCount: number;
  markNotifAsRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  comparisonList: FlightOffer[];
  addToComparison: (flight: FlightOffer) => boolean;
  removeFromComparison: (flightId: string) => void;
  clearComparison: () => void;
  isFlightInComparison: (flightId: string) => boolean;
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass: CabinClass;
  };
  setSearchParams: React.Dispatch<React.SetStateAction<{
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass: CabinClass;
  }>>;
  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [comparisonList, setComparisonList] = useState<FlightOffer[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const defaultDepartureDate = defaultDate.toISOString().split('T')[0];

  const [searchParams, setSearchParams] = useState({
    origin: 'DEL',
    destination: 'BOM',
    departureDate: defaultDepartureDate,
    passengers: 1,
    cabinClass: 'economy' as CabinClass
  });

  const loadData = async () => {
    try {
      const [prefs, tracked, notifs] = await Promise.all([
        api.fetchUserPreferences().catch(() => null),
        api.fetchTrackedFlights().catch(() => []),
        api.fetchNotifications().catch(() => [])
      ]);
      if (prefs) setUserPreferences(prefs);
      setTrackedFlights(tracked || []);
      setNotifications(notifs || []);
    } catch (e) {
      console.error('Error loading initial app context data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updated = await api.saveUserPreferences(updates);
      setUserPreferences(updated);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const loadTrackedFlights = async () => {
    try {
      const res = await api.fetchTrackedFlights();
      setTrackedFlights(res);
    } catch (err) {
      console.error('Failed to load tracked flights:', err);
    }
  };

  const trackFlight = async (data: {
    origin: string;
    destination: string;
    originCity: string;
    destinationCity: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: CabinClass;
    targetPriceInr: number;
    initialPriceInr?: number;
    preferredAirline?: string;
  }) => {
    const newTrack = await api.addTrackedFlight(data);
    setTrackedFlights(prev => [newTrack, ...prev]);
    // Refresh notifications
    api.fetchNotifications().then(setNotifications).catch(() => {});
    return newTrack;
  };

  const toggleTrackingActive = async (id: string, isActive: boolean) => {
    const updated = await api.updateTrackedFlight(id, { isActive });
    setTrackedFlights(prev => prev.map(t => t.id === id ? updated : t));
  };

  const removeTracking = async (id: string) => {
    await api.deleteTrackedFlight(id);
    setTrackedFlights(prev => prev.filter(t => t.id !== id));
  };

  const runPriceMonitoringCheck = async () => {
    const result = await api.triggerLivePriceCheck();
    setTrackedFlights(result.trackedFlights);
    const notifs = await api.fetchNotifications();
    setNotifications(notifs);
    return { updatedCount: result.updatedCount, alertsTriggered: result.alertsTriggered };
  };

  const markNotifAsRead = async (id: string) => {
    const updated = await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? updated : n));
  };

  const clearNotifications = async () => {
    await api.clearAllNotifications();
    setNotifications([]);
  };

  const addToComparison = (flight: FlightOffer): boolean => {
    if (comparisonList.some(f => f.id === flight.id)) return true;
    if (comparisonList.length >= 3) return false;
    setComparisonList(prev => [...prev, flight]);
    return true;
  };

  const removeFromComparison = (flightId: string) => {
    setComparisonList(prev => prev.filter(f => f.id !== flightId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isFlightInComparison = (flightId: string) => {
    return comparisonList.some(f => f.id === flightId);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userPreferences,
        updatePreferences,
        trackedFlights,
        loadTrackedFlights,
        trackFlight,
        toggleTrackingActive,
        removeTracking,
        runPriceMonitoringCheck,
        notifications,
        unreadNotifsCount,
        markNotifAsRead,
        clearNotifications,
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isFlightInComparison,
        searchParams,
        setSearchParams,
        notificationDrawerOpen,
        setNotificationDrawerOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
