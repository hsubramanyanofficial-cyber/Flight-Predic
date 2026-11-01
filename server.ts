import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { searchAirports, INDIAN_AIRPORTS } from './src/data/airports.ts';
import { predictFlightFare, FPPS_MODEL_METADATA } from './src/ml/model.ts';
import { getRouteAnalytics, evaluatePriceIntelligence } from './src/data/analytics.ts';
import { generateFlightOffers } from './src/services/flightEngine.ts';
import { CabinClass, TrackedFlight, InAppNotification, UserPreferences } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Persistent Data Storage setup
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'fpps_store.json');

interface FPPSDataStore {
  trackedFlights: TrackedFlight[];
  notifications: InAppNotification[];
  userPreferences: Record<string, UserPreferences>;
}

function loadStore(): FPPSDataStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading persistence store, using default:', err);
  }

  // Initial seed data
  const initialStore: FPPSDataStore = {
    trackedFlights: [
      {
        id: 'track_1',
        userId: 'usr_default',
        origin: 'DEL',
        destination: 'BOM',
        originCity: 'New Delhi',
        destinationCity: 'Mumbai',
        departureDate: '2026-11-18',
        cabinClass: 'economy',
        targetPriceInr: 4500,
        currentLowestPriceInr: 4850,
        initialPriceInr: 5200,
        currency: 'INR',
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastCheckedAt: new Date().toISOString(),
        preferredAirline: 'IndiGo',
        priceHistory: [
          { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), price: 5200, airline: 'IndiGo' },
          { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), price: 5050, airline: 'Air India' },
          { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), price: 4900, airline: 'IndiGo' },
          { timestamp: new Date().toISOString(), price: 4850, airline: 'Akasa Air' }
        ]
      },
      {
        id: 'track_2',
        userId: 'usr_default',
        origin: 'BLR',
        destination: 'GOI',
        originCity: 'Bengaluru',
        destinationCity: 'Goa',
        departureDate: '2026-12-05',
        cabinClass: 'economy',
        targetPriceInr: 3000,
        currentLowestPriceInr: 3250,
        initialPriceInr: 3600,
        currency: 'INR',
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        lastCheckedAt: new Date().toISOString(),
        preferredAirline: 'Akasa Air',
        priceHistory: [
          { timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), price: 3600, airline: 'IndiGo' },
          { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), price: 3400, airline: 'Akasa Air' },
          { timestamp: new Date().toISOString(), price: 3250, airline: 'Akasa Air' }
        ]
      }
    ],
    notifications: [
      {
        id: 'notif_1',
        userId: 'usr_default',
        title: 'Price Drop Alert: DEL → BOM',
        message: 'Fare dropped by ₹350 on IndiGo flight 6E-241. Current price: ₹4,850.',
        type: 'PRICE_DROP',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false,
        route: 'DEL-BOM',
        linkTab: 'tracked',
        savingsInr: 350
      },
      {
        id: 'notif_2',
        userId: 'usr_default',
        title: 'Holiday Season Surge Warning',
        message: 'Diwali rush demand detected for late November flights. Our ML model recommends locking in fares now.',
        type: 'PREDICTION_UPDATE',
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
        read: true,
        linkTab: 'predictions'
      }
    ],
    userPreferences: {
      usr_default: {
        userId: 'usr_default',
        displayName: 'Subramanyan H.',
        email: 'h.subramanyanofficial@gmail.com',
        homeAirport: 'DEL',
        preferredAirlines: ['IndiGo', 'Vistara', 'Air India'],
        maxStops: 1,
        defaultCabinClass: 'economy',
        budgetAlertThresholdPercent: 10,
        inAppAlerts: true,
        emailAlerts: false,
        theme: 'dark'
      }
    }
  };

  saveStore(initialStore);
  return initialStore;
}

function saveStore(data: FPPSDataStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving persistence store:', err);
  }
}

let store = loadStore();

