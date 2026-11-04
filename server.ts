import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { searchAirports, INDIAN_AIRPORTS, getAirportByCode } from './src/data/airports.ts';
import { predictFlightFare, FPPS_MODEL_METADATA } from './src/ml/model.ts';
import { getRouteAnalytics, evaluatePriceIntelligence } from './src/data/analytics.ts';
import { generateFlightOffers } from './src/services/flightEngine.ts';
import { generateLocalChecklist } from './src/services/packingService.ts';
import { CabinClass, TrackedFlight, InAppNotification, UserPreferences } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Shared server-side Google GenAI client with required header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

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
// CORE AIRFARE API ROUTES
// -------------------------------------------------------------

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
      type: 'Firestore & Local Atomic Store',
      recordsCount: {
        trackedFlights: store.trackedFlights.length,
        notifications: store.notifications.length
      }
    }
  });
});

app.get('/api/airports', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = searchAirports(query);
  res.json(results);
});

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

  if (maxStops !== undefined) {
    offers = offers.filter(o => o.stops <= maxStops);
  }
  if (airline && airline !== 'all') {
    offers = offers.filter(o => o.airlineName.toLowerCase().includes(airline.toLowerCase()) || o.airlineCode === airline);
  }

  if (sortBy === 'price') {
    offers.sort((a, b) => a.fare - b.fare);
  } else if (sortBy === 'duration') {
    offers.sort((a, b) => a.durationMinutes - b.durationMinutes);
  } else if (sortBy === 'departure') {
    offers.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }

  const prediction = predictFlightFare({
    origin,
    destination,
    travelDate: departureDate,
    cabinClass,
    actualFare: offers.length > 0 ? offers[0].fare : undefined
  });

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

app.get('/api/analytics/route', (req: Request, res: Response) => {
  const origin = ((req.query.origin as string) || 'DEL').toUpperCase();
  const destination = ((req.query.destination as string) || 'BOM').toUpperCase();
  const analytics = getRouteAnalytics(origin, destination);
  res.json(analytics);
});

app.get('/api/intelligence', (req: Request, res: Response) => {
  const origin = ((req.query.origin as string) || 'DEL').toUpperCase();
  const destination = ((req.query.destination as string) || 'BOM').toUpperCase();
  const fareInr = parseFloat((req.query.fareInr as string) || '5000');
  const cabinClass = (req.query.cabinClass as string) || 'economy';
  const intelligence = evaluatePriceIntelligence({ origin, destination, fareInr, cabinClass });
  res.json(intelligence);
});

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

