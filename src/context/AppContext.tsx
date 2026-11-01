import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { FlightOffer, TrackedFlight, InAppNotification, UserPreferences, CabinClass } from '../types';
import * as api from '../services/api';
import { SupportedCurrency } from '../utils/currency';

export type NavTab =
  | 'home'
  | 'search'
  | 'compare'
  | 'predictions'
  | 'analytics'
  | 'tracked'
  | 'recommendations'
  | 'chatbot'
  | 'voice'
  | 'maps'
  | 'video'
  | 'transcribe'
  | 'profile';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User | null;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [comparisonList, setComparisonList] = useState<FlightOffer[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    return (localStorage.getItem('fpps_currency') as SupportedCurrency) || 'INR';
  });

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('fpps_currency', c);
    } catch {}
  };

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

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);

      if (user) {
        // Sync user profile with Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          if (!snap.exists()) {
            const initialPref: UserPreferences = {
              userId: user.uid,
              displayName: user.displayName || 'Indian Flyer',
              email: user.email || '',
              homeAirport: 'DEL',
              preferredAirlines: ['IndiGo', 'Vistara', 'Air India'],
              maxStops: 1,
              defaultCabinClass: 'economy',
              budgetAlertThresholdPercent: 10,
              inAppAlerts: true,
              emailAlerts: false,
              theme: 'dark'
            };
            await setDoc(userDocRef, initialPref);
            setUserPreferences(initialPref);
          } else {
            setUserPreferences(snap.data() as UserPreferences);
          }
        } catch (err) {
          console.error('Error syncing user profile with Firestore:', err);
        }

        // Attach real-time snapshot listener for tracked flights
        const trackedColRef = collection(db, 'users', user.uid, 'trackedFlights');
        const unsubTracked = onSnapshot(trackedColRef, (snapshot) => {
          const list: TrackedFlight[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as TrackedFlight);
          });
          if (list.length > 0) {
            setTrackedFlights(list);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/trackedFlights`);
        });

        // Attach real-time snapshot listener for notifications
        const notifsColRef = collection(db, 'users', user.uid, 'notifications');
        const unsubNotifs = onSnapshot(notifsColRef, (snapshot) => {
          const notifList: InAppNotification[] = [];
          snapshot.forEach(docSnap => {
            notifList.push(docSnap.data() as InAppNotification);
          });
          if (notifList.length > 0) {
            setNotifications(notifList);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notifications`);
        });

        return () => {
          unsubTracked();
          unsubNotifs();
        };
      } else {
        // User logged out: load local default persistence
        loadLocalData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadLocalData = async () => {
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
      console.error('Error loading local data:', e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, updates, { merge: true });
        setUserPreferences(prev => (prev ? { ...prev, ...updates } : null));
      } else {
        const updated = await api.saveUserPreferences(updates);
        setUserPreferences(updated);
      }
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
    
    // If authenticated, also persist to Firestore
    if (currentUser) {
      try {
        const trackDocRef = doc(db, 'users', currentUser.uid, 'trackedFlights', newTrack.id);
        await setDoc(trackDocRef, {
          ...newTrack,
          userId: currentUser.uid
        });
      } catch (err) {
        console.error('Error persisting to Firestore:', err);
      }
    }

    setTrackedFlights(prev => [newTrack, ...prev]);
    api.fetchNotifications().then(setNotifications).catch(() => {});
    return newTrack;
  };

  const toggleTrackingActive = async (id: string, isActive: boolean) => {
    const updated = await api.updateTrackedFlight(id, { isActive });
    if (currentUser) {
      try {
        const trackDocRef = doc(db, 'users', currentUser.uid, 'trackedFlights', id);
        await setDoc(trackDocRef, { isActive }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
    setTrackedFlights(prev => prev.map(t => t.id === id ? updated : t));
  };

  const removeTracking = async (id: string) => {
    await api.deleteTrackedFlight(id);
    if (currentUser) {
      try {
        const trackDocRef = doc(db, 'users', currentUser.uid, 'trackedFlights', id);
        await deleteDoc(trackDocRef);
      } catch (err) {
        console.error(err);
      }
    }
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
        currentUser,
        isAuthReady,
        signInWithGoogle,
        logout,
        currency,
        setCurrency,
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