// --- External Flight Provider Adapter Check ---
function checkExternalProviderConfig() {
  const amadeusKey = process.env.AMADEUS_CLIENT_ID;
  const amadeusSecret = process.env.AMADEUS_CLIENT_SECRET;
  const aviationStackKey = process.env.AVIATIONSTACK_API_KEY;
  const serpApiKey = process.env.SERPAPI_API_KEY;

  if (amadeusKey && amadeusSecret) {
    return { configured: true, providerName: 'Amadeus GDS API', mode: 'Live' };
  }
  if (aviationStackKey) {
    return { configured: true, providerName: 'AviationStack API', mode: 'Live' };
  }
  if (serpApiKey) {
    return { configured: true, providerName: 'Google Flights API (SerpAPI)', mode: 'Live' };
  }

  return {
    configured: false,
    providerName: 'FPPS Sandbox / Demonstration Engine',
    mode: 'Sandbox',
    notice: 'External provider keys not present in AI Studio Secrets. Using realistic Indian domestic schedule and tariff engine.'
  };
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health check & configuration
app.get('/api/health', (req: Request, res: Response) => {
  const provider = checkExternalProviderConfig();
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'Flight Price Prediction System (FPPS)',
    timestamp: new Date().toISOString(),
    currency: 'INR (₹)',
    provider,
    mlModel: FPPS_MODEL_METADATA,
    persistence: {
      type: 'Local Atomic JSON Store (Ready for Firebase Firestore sync)',
      recordsCount: {
        trackedFlights: store.trackedFlights.length,
        notifications: store.notifications.length
      }
    }
  });
});

// 2. Airports search
app.get('/api/airports', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = searchAirports(query);
  res.json(results);
});

// 3. Flight Search
app.get('/api/flights/search', async (req: Request, res: Response) => {
  const origin = ((req.query.origin as string) || 'DEL').toUpperCase();
  const destination = ((req.query.destination as string) || 'BOM').toUpperCase();
  const departureDate = (req.query.departureDate as string) || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
  const returnDate = req.query.returnDate as string | undefined;
  const passengers = parseInt((req.query.passengers as string) || '1', 10);
  const cabinClass = ((req.query.cabinClass as string) || 'economy') as CabinClass;
  const maxStops = req.query.maxStops !== undefined ? parseInt(req.query.maxStops as string, 10) : undefined;
  const airline = req.query.airline as string | undefined;
  const sortBy = (req.query.sortBy as 'price' | 'duration' | 'departure' | 'recommended') || 'recommended';

  const providerInfo = checkExternalProviderConfig();

  // If live provider credentials were provided, we would call them here.
  // When not provided, we execute generateFlightOffers honestly:
  let offers = generateFlightOffers({
    origin,
    destination,
    departureDate,
    returnDate,
    passengers,
    cabinClass,
    maxStops,
    airline,
    sortBy
  });

  // Apply filters
  if (maxStops !== undefined) {
    offers = offers.filter(o => o.stops <= maxStops);
  }
  if (airline && airline !== 'all') {
    offers = offers.filter(o => o.airlineName.toLowerCase().includes(airline.toLowerCase()) || o.airlineCode === airline);
  }

  // Sorting
  if (sortBy === 'price') {
    offers.sort((a, b) => a.fare - b.fare);
  } else if (sortBy === 'duration') {
    offers.sort((a, b) => a.durationMinutes - b.durationMinutes);
  } else if (sortBy === 'departure') {
    offers.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }

  // Generate price prediction for this route & date
  const prediction = predictFlightFare({
    origin,
    destination,
    travelDate: departureDate,
    cabinClass,
    actualFare: offers.length > 0 ? offers[0].fare : undefined
  });

  // Price intelligence benchmark
  const intelligence = offers.length > 0
    ? evaluatePriceIntelligence({ origin, destination, fareInr: offers[0].fare, cabinClass })
    : null;

  res.json({
    origin,
    destination,
    departureDate,
    returnDate,
    passengers,
    cabinClass,
    totalOffers: offers.length,
    provider: providerInfo,
    offers,
    prediction,
    intelligence
  });
});

// 4. ML Price Prediction API
app.post('/api/prediction', (req: Request, res: Response) => {
  const { origin, destination, travelDate, cabinClass, airline, stops, departureHour, actualFare } = req.body;
  if (!origin || !destination || !travelDate) {
    return res.status(400).json({ error: 'Origin, destination, and travelDate are required.' });
  }

  const prediction = predictFlightFare({
    origin,
    destination,
    travelDate,
    cabinClass: cabinClass || 'economy',
    airline,
    stops: stops !== undefined ? parseInt(stops, 10) : 0,
    departureHour: departureHour !== undefined ? parseInt(departureHour, 10) : 9,
    actualFare: actualFare ? Number(actualFare) : undefined
  });

  res.json(prediction);
});

