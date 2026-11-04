export interface PassengerReview {
  id: string;
  author: string;
  date: string;
  rating: number; // 1 to 5
  route: string;
  cabinClass: string;
  verifiedPassenger: boolean;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
}

export interface AirlineReviewData {
  airlineCode: string;
  airlineName: string;
  overallRating: number; // e.g. 4.4 out of 5
  recommendPercent: number; // e.g. 88%
  totalReviews: number;
  ratingBreakdown: {
    seatComfort: number;
    cabinService: number;
    foodAndBeverage: number;
    onTimeReliability: number;
    valueForMoney: number;
    cleanliness: number;
  };
  sentimentSummary: string;
  awards: string[];
  recentReviews: PassengerReview[];
}

export const AIRLINE_REVIEWS_REGISTRY: Record<string, AirlineReviewData> = {
  '6E': {
    airlineCode: '6E',
    airlineName: 'IndiGo',
    overallRating: 4.3,
    recommendPercent: 86,
    totalReviews: 24890,
    ratingBreakdown: {
      seatComfort: 3.8,
      cabinService: 4.2,
      foodAndBeverage: 3.6,
      onTimeReliability: 4.8,
      valueForMoney: 4.6,
      cleanliness: 4.5
    },
    sentimentSummary: 'High praise for punctual departures, streamlined boarding, and competitive fares. Slimline seats noted as firm on flights over 3 hours.',
    awards: ['Best Low-Cost Airline Central Asia 2026', 'DGCA Top Punctuality Leader'],
    recentReviews: [
      {
        id: 'rev_6e_1',
        author: 'Arjun M.',
        date: '2026-10-28',
        rating: 5,
        route: 'DEL → BOM',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Impeccable on-time departure and fast luggage delivery',
        comment: 'Flight pushed back 5 minutes early from T2. Cabin was spotless and the 6E pre-booked sandwich was surprisingly fresh.',
        pros: ['Punctual', 'Fast Bag Claim', 'Courteous Crew'],
        cons: ['Tight legroom for tall passengers']
      },
      {
        id: 'rev_6e_2',
        author: 'Priya K.',
        date: '2026-10-15',
        rating: 4,
        route: 'BLR → DXB',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Great value international short-haul',
        comment: 'Smooth immigration and quick boarding. Buy on board meals were reasonably priced. Seat recline is minimal but acceptable for 4 hours.',
        pros: ['Affordable Fare', 'Modern A321neo', 'Quiet Cabin'],
        cons: ['No seatback screens']
      }
    ]
  },
  'AI': {
    airlineCode: 'AI',
    airlineName: 'Air India',
    overallRating: 4.1,
    recommendPercent: 82,
    totalReviews: 19420,
    ratingBreakdown: {
      seatComfort: 4.2,
      cabinService: 4.1,
      foodAndBeverage: 4.4,
      onTimeReliability: 3.9,
      valueForMoney: 4.2,
      cleanliness: 4.0
    },
    sentimentSummary: 'Passengers consistently applaud generous 25kg free baggage, authentic hot Indian meals, and revamped A350 flagship interiors.',
    awards: ['World Travel Awards Most Improved Airline 2026', 'Best Indian In-Flight Culinary Program'],
    recentReviews: [
      {
        id: 'rev_ai_1',
        author: 'Vikram S.',
        date: '2026-10-24',
        rating: 5,
        route: 'DEL → LHR',
        cabinClass: 'Premium Economy',
        verifiedPassenger: true,
        title: 'New A350-900 cabin experience was outstanding',
        comment: 'Spacious seat pitch with calf rests and crisp 4K touchscreens. Hot biryani meal was airline catering at its finest.',
        pros: ['Generous 2x23kg baggage', 'Delicious Hot Meals', 'Modern A350 IFE'],
        cons: ['Check-in queue at Delhi T3 was a bit slow']
      },
      {
        id: 'rev_ai_2',
        author: 'Sunita R.',
        date: '2026-10-10',
        rating: 4,
        route: 'BOM → DEL',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Hot meal included on a domestic 2-hour flight',
        comment: 'Warm hospitality from the crew and very comfortable wide seats on the Boeing 777 widebody repositioning flight.',
        pros: ['Full Service with Meal', 'Widebody Comfort', 'Warm Hospitality'],
        cons: ['Delayed boarding by 20 minutes']
      }
    ]
  },
  'EK': {
    airlineCode: 'EK',
    airlineName: 'Emirates',
    overallRating: 4.8,
    recommendPercent: 94,
    totalReviews: 54100,
    ratingBreakdown: {
      seatComfort: 4.7,
      cabinService: 4.8,
      foodAndBeverage: 4.8,
      onTimeReliability: 4.7,
      valueForMoney: 4.4,
      cleanliness: 4.9
    },
    sentimentSummary: 'World-class passenger satisfaction with the award-winning ICE entertainment system, multi-course dining, and spacious A380 cabins.',
    awards: ['Skytrax World Best Inflight Entertainment 2026', 'Best International Long-Haul Carrier'],
    recentReviews: [
      {
        id: 'rev_ek_1',
        author: 'David H.',
        date: '2026-10-30',
        rating: 5,
        route: 'DXB → LHR',
        cabinClass: 'Business',
        verifiedPassenger: true,
        title: 'A380 Onboard Lounge and lie-flat comfort is unbeatable',
        comment: 'Enjoyed espresso and cocktails in the sky bar. Food presentation was Michelin-caliber and Wi-Fi worked without interruption.',
        pros: ['Onboard Bar Lounge', 'Extensive 6,500 Channel ICE', 'Chauffeur Drive Service'],
        cons: ['Premium fare pricing']
      },
      {
        id: 'rev_ek_2',
        author: 'Ananya D.',
        date: '2026-10-18',
        rating: 5,
        route: 'BOM → DXB',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Superb service even on a short 3-hour flight',
        comment: 'Crew offered toys and coloring packs for children immediately upon boarding. Metal cutlery and complimentary wine in Economy.',
        pros: ['Family-Friendly', 'Quality Food & Drinks', 'Spacious Seating'],
        cons: ['Baggage took 30 mins at Dubai carousel']
      }
    ]
  },
  'BA': {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    overallRating: 4.2,
    recommendPercent: 81,
    totalReviews: 32600,
    ratingBreakdown: {
      seatComfort: 4.1,
      cabinService: 4.3,
      foodAndBeverage: 4.0,
      onTimeReliability: 4.1,
      valueForMoney: 4.0,
      cleanliness: 4.3
    },
    sentimentSummary: 'Appreciated for extensive transatlantic connectivity, Club Suite privacy doors, and professional flight crew service.',
    awards: ['Best Transatlantic Network 2026', 'oneworld Premier Carrier'],
    recentReviews: [
      {
        id: 'rev_ba_1',
        author: 'James C.',
        date: '2026-10-22',
        rating: 4,
        route: 'LHR → JFK',
        cabinClass: 'Club World (Business)',
        verifiedPassenger: true,
        title: 'Club Suite with sliding door gave wonderful privacy',
        comment: 'Direct aisle access and luxurious White Company bedding ensured 6 hours of restful sleep across the Atlantic.',
        pros: ['Sliding Door Privacy', 'Comfortable Bedding', 'Heathrow T5 Lounges'],
        cons: ['Mid-flight snack options were limited']
      }
    ]
  },
  'SQ': {
    airlineCode: 'SQ',
    airlineName: 'Singapore Airlines',
    overallRating: 4.9,
    recommendPercent: 96,
    totalReviews: 48900,
    ratingBreakdown: {
      seatComfort: 4.8,
      cabinService: 5.0,
      foodAndBeverage: 4.8,
      onTimeReliability: 4.8,
      valueForMoney: 4.5,
      cleanliness: 4.9
    },
    sentimentSummary: 'Top-tier luxury and hospitality worldwide. Celebrated for attentive Singapore Girl cabin crew, Book the Cook menu, and quiet cabins.',
    awards: ['Skytrax World Best Airline 2026', 'World Best Cabin Staff'],
    recentReviews: [
      {
        id: 'rev_sq_1',
        author: 'Meera P.',
        date: '2026-10-29',
        rating: 5,
        route: 'DEL → SIN',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'The gold standard of commercial aviation',
        comment: 'Warm scented towels before takeoff, complimentary high-speed Wi-Fi for KrisFlyer members, and genuinely caring crew.',
        pros: ['Unmatched Crew Hospitality', 'Free In-flight Wi-Fi', 'Exceptional Legroom'],
        cons: ['Higher ticket cost']
      }
    ]
  },
  'QP': {
    airlineCode: 'QP',
    airlineName: 'Akasa Air',
    overallRating: 4.5,
    recommendPercent: 89,
    totalReviews: 8750,
    ratingBreakdown: {
      seatComfort: 4.4,
      cabinService: 4.6,
      foodAndBeverage: 4.5,
      onTimeReliability: 4.6,
      valueForMoney: 4.7,
      cleanliness: 4.8
    },
    sentimentSummary: 'Rising domestic star praised for brand new Boeing 737 MAX cabins with USB-C ports at every seat and gourmet Café Akasa meals.',
    awards: ['Best Emerging Airline Asia-Pacific 2026'],
    recentReviews: [
      {
        id: 'rev_qp_1',
        author: 'Rohan N.',
        date: '2026-10-25',
        rating: 5,
        route: 'BOM → GOI',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Superb Café Akasa meals and USB ports at seat',
        comment: 'Cushioned seats with ample knee room. The Vietnamese cold coffee and wrap were cafe quality. Crew was full of energy.',
        pros: ['USB Charging Ports', 'Cafe Akasa Food Quality', 'Brand New Aircraft'],
        cons: ['Fewer flight frequencies than IndiGo']
      }
    ]
  },
  'UK': {
    airlineCode: 'UK',
    airlineName: 'Vistara',
    overallRating: 4.6,
    recommendPercent: 91,
    totalReviews: 21300,
    ratingBreakdown: {
      seatComfort: 4.6,
      cabinService: 4.7,
      foodAndBeverage: 4.6,
      onTimeReliability: 4.5,
      valueForMoney: 4.4,
      cleanliness: 4.7
    },
    sentimentSummary: 'Beloved full-service carrier known for three-class cabins (Economy, Premium Economy, Business), Starbucks coffee, and fine dining.',
    awards: ['Best Full Service Airline India & South Asia 2026'],
    recentReviews: [
      {
        id: 'rev_uk_1',
        author: 'Kavita B.',
        date: '2026-10-19',
        rating: 5,
        route: 'DEL → BLR',
        cabinClass: 'Premium Economy',
        verifiedPassenger: true,
        title: 'Premium Economy is the sweet spot for domestic travel',
        comment: 'Dedicated check-in counter, priority baggage tags, and a delicious hot lunch with warm bread rolls.',
        pros: ['Dedicated Premium Economy', 'Priority Baggage Handling', 'Warm Dining'],
        cons: ['Higher price during peak corporate hours']
      }
    ]
  },
  'SG': {
    airlineCode: 'SG',
    airlineName: 'SpiceJet',
    overallRating: 3.7,
    recommendPercent: 71,
    totalReviews: 12400,
    ratingBreakdown: {
      seatComfort: 3.6,
      cabinService: 3.8,
      foodAndBeverage: 3.7,
      onTimeReliability: 3.5,
      valueForMoney: 4.1,
      cleanliness: 3.7
    },
    sentimentSummary: 'Budget-friendly option serving regional tier-2 and tier-3 routes. SpiceMax extra legroom seats praised by frequent flyers.',
    awards: ['Regional Connectivity Leader'],
    recentReviews: [
      {
        id: 'rev_sg_1',
        author: 'Deepak V.',
        date: '2026-10-14',
        rating: 4,
        route: 'DEL → JAI',
        cabinClass: 'SpiceMax',
        verifiedPassenger: true,
        title: 'SpiceMax extra legroom made a big difference',
        comment: 'Front rows had vast leg space and free hot beverage. Slight 25 minute departure delay but recovered time in the air.',
        pros: ['Affordable SpiceMax Upgrade', 'Good Regional Network'],
        cons: ['Occasional schedule changes']
      }
    ]
  }
};