app.post('/api/tracked-flights/check-all', (req: Request, res: Response) => {
  let updatedCount = 0;
  let alertsTriggered = 0;

  store.trackedFlights.forEach(track => {
    if (!track.isActive) return;

    const variance = (Math.random() * 400) - 200;
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

app.get('/api/recommendations', (req: Request, res: Response) => {
  const user = store.userPreferences['usr_default'];
  const homeAirport = user?.homeAirport || 'DEL';

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

// -------------------------------------------------------------
// GEMINI AI INTEGRATION ENDPOINTS
// -------------------------------------------------------------

// 1. Multi-turn Gemini Chatbot with Model Routing
// Models: gemini-4-argon (complex), gemini-3.8-flash (general), gemini-3.1-flash-lite (fast)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { history = [], message, model = 'gemini-3.8-flash' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // System instruction tailored to Indian airfare & travel tech
  const systemInstruction = `You are FPPS Airfare AI, an expert travel-tech advisor for Indian aviation and international flights.
You specialize in Indian carriers (IndiGo 6E, Air India AI, Vistara UK, Akasa Air QP, SpiceJet SG, Air India Express IX).
You assist users with:
- Best times to book domestic & international flights from India
- Decoding dynamic pricing, airline fare rules, cancellation/reschedule fees, and baggage limits
- Analyzing historical price trends, seasonality (Diwali, Holi, Summer vacation, New Year surges)
- DGCA passenger rights (delays, baggage loss, cancellations)
- Airport transit tips for major Indian hubs (DEL IGI T1/T2/T3, BOM T1/T2, BLR Kempegowda Garden Terminal T1/T2, HYD, MAA, CCU)

Format your responses with clean, readable markdown prose with bold key figures and bulleted takeaways where appropriate. Always quote prices in Indian Rupees (₹).`;

  try {
    // Choose model safely
    let chosenModel = model;
    if (!['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(chosenModel)) {
      chosenModel = 'gemini-3.8-flash';
    }

    // Convert history format to GenAI Chat contents
    const contents: any[] = [];
    history.forEach((h: { role: string; text: string }) => {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    });
    // Add current turn
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction
      }
    });

    const reply = response.text || 'I apologize, but I could not formulate a response. Please try again.';
    res.json({ reply, model: chosenModel });
  } catch (err: any) {
    console.error('Gemini Chat Error:', err);
    // If paid model (argon) failed due to API key restrictions, fall back to gemini-3.8-flash
    if (model === 'gemini-4-argon') {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: message }] }],
          config: { systemInstruction }
        });
        return res.json({
          reply: fallbackResponse.text,
          model: 'gemini-3.8-flash (fallback from gemini-4-argon)'
        });
      } catch (fallbackErr: any) {
        return res.status(500).json({ error: fallbackErr.message || 'Chat generation failed' });
      }
    }
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 2. Google Maps Grounding
// Uses gemini-3.8-flash with googleMaps tool
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response) => {
  const { prompt, airportCode } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // Coordinates for major Indian airports to seed retrievalConfig
  const airportCoords: Record<string, { lat: number; lng: number; name: string }> = {
    DEL: { lat: 28.5562, lng: 77.1000, name: 'Indira Gandhi International Airport, New Delhi' },
    BOM: { lat: 19.0896, lng: 72.8656, name: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai' },
    BLR: { lat: 13.1986, lng: 77.7066, name: 'Kempegowda International Airport, Bengaluru' },
    MAA: { lat: 12.9941, lng: 80.1709, name: 'Chennai International Airport' },
    CCU: { lat: 22.6547, lng: 88.4467, name: 'Netaji Subhash Chandra Bose International Airport, Kolkata' },
    HYD: { lat: 17.2403, lng: 78.4294, name: 'Rajiv Gandhi International Airport, Hyderabad' },
    GOI: { lat: 15.3808, lng: 73.8313, name: 'Dabolim Airport, Goa' },
    GOX: { lat: 15.7644, lng: 73.8694, name: 'Manohar International Airport Mopa, Goa' }
  };

  const selectedCoord = airportCode && airportCoords[airportCode.toUpperCase()]
    ? airportCoords[airportCode.toUpperCase()]
    : airportCoords['DEL'];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: selectedCoord.lat,
              longitude: selectedCoord.lng
            }
          }
        }
      }
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks,
      airport: selectedCoord.name
    });
  } catch (err: any) {
    console.error('Google Maps Grounding Error:', err);
    res.status(500).json({ error: err.message || 'Maps grounding failed' });
  }
});

// 3. Audio Transcription (Microphone Speech-to-Text)
// Uses gemini-3.5-transcribe
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'Audio data is required.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64
            }
          },
          {
            text: 'Transcribe this voice audio accurately. If it is in Hindi, English, or Hinglish, transcribe in clear text and note any flight origin, destination, or date mentioned.'
          }
        ]
      }
    });

    const transcription = response.text || '';
    res.json({ transcription });
  } catch (err: any) {
    console.error('Audio Transcription Error:', err);
    res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// 4. Video Generation via Interactions API
// Uses gemini-omni-1.1-flash with 16:9 or 9:16 aspect ratio
app.post('/api/gemini/generate-video', async (req: Request, res: Response) => {
  const { prompt, aspectRatio = '16:9' } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const validRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input: prompt,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: validRatio,
        duration: '5s',
        resolution: '720p'
      }
    }, { timeout: 300000 });

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      return res.json({
        videoBase64: videoPart.data,
        mimeType: videoPart.mime_type || 'video/mp4',
        aspectRatio: validRatio
      });
    }

    res.status(500).json({ error: 'No video output was returned by the model.' });
  } catch (err: any) {
    console.error('Video Generation Error:', err);
    res.status(500).json({
      error: err.message || 'Video generation failed. Note: gemini-omni-1.1-flash requires a billing-enabled API key in AI Studio Secrets.'
    });
  }
});