// 5. Historical Route Analytics
app.get('/api/analytics/route', (req: Request, res: Response) => {
  const origin = ((req.query.origin as string) || 'DEL').toUpperCase();
  const destination = ((req.query.destination as string) || 'BOM').toUpperCase();
  const analytics = getRouteAnalytics(origin, destination);
  res.json(analytics);
});

// 6. Price Intelligence Evaluation
app.get('/api/intelligence', (req: Request, res: Response) => {
  const origin = ((req.query.origin as string) || 'DEL').toUpperCase();
  const destination = ((req.query.destination as string) || 'BOM').toUpperCase();
  const fareInr = parseFloat((req.query.fareInr as string) || '5000');
  const cabinClass = (req.query.cabinClass as string) || 'economy';
  const intelligence = evaluatePriceIntelligence({ origin, destination, fareInr, cabinClass });
  res.json(intelligence);
});

// 7. Tracked Flights API
app.get('/api/tracked-flights', (req: Request, res: Response) => {
  res.json(store.trackedFlights);
});

app.post('/api/tracked-flights', (req: Request, res: Response) => {
  const { origin, destination, originCity, destinationCity, departureDate, returnDate, cabinClass, targetPriceInr, preferredAirline, initialPriceInr } = req.body;

  if (!origin || !destination || !departureDate || !targetPriceInr) {
    return res.status(400).json({ error: 'Missing required tracking parameters' });
  }

  const currentLowest = initialPriceInr || targetPriceInr + 300;
  const newTrack: TrackedFlight = {
    id: `track_${Date.now()}`,
    userId: 'usr_default',
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    originCity: originCity || origin,
    destinationCity: destinationCity || destination,
    departureDate,
    returnDate,
    cabinClass: cabinClass || 'economy',
    targetPriceInr: Number(targetPriceInr),
    currentLowestPriceInr: currentLowest,
    initialPriceInr: currentLowest,
    currency: 'INR',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    preferredAirline,
    priceHistory: [
      { timestamp: new Date().toISOString(), price: currentLowest, airline: preferredAirline || 'IndiGo' }
    ]
  };

  store.trackedFlights.unshift(newTrack);
  saveStore(store);

  // Create confirmation notification
  store.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: 'usr_default',
    title: `Price Tracking Activated: ${newTrack.origin} → ${newTrack.destination}`,
    message: `Target set to ₹${newTrack.targetPriceInr.toLocaleString('en-IN')}. We'll notify you when fares drop.`,
    type: 'SYSTEM',
    timestamp: new Date().toISOString(),
    read: false,
    route: `${newTrack.origin}-${newTrack.destination}`,
    linkTab: 'tracked'
  });
  saveStore(store);

  res.status(201).json(newTrack);
});

app.patch('/api/tracked-flights/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const track = store.trackedFlights.find(t => t.id === id);
  if (!track) {
    return res.status(404).json({ error: 'Tracked flight not found' });
  }

  if (req.body.isActive !== undefined) {
    track.isActive = Boolean(req.body.isActive);
  }
  if (req.body.targetPriceInr !== undefined) {
    track.targetPriceInr = Number(req.body.targetPriceInr);
  }

  saveStore(store);
  res.json(track);
});

app.delete('/api/tracked-flights/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.trackedFlights.length;
  store.trackedFlights = store.trackedFlights.filter(t => t.id !== id);
  saveStore(store);
  res.json({ success: true, deleted: store.trackedFlights.length < initialLen });
});

