import { Airport } from '../types';

export interface GlobalAirport extends Airport {
  lat?: number;
  lng?: number;
  region?: 'North America' | 'Europe' | 'Asia' | 'Middle East' | 'Oceania' | 'South America' | 'Africa' | 'India';
}

export const INDIAN_AIRPORTS: GlobalAirport[] = [
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', stateOrCountry: 'Delhi', country: 'India', isDomestic: true, tier: 1, lat: 28.5562, lng: 77.1000, region: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', stateOrCountry: 'Maharashtra', country: 'India', isDomestic: true, tier: 1, lat: 19.0896, lng: 72.8656, region: 'India' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', stateOrCountry: 'Karnataka', country: 'India', isDomestic: true, tier: 1, lat: 13.1986, lng: 77.7066, region: 'India' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', stateOrCountry: 'Tamil Nadu', country: 'India', isDomestic: true, tier: 1, lat: 12.9941, lng: 80.1709, region: 'India' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', stateOrCountry: 'West Bengal', country: 'India', isDomestic: true, tier: 1, lat: 22.6520, lng: 88.4463, region: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', stateOrCountry: 'Telangana', country: 'India', isDomestic: true, tier: 1, lat: 17.2403, lng: 78.4294, region: 'India' },
  { code: 'GOI', name: 'Dabolim Airport', city: 'Goa (South)', stateOrCountry: 'Goa', country: 'India', isDomestic: true, tier: 2, lat: 15.3808, lng: 73.8314, region: 'India' },
  { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'Goa (North)', stateOrCountry: 'Goa', country: 'India', isDomestic: true, tier: 2, lat: 15.7667, lng: 73.8667, region: 'India' },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', stateOrCountry: 'Maharashtra', country: 'India', isDomestic: true, tier: 2, lat: 18.5822, lng: 73.9197, region: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', stateOrCountry: 'Gujarat', country: 'India', isDomestic: true, tier: 2, lat: 23.0772, lng: 72.6347, region: 'India' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', stateOrCountry: 'Kerala', country: 'India', isDomestic: true, tier: 2, lat: 10.1556, lng: 76.3912, region: 'India' },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', stateOrCountry: 'Rajasthan', country: 'India', isDomestic: true, tier: 2, lat: 26.8242, lng: 75.8122, region: 'India' },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', stateOrCountry: 'Uttar Pradesh', country: 'India', isDomestic: true, tier: 2, lat: 26.7606, lng: 80.8893, region: 'India' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', stateOrCountry: 'Assam', country: 'India', isDomestic: true, tier: 2, lat: 26.1061, lng: 91.5859, region: 'India' },
  { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Thiruvananthapuram', stateOrCountry: 'Kerala', country: 'India', isDomestic: true, tier: 2, lat: 8.4821, lng: 76.9200, region: 'India' },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', stateOrCountry: 'Chandigarh', country: 'India', isDomestic: true, tier: 2, lat: 30.6735, lng: 76.7885, region: 'India' },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', stateOrCountry: 'Punjab', country: 'India', isDomestic: true, tier: 2, lat: 31.7096, lng: 74.7973, region: 'India' },
  { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', stateOrCountry: 'Odisha', country: 'India', isDomestic: true, tier: 2, lat: 20.2444, lng: 85.8178, region: 'India' },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', stateOrCountry: 'Bihar', country: 'India', isDomestic: true, tier: 2, lat: 25.5913, lng: 85.0880, region: 'India' },
  { code: 'VTZ', name: 'Visakhapatnam International Airport', city: 'Visakhapatnam', stateOrCountry: 'Andhra Pradesh', country: 'India', isDomestic: true, tier: 2, lat: 17.7212, lng: 83.2245, region: 'India' },
  { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', stateOrCountry: 'Jammu & Kashmir', country: 'India', isDomestic: true, tier: 2, lat: 33.9871, lng: 74.7744, region: 'India' },
  { code: 'IXB', name: 'Bagdogra International Airport', city: 'Siliguri / Darjeeling', stateOrCountry: 'West Bengal', country: 'India', isDomestic: true, tier: 2, lat: 26.6812, lng: 88.3286, region: 'India' },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', stateOrCountry: 'Maharashtra', country: 'India', isDomestic: true, tier: 2, lat: 21.0922, lng: 79.0472, region: 'India' },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', stateOrCountry: 'Uttar Pradesh', country: 'India', isDomestic: true, tier: 2, lat: 25.4524, lng: 82.8593, region: 'India' },
  { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', stateOrCountry: 'Jharkhand', country: 'India', isDomestic: true, tier: 2, lat: 23.3143, lng: 85.3217, region: 'India' },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', stateOrCountry: 'Madhya Pradesh', country: 'India', isDomestic: true, tier: 2, lat: 22.7217, lng: 75.8011, region: 'India' },
  { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', stateOrCountry: 'Rajasthan', country: 'India', isDomestic: true, tier: 3, lat: 24.6177, lng: 73.8961, region: 'India' },
  { code: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', stateOrCountry: 'Gujarat', country: 'India', isDomestic: true, tier: 3, lat: 22.3362, lng: 73.2263, region: 'India' },
  { code: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', stateOrCountry: 'Uttarakhand', country: 'India', isDomestic: true, tier: 3, lat: 30.1897, lng: 78.1803, region: 'India' },
  { code: 'IXA', name: 'Maharaja Bir Bikram Airport', city: 'Agartala', stateOrCountry: 'Tripura', country: 'India', isDomestic: true, tier: 3, lat: 23.8869, lng: 91.2405, region: 'India' },
  { code: 'IMF', name: 'Bir Tikendrajit International Airport', city: 'Imphal', stateOrCountry: 'Manipur', country: 'India', isDomestic: true, tier: 3, lat: 24.7600, lng: 93.8967, region: 'India' },
  { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', stateOrCountry: 'Andaman & Nicobar', country: 'India', isDomestic: true, tier: 3, lat: 11.6410, lng: 92.7297, region: 'India' },
];

export const INTERNATIONAL_AIRPORTS: GlobalAirport[] = [
  // North America
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', stateOrCountry: 'New York', country: 'United States', isDomestic: false, lat: 40.6413, lng: -73.7781, region: 'North America' },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York / Newark', stateOrCountry: 'New Jersey', country: 'United States', isDomestic: false, lat: 40.6895, lng: -74.1745, region: 'North America' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', stateOrCountry: 'California', country: 'United States', isDomestic: false, lat: 33.9416, lng: -118.4085, region: 'North America' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', stateOrCountry: 'California', country: 'United States', isDomestic: false, lat: 37.6213, lng: -122.3790, region: 'North America' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', stateOrCountry: 'Illinois', country: 'United States', isDomestic: false, lat: 41.9742, lng: -87.9073, region: 'North America' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', stateOrCountry: 'Florida', country: 'United States', isDomestic: false, lat: 25.7959, lng: -80.2870, region: 'North America' },
  { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', stateOrCountry: 'Massachusetts', country: 'United States', isDomestic: false, lat: 42.3656, lng: -71.0096, region: 'North America' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', stateOrCountry: 'Washington', country: 'United States', isDomestic: false, lat: 47.4502, lng: -122.3088, region: 'North America' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', stateOrCountry: 'Ontario', country: 'Canada', isDomestic: false, lat: 43.6777, lng: -79.6248, region: 'North America' },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', stateOrCountry: 'British Columbia', country: 'Canada', isDomestic: false, lat: 49.1967, lng: -123.1815, region: 'North America' },

  // Europe
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', stateOrCountry: 'England', country: 'United Kingdom', isDomestic: false, lat: 51.4700, lng: -0.4543, region: 'Europe' },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', stateOrCountry: 'England', country: 'United Kingdom', isDomestic: false, lat: 51.1537, lng: -0.1821, region: 'Europe' },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', stateOrCountry: 'Île-de-France', country: 'France', isDomestic: false, lat: 49.0097, lng: 2.5479, region: 'Europe' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', stateOrCountry: 'Hesse', country: 'Germany', isDomestic: false, lat: 50.0379, lng: 8.5622, region: 'Europe' },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', stateOrCountry: 'Bavaria', country: 'Germany', isDomestic: false, lat: 48.3537, lng: 11.7750, region: 'Europe' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', stateOrCountry: 'North Holland', country: 'Netherlands', isDomestic: false, lat: 52.3105, lng: 4.7683, region: 'Europe' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', stateOrCountry: 'Madrid', country: 'Spain', isDomestic: false, lat: 40.4839, lng: -3.5679, region: 'Europe' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat Airport', city: 'Barcelona', stateOrCountry: 'Catalonia', country: 'Spain', isDomestic: false, lat: 41.2974, lng: 2.0833, region: 'Europe' },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', stateOrCountry: 'Zurich', country: 'Switzerland', isDomestic: false, lat: 47.4582, lng: 8.5555, region: 'Europe' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', stateOrCountry: 'Lazio', country: 'Italy', isDomestic: false, lat: 41.8003, lng: 12.2389, region: 'Europe' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', stateOrCountry: 'Marmara', country: 'Turkey', isDomestic: false, lat: 41.2753, lng: 28.7519, region: 'Europe' },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', stateOrCountry: 'Dubai', country: 'United Arab Emirates', isDomestic: false, lat: 25.2532, lng: 55.3657, region: 'Middle East' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', stateOrCountry: 'Doha', country: 'Qatar', isDomestic: false, lat: 25.2731, lng: 51.6081, region: 'Middle East' },
  { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', stateOrCountry: 'Abu Dhabi', country: 'United Arab Emirates', isDomestic: false, lat: 24.4330, lng: 54.6511, region: 'Middle East' },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', stateOrCountry: 'Riyadh', country: 'Saudi Arabia', isDomestic: false, lat: 24.9576, lng: 46.6988, region: 'Middle East' },

  // Asia & Pacific
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', stateOrCountry: 'Singapore', country: 'Singapore', isDomestic: false, lat: 1.3644, lng: 103.9915, region: 'Asia' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', stateOrCountry: 'Bangkok', country: 'Thailand', isDomestic: false, lat: 13.6900, lng: 100.7501, region: 'Asia' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', stateOrCountry: 'Selangor', country: 'Malaysia', isDomestic: false, lat: 2.7456, lng: 101.7099, region: 'Asia' },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', stateOrCountry: 'Kanto', country: 'Japan', isDomestic: false, lat: 35.5494, lng: 139.7798, region: 'Asia' },
  { code: 'NRT', name: 'Tokyo Narita Airport', city: 'Tokyo / Narita', stateOrCountry: 'Chiba', country: 'Japan', isDomestic: false, lat: 35.7720, lng: 140.3929, region: 'Asia' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', stateOrCountry: 'Gyeonggi', country: 'South Korea', isDomestic: false, lat: 37.4602, lng: 126.4407, region: 'Asia' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', stateOrCountry: 'Chek Lap Kok', country: 'Hong Kong', isDomestic: false, lat: 22.3080, lng: 113.9185, region: 'Asia' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', stateOrCountry: 'New South Wales', country: 'Australia', isDomestic: false, lat: -33.9399, lng: 151.1753, region: 'Oceania' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', stateOrCountry: 'Victoria', country: 'Australia', isDomestic: false, lat: -37.6690, lng: 144.8410, region: 'Oceania' },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', stateOrCountry: 'Auckland', country: 'New Zealand', isDomestic: false, lat: -37.0082, lng: 174.7850, region: 'Oceania' }
];

