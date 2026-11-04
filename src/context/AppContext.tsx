import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { FlightOffer, TrackedFlight, InAppNotification, UserPreferences, CabinClass, TripItinerary, TripLeg } from '../types';
import * as api from '../services/api';
import { SupportedCurrency } from '../utils/currency';

export type NavTab =
  | 'home'
  | 'search'
  | 'compare'
  | 'trips'
  | 'game'
  | 'predictions'
  | 'analytics'
  | 'tracked'
  | 'recommendations'
  | 'advisory'
  | 'carbon'
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
  language: string;
  setLanguage: (lang: string) => void;
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
  trips: TripItinerary[];
  createTrip: (tripData: Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TripItinerary>;
  updateTrip: (id: string, updates: Partial<TripItinerary>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addLegToTrip: (tripId: string, leg: Omit<TripLeg, 'id'>) => Promise<void>;
  removeLegFromTrip: (tripId: string, legId: string) => Promise<void>;
  linkTrackedFlightToLeg: (tripId: string, legId: string, trackedFlightId: string) => Promise<void>;
  unlinkTrackedFlightFromLeg: (tripId: string, legId: string) => Promise<void>;
  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SAMPLE_TRIPS: TripItinerary[] = [
  {
    id: 'trip-asia-europe-2026',
    title: 'Global Horizons: Delhi → Dubai → London → Mumbai',
    description: 'Multi-city business and leisure journey connecting premier global hubs.',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    budgetInr: 185000,
    legs: [
      {
        id: 'leg-1',
        origin: 'DEL',
        destination: 'DXB',
        originCity: 'New Delhi',
        destinationCity: 'Dubai',
        date: '2026-06-15',
        flightNumber: 'EK-511',
        airlineName: 'Emirates',
        departureTime: '10:45',
        arrivalTime: '13:10',
        cabinClass: 'economy',
        fareInr: 16800,
        notes: 'Morning nonstop departure from Terminal 3.',
        status: 'planned'
      },
      {
        id: 'leg-2',
        origin: 'DXB',
        destination: 'LHR',
        originCity: 'Dubai',
        destinationCity: 'London',
        date: '2026-06-19',
        flightNumber: 'BA-108',
        airlineName: 'British Airways',
        departureTime: '14:20',
        arrivalTime: '18:55',
        cabinClass: 'economy',
        fareInr: 34500,
        notes: '4 days in Dubai, proceeding to London Heathrow.',
        status: 'planned'
      },
      {
        id: 'leg-3',
        origin: 'LHR',
        destination: 'BOM',
        originCity: 'London',
        destinationCity: 'Mumbai',
        date: '2026-06-28',
        flightNumber: 'AI-130',
        airlineName: 'Air India',
        departureTime: '13:00',
        arrivalTime: '02:45',
        cabinClass: 'economy',
        fareInr: 42000,
        notes: 'Direct return leg from London to Mumbai.',
        status: 'planned'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [comparisonList, setComparisonList] = useState<FlightOffer[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [trips, setTrips] = useState<TripItinerary[]>(() => {
    try {
      const stored = localStorage.getItem('fpps_trips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SAMPLE_TRIPS;
  });

  const saveTripsToStorage = (updatedTrips: TripItinerary[]) => {
    setTrips(updatedTrips);
    try {
      localStorage.setItem('fpps_trips', JSON.stringify(updatedTrips));
    } catch {}
  };

  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    return (localStorage.getItem('fpps_currency') as SupportedCurrency) || 'INR';
  });

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('fpps_currency', c);
    } catch {}
  };

  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('fpps_language') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('fpps_language', lang);
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

        // Attach real-time snapshot listener for trips
        const tripsColRef = collection(db, 'users', user.uid, 'trips');
        const unsubTrips = onSnapshot(tripsColRef, (snapshot) => {
          const tripList: TripItinerary[] = [];
          snapshot.forEach(docSnap => {
            tripList.push(docSnap.data() as TripItinerary);
          });
          if (tripList.length > 0) {
            setTrips(tripList);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/trips`);
        });

        return () => {
          unsubTracked();
          unsubNotifs();
          unsubTrips();
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

  const createTrip = async (tripData: Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>): Promise<TripItinerary> => {
    const newTrip: TripItinerary = {
      ...tripData,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: currentUser?.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextTrips = [newTrip, ...trips];
    saveTripsToStorage(nextTrips);

    if (currentUser) {
      try {
        const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', newTrip.id);
        await setDoc(tripDocRef, newTrip);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/trips/${newTrip.id}`);
      }
    }
    return newTrip;
  };

  const updateTrip = async (id: string, updates: Partial<TripItinerary>) => {
    const nextTrips = trips.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    saveTripsToStorage(nextTrips);

    if (currentUser) {
      try {
        const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', id);
        await setDoc(tripDocRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/trips/${id}`);
      }
    }
  };

  const deleteTrip = async (id: string) => {
    const nextTrips = trips.filter(t => t.id !== id);
    saveTripsToStorage(nextTrips);

    if (currentUser) {
      try {
        const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', id);
        await deleteDoc(tripDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/trips/${id}`);
      }
    }
  };

  const addLegToTrip = async (tripId: string, legData: Omit<TripLeg, 'id'>) => {
    const newLeg: TripLeg = {
      ...legData,
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };

    const nextTrips = trips.map(trip => {
      if (trip.id === tripId) {
        const updatedLegs = [...trip.legs, newLeg].sort((a, b) => a.date.localeCompare(b.date));
        return {
          ...trip,
          legs: updatedLegs,
          updatedAt: new Date().toISOString()
        };
      }
      return trip;
    });

    saveTripsToStorage(nextTrips);

    if (currentUser) {
      const targetTrip = nextTrips.find(t => t.id === tripId);
      if (targetTrip) {
        try {
          const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', tripId);
          await setDoc(tripDocRef, targetTrip, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/trips/${tripId}`);
        }
      }
    }
  };

  const removeLegFromTrip = async (tripId: string, legId: string) => {
    const nextTrips = trips.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          legs: trip.legs.filter(l => l.id !== legId),
          updatedAt: new Date().toISOString()
        };
      }
      return trip;
    });

    saveTripsToStorage(nextTrips);

    if (currentUser) {
      const targetTrip = nextTrips.find(t => t.id === tripId);
      if (targetTrip) {
        try {
          const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', tripId);
          await setDoc(tripDocRef, targetTrip, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/trips/${tripId}`);
        }
      }
    }
  };

  const linkTrackedFlightToLeg = async (tripId: string, legId: string, trackedFlightId: string) => {
    const matchedTracked = trackedFlights.find(tf => tf.id === trackedFlightId);
    const nextTrips = trips.map(trip => {
      if (trip.id === tripId) {
        const updatedLegs = trip.legs.map(leg => {
          if (leg.id === legId) {
            return {
              ...leg,
              linkedTrackedFlightId: trackedFlightId,
              status: 'tracked' as const,
              fareInr: matchedTracked ? matchedTracked.currentLowestPriceInr : leg.fareInr
            };
          }
          return leg;
        });
        return {
          ...trip,
          legs: updatedLegs,
          updatedAt: new Date().toISOString()
        };
      }
      return trip;
    });

    saveTripsToStorage(nextTrips);

    if (currentUser) {
      const targetTrip = nextTrips.find(t => t.id === tripId);
      if (targetTrip) {
        try {
          const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', tripId);
          await setDoc(tripDocRef, targetTrip, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/trips/${tripId}`);
        }
      }
    }
  };

  const unlinkTrackedFlightFromLeg = async (tripId: string, legId: string) => {
    const nextTrips = trips.map(trip => {
      if (trip.id === tripId) {
        const updatedLegs = trip.legs.map(leg => {
          if (leg.id === legId) {
            const { linkedTrackedFlightId, ...rest } = leg;
            return {
              ...rest,
              status: 'planned' as const
            };
          }
          return leg;
        });
        return {
          ...trip,
          legs: updatedLegs,
          updatedAt: new Date().toISOString()
        };
      }
      return trip;
    });

    saveTripsToStorage(nextTrips);

    if (currentUser) {
      const targetTrip = nextTrips.find(t => t.id === tripId);
      if (targetTrip) {
        try {
          const tripDocRef = doc(db, 'users', currentUser.uid, 'trips', tripId);
          await setDoc(tripDocRef, targetTrip, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/trips/${tripId}`);
        }
      }
    }
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
        language,
        setLanguage,
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
        trips,
        createTrip,
        updateTrip,
        deleteTrip,
        addLegToTrip,
        removeLegFromTrip,
        linkTrackedFlightToLeg,
        unlinkTrackedFlightFromLeg,
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
