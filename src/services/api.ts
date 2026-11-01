import { Airport, FlightOffer, PricePrediction, RouteAnalytics, TrackedFlight, InAppNotification, UserPreferences, PriceIntelligence, CabinClass } from '../types';

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAirports(query: string = ''): Promise<Airport[]> {
  const res = await fetch(`${BASE_URL}/airports?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch airports');
  return res.json();
}

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  maxStops?: number;
  airline?: string;
  sortBy?: string;
}): Promise<{
  offers: FlightOffer[];
  totalOffers: number;
  prediction: PricePrediction;
  intelligence: PriceIntelligence | null;
  provider: { configured: boolean; providerName: string; mode: string; notice?: string };
}> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    passengers: String(params.passengers),
    cabinClass: params.cabinClass,
    sortBy: params.sortBy || 'recommended'
  });
  if (params.returnDate) query.append('returnDate', params.returnDate);
  if (params.maxStops !== undefined) query.append('maxStops', String(params.maxStops));
  if (params.airline) query.append('airline', params.airline);

  const res = await fetch(`${BASE_URL}/flights/search?${query.toString()}`);
  if (!res.ok) throw new Error('Flight search failed');
  return res.json();
}

export async function getPrediction(data: {
  origin: string;
  destination: string;
  travelDate: string;
  cabinClass: CabinClass;
  airline?: string;
  stops?: number;
  departureHour?: number;
  actualFare?: number;
}): Promise<PricePrediction> {
  const res = await fetch(`${BASE_URL}/prediction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Prediction calculation failed');
  return res.json();
}

export async function fetchRouteAnalytics(origin: string, destination: string): Promise<RouteAnalytics> {
  const res = await fetch(`${BASE_URL}/analytics/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  if (!res.ok) throw new Error('Route analytics failed');
  return res.json();
}

export async function fetchTrackedFlights(): Promise<TrackedFlight[]> {
  const res = await fetch(`${BASE_URL}/tracked-flights`);
  if (!res.ok) throw new Error('Failed to fetch tracked flights');
  return res.json();
}

export async function addTrackedFlight(data: {
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
}): Promise<TrackedFlight> {
  const res = await fetch(`${BASE_URL}/tracked-flights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to track flight');
  return res.json();
}

export async function updateTrackedFlight(id: string, updates: Partial<TrackedFlight>): Promise<TrackedFlight> {
  const res = await fetch(`${BASE_URL}/tracked-flights/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update tracking');
  return res.json();
}

export async function deleteTrackedFlight(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tracked-flights/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to remove tracking');
}

export async function triggerLivePriceCheck(): Promise<{ success: boolean; updatedCount: number; alertsTriggered: number; trackedFlights: TrackedFlight[] }> {
  const res = await fetch(`${BASE_URL}/tracked-flights/check-all`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to check prices');
  return res.json();
}

export async function fetchNotifications(): Promise<InAppNotification[]> {
  const res = await fetch(`${BASE_URL}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<InAppNotification> {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error('Failed to update notification');
  return res.json();
}

export async function clearAllNotifications(): Promise<void> {
  await fetch(`${BASE_URL}/notifications/clear-all`, { method: 'POST' });
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const res = await fetch(`${BASE_URL}/preferences`);
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const res = await fetch(`${BASE_URL}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs)
  });
  if (!res.ok) throw new Error('Failed to save preferences');
  return res.json();
}

export async function fetchRecommendations(): Promise<{
  homeAirport: string;
  destination: string;
  travelDate: string;
  recommendations: any[];
}> {
  const res = await fetch(`${BASE_URL}/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function sendChatMessage(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  model?: string;
}): Promise<{ reply: string; model: string }> {
  const res = await fetch(`${BASE_URL}/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chat request failed');
  }
  return res.json();
}

export async function queryMapsGrounding(params: {
  prompt: string;
  airportCode?: string;
}): Promise<{ text: string; groundingChunks: any[]; airport: string }> {
  const res = await fetch(`${BASE_URL}/gemini/maps-grounding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Maps grounding failed');
  }
  return res.json();
}

export async function transcribeAudio(params: {
  audioBase64: string;
  mimeType?: string;
}): Promise<{ transcription: string }> {
  const res = await fetch(`${BASE_URL}/gemini/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Audio transcription failed');
  }
  return res.json();
}

export async function generateRouteVideo(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
}): Promise<{ videoBase64: string; mimeType: string; aspectRatio: string }> {
  const res = await fetch(`${BASE_URL}/gemini/generate-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Video generation failed');
  }
  return res.json();
}