export const ALL_AIRPORTS: GlobalAirport[] = [
  ...INDIAN_AIRPORTS,
  ...INTERNATIONAL_AIRPORTS
];

export function searchAirports(query: string): GlobalAirport[] {
  if (!query || query.trim().length === 0) {
    return [
      ALL_AIRPORTS.find(a => a.code === 'DEL')!,
      ALL_AIRPORTS.find(a => a.code === 'JFK')!,
      ALL_AIRPORTS.find(a => a.code === 'LHR')!,
      ALL_AIRPORTS.find(a => a.code === 'DXB')!,
      ALL_AIRPORTS.find(a => a.code === 'SIN')!,
      ALL_AIRPORTS.find(a => a.code === 'BOM')!,
      ALL_AIRPORTS.find(a => a.code === 'SFO')!,
      ALL_AIRPORTS.find(a => a.code === 'HND')!,
    ].filter(Boolean);
  }

  const q = query.toLowerCase().trim();
  return ALL_AIRPORTS.filter(
    a =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.stateOrCountry.toLowerCase().includes(q)
  );
}

export function getAirportByCode(code: string): GlobalAirport | undefined {
  if (!code) return undefined;
  return ALL_AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
}

/**
 * Calculates Great Circle distance between two airports using the Haversine formula
 */
export function calculateAirDistanceKm(originCode: string, destCode: string): number {
  const o = getAirportByCode(originCode);
  const d = getAirportByCode(destCode);

  if (!o?.lat || !o?.lng || !d?.lat || !d?.lng) {
    return 1400; // default fallback
  }

  const R = 6371; // Earth radius in km
  const dLat = ((d.lat - o.lat) * Math.PI) / 180;
  const dLon = ((d.lng - o.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((o.lat * Math.PI) / 180) *
      Math.cos((d.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