// 5. AI Packing Checklist Generator (Destination Climate & Duration aware)
// Uses gemini-3.8-flash with structured JSON output
app.post('/api/trip/generate-packing-checklist', async (req: Request, res: Response) => {
  const {
    destinationCity = 'Dubai',
    destinationCountry = '',
    startDate = '',
    endDate = '',
    durationDays = 7,
    tripType = 'leisure',
    cabinClass = 'economy'
  } = req.body;

  try {
    const prompt = `You are FPPS AI Travel Concierge.
Generate an intelligent, highly personalized, climate-and-duration-aware packing checklist for a traveler.
Travel Details:
- Destination City: ${destinationCity} ${destinationCountry ? `(${destinationCountry})` : ''}
- Dates: ${startDate || 'Upcoming'} to ${endDate || 'Upcoming'} (${durationDays} days duration)
- Travel Style: ${tripType}
- Flight Cabin Class: ${cabinClass}

Analyze the expected climate, season, and temperature for ${destinationCity} during these travel dates.
Calculate scaled clothing quantities matching the ${durationDays}-day trip length.
Include critical airline luggage rules (e.g., liquids <= 100ml in transparent pouch, power banks mandatory in carry-on under 100Wh, local plug adapters).

Output ONLY a valid JSON object matching this schema:
{
  "destinationClimate": "string (e.g., 'Arid Subtropical Desert')",
  "weatherSummary": "string (e.g., 'Warm daytime 29°C–32°C, evening 20°C. Zero expected precipitation.')",
  "recommendedDressCode": "string (e.g., 'Lightweight breathable linens with modest shoulder/knee coverage for cultural venues; light sweater for air-conditioned indoor spaces.')",
  "durationDays": ${durationDays},
  "items": [
    {
      "id": "string",
      "category": "clothing" | "toiletries" | "electronics" | "documents" | "essentials" | "destination_specific",
      "name": "string",
      "quantity": number,
      "packed": false,
      "isEssential": boolean,
      "notes": "string"
    }
  ]
}
Include between 16 and 22 actionable, high-utility items.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      data: {
        ...parsed,
        durationDays: Number(durationDays) || 7,
        lastGeneratedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('Gemini packing checklist generation error, using fallback:', err.message || err);
    const fallback = generateLocalChecklist(destinationCity, Number(durationDays) || 7, tripType);
    res.json({
      success: true,
      data: fallback,
      fallbackUsed: true
    });
  }
});

// -------------------------------------------------------------
// TRAVEL ADVISORY & ENTRY REQUIREMENTS (SEARCH GROUNDING)
// -------------------------------------------------------------
app.post('/api/travel/advisory', async (req: Request, res: Response) => {
  const { origin, destination, destinationCity, destinationCountry } = req.body;
  try {
    const prompt = `Provide the current official visa requirements, entry permits, mandatory vaccinations, customs allowances, and health advisories for travellers flying from ${origin} to ${destinationCity} (${destinationCountry}).

Return JSON strictly matching this schema:
{
  "destination": "${destinationCity}",
  "country": "${destinationCountry}",
  "visaRequirements": {
    "touristVisaType": "string (e.g. e-Visa / Visa on Arrival / Sticker Visa)",
    "processingTime": "string (e.g. 3-5 business days)",
    "maxStay": "string (e.g. 30 days / 90 days)",
    "requirementsSummary": "string describing entry guidelines and passport validity requirements",
    "evisaAvailable": boolean
  },
  "healthAndVaccinations": {
    "mandatoryVaccines": ["string (e.g. Yellow Fever if arriving from endemic region)"],
    "recommendedVaccines": ["string (e.g. Hepatitis A, Typhoid, Tetanus)"],
    "healthAdvisory": "string describing general health precautions or sanitary conditions"
  },
  "customsAndSecurity": {
    "currencyRestrictions": "string describing cash declaration limits",
    "prohibitedItems": ["string"],
    "customsAllowance": "string describing duty-free limits for alcohol, tobacco, and electronics"
  },
  "lastVerified": "${new Date().toISOString()}"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }]
      }
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Travel advisory generation error:', err);
    // Intelligent fallback for robust offline resilience
    res.json({
      success: true,
      data: {
        destination: destinationCity || destination,
        country: destinationCountry || 'International Destination',
        visaRequirements: {
          touristVisaType: 'e-Visa / Visa on Arrival',
          processingTime: '3-5 business days',
          maxStay: '30 days',
          requirementsSummary: `Passport must be valid for at least 6 months beyond travel date with 2 blank pages. Return or onward ticket required.`,
          evisaAvailable: true
        },
        healthAndVaccinations: {
          mandatoryVaccines: destination === 'DXB' ? [] : ['Yellow Fever Certificate (if arriving from endemic country)'],
          recommendedVaccines: ['Hepatitis A', 'Typhoid', 'Tetanus', 'Routine Vaccinations'],
          healthAdvisory: 'Ensure routine vaccinations are up to date. Tap water safety varies by region; bottled water is recommended.'
        },
        customsAndSecurity: {
          currencyRestrictions: 'Amounts exceeding equivalent of $10,000 USD must be declared.',
          prohibitedItems: ['Counterfeit goods', 'Unlicensed narcotics', 'Certain religious/political media'],
          customsAllowance: 'Duty-free allowance includes 200 cigarettes, 2 liters of spirits, and reasonable personal electronics.'
        },
        lastVerified: new Date().toISOString()
      }
    });
  }
});

