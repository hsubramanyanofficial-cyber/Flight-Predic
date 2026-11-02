/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PackingChecklistData, PackingItem } from '../types';

/**
 * Intelligent client-side fallback checklist generator when offline or in demo mode.
 */
export function generateLocalChecklist(
  destinationCity: string,
  durationDays: number = 7,
  tripType: string = 'leisure'
): PackingChecklistData {
  const cityLower = (destinationCity || '').toLowerCase();
  const days = Math.max(1, durationDays);

  // Climate classification
  let climateType = 'Temperate & Variable';
  let weatherSummary = 'Moderate daytime temperatures 20°C–25°C, cool evenings 14°C–18°C.';
  let dressCode = 'Smart casual layers with a comfortable walking shoe and lightweight outer jacket.';

  const isTropical = cityLower.includes('goa') || cityLower.includes('singapore') || cityLower.includes('bangkok') || cityLower.includes('bali') || cityLower.includes('phuket') || cityLower.includes('maldives') || cityLower.includes('chennai') || cityLower.includes('kochi') || cityLower.includes('mumbai');
  const isDesert = cityLower.includes('dubai') || cityLower.includes('doha') || cityLower.includes('abu dhabi') || cityLower.includes('riyadh') || cityLower.includes('cairo') || cityLower.includes('jaipur') || cityLower.includes('jaisalmer');
  const isColdMountain = cityLower.includes('leh') || cityLower.includes('srinagar') || cityLower.includes('manali') || cityLower.includes('shimla') || cityLower.includes('zurich') || cityLower.includes('geneva') || cityLower.includes('iceland');
  const isEuroMetropolis = cityLower.includes('london') || cityLower.includes('paris') || cityLower.includes('amsterdam') || cityLower.includes('new york') || cityLower.includes('tokyo') || cityLower.includes('frankfurt');

  if (isTropical) {
    climateType = 'Tropical / Humid';
    weatherSummary = 'Warm & humid, 28°C–33°C. High UV index with periodic afternoon showers or ocean breezes.';
    dressCode = 'Breathable linen, quick-dry cotton, swimwear, UV sunglasses, and open sandals.';
  } else if (isDesert) {
    climateType = 'Arid / Desert';
    weatherSummary = 'Sunny & dry, daytime 29°C–35°C, dipping to pleasant 18°C–22°C at night. Powerful indoor AC.';
    dressCode = 'Modest lightweight clothing covering shoulders/knees for cultural sites; light sweater for indoors.';
  } else if (isColdMountain) {
    climateType = 'Alpine / Cold High-Altitude';
    weatherSummary = 'Chilly to freezing, 0°C–12°C with brisk winds and sharp UV reflection.';
    dressCode = 'Thermal base layers, fleece mid-layer, windproof down jacket, woolen beanie, and sturdy boots.';
  } else if (isEuroMetropolis) {
    climateType = 'Temperate Maritime / Continental';
    weatherSummary = 'Variable weather, 12°C–20°C with frequent cloud cover and intermittent rain.';
    dressCode = 'Versatile layering, trench coat or windbreaker, compact travel umbrella, and stylish walking shoes.';
  }

  // Calculate scaled clothing quantities based on duration
  const shirtsCount = Math.min(10, Math.max(3, days + 1));
  const bottomsCount = Math.min(5, Math.max(2, Math.ceil(days / 2)));
  const underwearCount = Math.min(10, Math.max(3, days + 2));
  const socksCount = Math.min(10, Math.max(3, days + 1));

  const items: PackingItem[] = [
    // Documents
    {
      id: 'doc-passport',
      category: 'documents',
      name: 'Passport & Government Photo ID',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Ensure at least 6 months validity from return date'
    },
    {
      id: 'doc-tickets',
      category: 'documents',
      name: 'Flight Boarding Passes & Itinerary',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Saved offline on smartphone + 1 printed copy'
    },
    {
      id: 'doc-insurance',
      category: 'documents',
      name: 'Travel Medical Insurance Policy',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Includes overseas hospitalisation and baggage loss cover'
    },
    {
      id: 'doc-forex',
      category: 'documents',
      name: 'Forex Multi-Currency Card & Local Cash',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Carry nominal local currency for airport transit and tips'
    },

    // Clothing (scaled to trip length)
    {
      id: 'cloth-shirts',
      category: 'clothing',
      name: 'Breathable Shirts / T-Shirts',
      quantity: shirtsCount,
      packed: false,
      isEssential: true,
      notes: `${days}-day supply in wrinkle-resistant fabric`
    },
    {
      id: 'cloth-bottoms',
      category: 'clothing',
      name: 'Trousers / Chinos / Travel Pants',
      quantity: bottomsCount,
      packed: false,
      isEssential: true,
      notes: 'Versatile neutral colors suitable for day and evening'
    },
    {
      id: 'cloth-innerwear',
      category: 'clothing',
      name: 'Underwear & Baselayers',
      quantity: underwearCount,
      packed: false,
      isEssential: true,
      notes: 'Moisture-wicking, quick drying fabrics'
    },
    {
      id: 'cloth-socks',
      category: 'clothing',
      name: 'Comfortable Walking Socks',
      quantity: socksCount,
      packed: false,
      isEssential: true,
      notes: 'Cushioned for long airport walks and city touring'
    },
    {
      id: 'cloth-outerwear',
      category: 'clothing',
      name: isColdMountain ? 'Heavy Down Parka & Thermal Fleece' : 'Lightweight Jacket / Cardigan',
      quantity: isColdMountain ? 2 : 1,
      packed: false,
      isEssential: true,
      notes: 'Crucial for freezing aircraft cabins and evening drops'
    },
    {
      id: 'cloth-footwear',
      category: 'clothing',
      name: 'Comfortable Walking Sneakers / Shoes',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Broken-in pair to prevent blisters during travel'
    },

    // Electronics & Cabin Regulation Compliance
    {
      id: 'elec-powerbank',
      category: 'electronics',
      name: 'Power Bank (< 100Wh / 20,000mAh)',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: '⚠️ MANDATORY: Must be packed in HAND LUGGAGE only (forbidden in checked baggage)'
    },
    {
      id: 'elec-adapter',
      category: 'electronics',
      name: isDesert || cityLower.includes('london') ? 'Universal Travel Adapter (Type G Plug)' : 'Universal All-in-One Plug Adapter',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Supports local voltage and socket pins'
    },
    {
      id: 'elec-cables',
      category: 'electronics',
      name: 'Fast Charging Cables (USB-C & Lightning)',
      quantity: 2,
      packed: false,
      isEssential: true,
      notes: 'Keep 1 cable in carry-on bag for in-seat flight power'
    },
    {
      id: 'elec-headphones',
      category: 'electronics',
      name: 'Noise-Cancelling Headphones / Earbuds',
      quantity: 1,
      packed: false,
      isEssential: false,
      notes: 'Cuts engine drone on long flights'
    },

    // Toiletries (TSA / DGCA 100ml liquid limits)
    {
      id: 'toil-liquids',
      category: 'toiletries',
      name: 'TSA-Compliant Clear Liquids Pouch (≤ 100ml each)',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Liquids, gels, and aerosols must be in ≤ 100ml containers in 1 transparent quart bag'
    },
    {
      id: 'toil-sunscreen',
      category: 'toiletries',
      name: 'High SPF Sunscreen & Lip Balm',
      quantity: 1,
      packed: false,
      isEssential: isTropical || isDesert,
      notes: 'UVA/UVB broad spectrum protection'
    },
    {
      id: 'toil-oralcare',
      category: 'toiletries',
      name: 'Travel Toothbrush & Toothpaste',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Compact hygiene kit'
    },

    // Essentials & First Aid
    {
      id: 'ess-meds',
      category: 'essentials',
      name: 'Personal Prescription Medication + Motion Sickness Pills',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Keep in original packaging in carry-on with doctor prescription'
    },
    {
      id: 'ess-pillow',
      category: 'essentials',
      name: 'Memory Foam Neck Pillow & Eye Mask',
      quantity: 1,
      packed: false,
      isEssential: false,
      notes: 'Great for resting on long-haul transit'
    },
    {
      id: 'ess-waterbottle',
      category: 'essentials',
      name: 'Collapsible Empty Water Bottle',
      quantity: 1,
      packed: false,
      isEssential: false,
      notes: 'Pass empty through airport security, refill at departure gate'
    }
  ];

  // Destination-specific extras
  if (isTropical) {
    items.push({
      id: 'dest-swim',
      category: 'destination_specific',
      name: 'Swimwear & Quick-Dry Microfiber Towel',
      quantity: 2,
      packed: false,
      isEssential: false,
      notes: 'For beach, pool, and watersports'
    });
    items.push({
      id: 'dest-repellent',
      category: 'destination_specific',
      name: 'Mosquito & Insect Repellent Spray',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'DEET or citronella formula for humid evenings'
    });
  } else if (isDesert) {
    items.push({
      id: 'dest-sunglasses',
      category: 'destination_specific',
      name: 'Polarized UV Sunglasses & Wide-Brim Hat',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Protects eyes from intense reflective glare and sand'
    });
    items.push({
      id: 'dest-hydration',
      category: 'destination_specific',
      name: 'Electrolyte Hydration Sachets & Moisturizer',
      quantity: 4,
      packed: false,
      isEssential: false,
      notes: 'Fights dry desert air and rapid moisture loss'
    });
  } else if (isColdMountain) {
    items.push({
      id: 'dest-thermals',
      category: 'destination_specific',
      name: 'Merino Wool Thermal Inner Tops & Bottoms',
      quantity: 2,
      packed: false,
      isEssential: true,
      notes: 'Essential base layer for sub-zero temperatures'
    });
    items.push({
      id: 'dest-gloves',
      category: 'destination_specific',
      name: 'Windproof Insulated Gloves & Woolen Scarf',
      quantity: 1,
      packed: false,
      isEssential: true,
      notes: 'Touchscreen-compatible fingertips recommended'
    });
  }

  return {
    destinationClimate: climateType,
    weatherSummary,
    recommendedDressCode: dressCode,
    durationDays: days,
    tripType: tripType as any,
    items,
    lastGeneratedAt: new Date().toISOString()
  };
}

/**
 * Calls server-side Gemini AI to generate a destination & climate-aware packing checklist,
 * falling back smoothly to client-side heuristic generation if network/API is unavailable.
 */
export async function fetchAiPackingChecklist(params: {
  destinationCity: string;
  destinationCountry?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  tripType?: string;
  cabinClass?: string;
}): Promise<PackingChecklistData> {
  const {
    destinationCity,
    destinationCountry = '',
    startDate = '',
    endDate = '',
    durationDays = 7,
    tripType = 'leisure',
    cabinClass = 'economy'
  } = params;

  try {
    const response = await fetch('/api/trip/generate-packing-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationCity,
        destinationCountry,
        startDate,
        endDate,
        durationDays,
        tripType,
        cabinClass
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data.items)) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('API packing checklist fetch encountered error, using local generator:', err);
  }

  // Graceful fallback
  return generateLocalChecklist(destinationCity, durationDays, tripType);
}