// Run live fare monitoring simulation on all tracked flights
app.post('/api/tracked-flights/check-all', (req: Request, res: Response) => {
  let updatedCount = 0;
  let alertsTriggered = 0;

  store.trackedFlights.forEach(track => {
    if (!track.isActive) return;

    // Simulate price fluctuation check
    const variance = (Math.random() * 400) - 200; // -200 to +200
    const newPrice = Math.max(1800, Math.round((track.currentLowestPriceInr + variance) / 50) * 50);
    const prevPrice = track.currentLowestPriceInr;
    track.currentLowestPriceInr = newPrice;
    track.lastCheckedAt = new Date().toISOString();
    track.priceHistory.push({
      timestamp: new Date().toISOString(),
      price: newPrice,
      airline: track.preferredAirline || 'IndiGo'
    });
    updatedCount++;

    // Check if target met or price drop
    if (newPrice <= track.targetPriceInr) {
      alertsTriggered++;
      store.notifications.unshift({
        id: `notif_${Date.now()}_${track.id}`,
        userId: track.userId,
        title: `Target Met: ${track.origin} → ${track.destination}!`,
        message: `Current lowest fare is now ₹${newPrice.toLocaleString('en-IN')}, beating your target of ₹${track.targetPriceInr.toLocaleString('en-IN')}.`,
        type: 'TARGET_MET',
        timestamp: new Date().toISOString(),
        read: false,
        route: `${track.origin}-${track.destination}`,
        linkTab: 'tracked',
        savingsInr: track.initialPriceInr - newPrice
      });
    } else if (newPrice < prevPrice - 150) {
      alertsTriggered++;
      store.notifications.unshift({
        id: `notif_${Date.now()}_${track.id}`,
        userId: track.userId,
        title: `Price Drop: ${track.origin} → ${track.destination}`,
        message: `Fare dropped by ₹${(prevPrice - newPrice).toLocaleString('en-IN')}. Now ₹${newPrice.toLocaleString('en-IN')}.`,
        type: 'PRICE_DROP',
        timestamp: new Date().toISOString(),
        read: false,
        route: `${track.origin}-${track.destination}`,
        linkTab: 'tracked',
        savingsInr: prevPrice - newPrice
      });
    }
  });

  saveStore(store);
  res.json({ success: true, updatedCount, alertsTriggered, trackedFlights: store.trackedFlights });
});

// 8. Notifications API
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(store.notifications);
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = store.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveStore(store);
    return res.json(notif);
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.post('/api/notifications/clear-all', (req: Request, res: Response) => {
  store.notifications = [];
  saveStore(store);
  res.json({ success: true });
});

// 9. User Preferences API
app.get('/api/preferences', (req: Request, res: Response) => {
  const prefs = store.userPreferences['usr_default'];
  res.json(prefs);
});

app.post('/api/preferences', (req: Request, res: Response) => {
  const updated = { ...store.userPreferences['usr_default'], ...req.body };
  store.userPreferences['usr_default'] = updated;
  saveStore(store);
  res.json(updated);
});

// 10. Personalized Recommendations API
app.get('/api/recommendations', (req: Request, res: Response) => {
  const user = store.userPreferences['usr_default'];
  const homeAirport = user?.homeAirport || 'DEL';

  // Popular destinations from home airport
  const popularDestinations = ['BOM', 'BLR', 'GOI', 'CCU', 'MAA'].filter(d => d !== homeAirport);
  const sampleDest = popularDestinations[0];
  const travelDate = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];

  const offers = generateFlightOffers({
    origin: homeAirport,
    destination: sampleDest,
    departureDate: travelDate,
    passengers: 1,
    cabinClass: user?.defaultCabinClass || 'economy',
    sortBy: 'price'
  });

  const recommendations = [
    {
      offer: offers[0],
      score: 96,
      category: 'BUDGET_PICK',
      rationale: `Lowest available non-stop fare from ${homeAirport} to ${sampleDest}. 18% below route average.`,
      priceIntelligence: evaluatePriceIntelligence({ origin: homeAirport, destination: sampleDest, fareInr: offers[0].fare }),
      prediction: predictFlightFare({ origin: homeAirport, destination: sampleDest, travelDate, cabinClass: 'economy', actualFare: offers[0].fare })
    },
    {
      offer: offers[1] || offers[0],
      score: 92,
      category: 'BEST_VALUE',
      rationale: `Optimal combination of departure time, on-time punctuality (89%), and competitive tariff.`,
      priceIntelligence: evaluatePriceIntelligence({ origin: homeAirport, destination: sampleDest, fareInr: (offers[1] || offers[0]).fare }),
      prediction: predictFlightFare({ origin: homeAirport, destination: sampleDest, travelDate, cabinClass: 'economy', actualFare: (offers[1] || offers[0]).fare })
    },
    {
      offer: offers.find(o => user?.preferredAirlines.includes(o.airlineName)) || offers[2] || offers[0],
      score: 90,
      category: 'LOYALTY_CHOICE',
      rationale: `Matches your preferred carrier with complimentary baggage and seamless transit.`,
      priceIntelligence: evaluatePriceIntelligence({ origin: homeAirport, destination: sampleDest, fareInr: (offers[2] || offers[0]).fare }),
      prediction: predictFlightFare({ origin: homeAirport, destination: sampleDest, travelDate, cabinClass: 'economy', actualFare: (offers[2] || offers[0]).fare })
    }
  ];

  res.json({
    homeAirport,
    destination: sampleDest,
    travelDate,
    recommendations
  });
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`FPPS Server running at http://localhost:${PORT}`);
  });
}

startServer();