export function getAirlineReviews(airlineNameOrCode: string): AirlineReviewData {
  const norm = (airlineNameOrCode || '').toUpperCase().trim();
  
  // By Code
  if (AIRLINE_REVIEWS_REGISTRY[norm]) {
    return AIRLINE_REVIEWS_REGISTRY[norm];
  }

  // By Name match
  for (const item of Object.values(AIRLINE_REVIEWS_REGISTRY)) {
    if (
      item.airlineName.toUpperCase().includes(norm) ||
      norm.includes(item.airlineName.toUpperCase())
    ) {
      return item;
    }
  }

  // Fallback realistic generic review data
  return {
    airlineCode: norm.slice(0, 2),
    airlineName: airlineNameOrCode,
    overallRating: 4.2,
    recommendPercent: 83,
    totalReviews: 6420,
    ratingBreakdown: {
      seatComfort: 4.0,
      cabinService: 4.3,
      foodAndBeverage: 4.1,
      onTimeReliability: 4.2,
      valueForMoney: 4.1,
      cleanliness: 4.3
    },
    sentimentSummary: 'Consistently positive passenger feedback on in-flight crew courtesy and safe navigation.',
    awards: ['Certified Global Air Carrier'],
    recentReviews: [
      {
        id: `rev_generic_${Date.now()}`,
        author: 'Verified Traveler',
        date: '2026-10-20',
        rating: 4,
        route: 'Domestic / International Sector',
        cabinClass: 'Economy',
        verifiedPassenger: true,
        title: 'Smooth, reliable travel experience',
        comment: 'Clean cabin, friendly crew, and on-time flight. Would book again for this corridor.',
        pros: ['Reliable Service', 'Friendly Crew'],
        cons: ['Standard seat pitch']
      }
    ]
  };
}