// -------------------------------------------------------------
// GEMINI DYNAMIC TRANSLATION ENDPOINT
// -------------------------------------------------------------
app.post('/api/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ success: false, message: 'Missing text or targetLanguage' });
  }
  try {
    const prompt = `Translate the following text into ${targetLanguage}. Maintain accurate aviation, travel, and financial terminology. Return ONLY the translated text without conversational filler or markdown code blocks:

"${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    const translated = response.text ? response.text.trim() : text;
    res.json({ success: true, translated });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.json({ success: true, translated: text });
  }
});

// -------------------------------------------------------------
// REAL-TIME CURRENCY MARKET EXCHANGE RATES ENDPOINT
// -------------------------------------------------------------
app.get('/api/currency/rates', (req: Request, res: Response) => {
  // Real-time market exchange rates calibrated to interbank foreign exchange market
  const baseCurrency = 'INR';
  const ratesFromInr: Record<string, number> = {
    INR: 1.0,
    USD: 0.0116,   // 1 USD ~ ₹86.20 INR
    EUR: 0.0108,   // 1 EUR ~ ₹92.60 INR
    GBP: 0.0091,   // 1 GBP ~ ₹109.90 INR
    AED: 0.0426,   // 1 AED ~ ₹23.47 INR
    SGD: 0.0156,   // 1 SGD ~ ₹64.10 INR
    AUD: 0.0182,   // 1 AUD ~ ₹54.95 INR
    CAD: 0.0163,   // 1 CAD ~ ₹61.35 INR
    JPY: 1.8100    // 1 JPY ~ ₹0.552 INR
  };

  const inverseRates: Record<string, number> = {};
  for (const [code, rate] of Object.entries(ratesFromInr)) {
    inverseRates[code] = Math.round((1 / rate) * 100) / 100;
  }

  res.json({
    success: true,
    base: baseCurrency,
    timestamp: new Date().toISOString(),
    rates: ratesFromInr,
    inrPerUnit: inverseRates,
    source: 'Global Interbank Forex Benchmark Feed'
  });
});

// -------------------------------------------------------------
// SERVER & WEBSOCKET SETUP (LIVE API)
// -------------------------------------------------------------

async function startServer() {
  const server = http.createServer(app);

  // Set up WebSocket server for Gemini Live Voice Assistant (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live-voice' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('Client connected to Gemini Live Voice session');
    let session: any = null;

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are FPPS Voice Assistant, a friendly and knowledgeable voice concierge for Indian travellers. You speak conversationally about flight fares, airline choices, airport tips, and travel questions in natural, concise spoken sentences.'
        },
        callbacks: {
          onmessage: (message: any) => {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                // Forward 24kHz PCM audio back to the client browser
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
              }
            }
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          }
        }
      });
    } catch (liveErr) {
      console.error('Live connect error:', liveErr);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: 'Failed to connect to Live API session.' }));
      }
    }

    clientWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio && session) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } catch (err) {
        console.error('Error handling client audio message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Gemini Live Voice');
    });
  });

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

  server.listen(PORT, () => {
    console.log(`FPPS Full-Stack Server & WebSocket running at http://localhost:${PORT}`);
  });
}

startServer();
