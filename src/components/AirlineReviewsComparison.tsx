import React, { useState, useEffect } from 'react';
import { FlightOffer } from '../types';
import { AirlineReviewData, PassengerReview, getAirlineReviews } from '../data/airlineReviews';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Award,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Plane,
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users
} from 'lucide-react';

interface AirlineReviewsComparisonProps {
  flights: FlightOffer[];
}

export const AirlineReviewsComparison: React.FC<AirlineReviewsComparisonProps> = ({ flights }) => {
  const [reviewsData, setReviewsData] = useState<Record<string, AirlineReviewData>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'reviews'>('matrix');
  const [selectedAirline, setSelectedAirline] = useState<string>('');

  // Extract unique airlines from flights
  const uniqueAirlines = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    flights.forEach(f => {
      if (!map.has(f.airlineName)) {
        map.set(f.airlineName, { code: f.airlineCode, name: f.airlineName });
      }
    });
    return Array.from(map.values());
  }, [flights]);

  useEffect(() => {
    if (uniqueAirlines.length > 0 && !selectedAirline) {
      setSelectedAirline(uniqueAirlines[0].name);
    }
  }, [uniqueAirlines, selectedAirline]);

  // Fetch reviews from travel review API
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/airlines/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airlineCodes: uniqueAirlines.map(a => a.code),
          airlineNames: uniqueAirlines.map(a => a.name)
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const dict: Record<string, AirlineReviewData> = {};
        data.data.forEach((item: AirlineReviewData) => {
          dict[item.airlineName] = item;
          dict[item.airlineCode] = item;
        });
        setReviewsData(dict);
      }
    } catch (err) {
      console.error('Failed to fetch airline reviews:', err);
      // Fallback directly to client registry
      const dict: Record<string, AirlineReviewData> = {};
      uniqueAirlines.forEach(a => {
        dict[a.name] = getAirlineReviews(a.name);
      });
      setReviewsData(dict);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uniqueAirlines.length > 0) {
      fetchReviews();
    }
  }, [uniqueAirlines]);

  if (uniqueAirlines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Users className="h-4 w-4" />
            <span>Passenger Satisfaction & Verified Travel Reviews</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
            Airline Passenger Ratings & Experience Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated passenger sentiment, seat comfort, in-flight dining, and verified traveler reviews across compared carriers.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'matrix' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satisfaction Scores
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Passenger Reviews</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 rounded-xl border border-slate-800 bg-slate-950/40 animate-pulse flex items-center justify-center text-slate-500 text-xs gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Fetching verified traveler reviews and passenger satisfaction metrics...</span>
        </div>
      ) : activeTab === 'matrix' ? (
        
        /* Tab 1: Side-by-Side Satisfaction Score Matrix */
        <div className="space-y-6">
          <div className={`grid grid-cols-1 ${uniqueAirlines.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 sm:gap-6`}>
            {uniqueAirlines.map(airline => {
              const data = reviewsData[airline.name] || reviewsData[airline.code] || getAirlineReviews(airline.name);
              const b = data.ratingBreakdown;

              return (
                <div
                  key={airline.name}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    
                    {/* Airline Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                            {data.airlineCode}
                          </span>
                          <h3 className="font-bold text-white text-base">{data.airlineName}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Based on {data.totalReviews.toLocaleString()} verified passenger reviews
                        </span>
                      </div>

                      {/* Overall Rating Badge */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-amber-400 font-black text-xl font-mono">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{data.overallRating.toFixed(1)}</span>
                          <span className="text-xs text-slate-500 font-normal">/5</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {data.recommendPercent}% Recommend
                        </span>
                      </div>
                    </div>

                    {/* Sentiment Summary */}
                    <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs text-slate-300 leading-relaxed italic">
                      "{data.sentimentSummary}"
                    </div>

                    {/* Dimensional Satisfaction Breakdown */}
                    <div className="space-y-2.5 pt-1 text-xs">
                      
                      {/* Seat Comfort */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Seat Comfort & Legroom</span>
                          <span className="font-mono text-white font-bold">{b.seatComfort} / 5</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(b.seatComfort / 5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Cabin Service */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Cabin Crew & Hospitality</span>
                          <span className="font-mono text-white font-bold">{b.cabinService} / 5</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(b.cabinService / 5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Food & Dining */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Food & In-Flight Dining</span>
                          <span className="font-mono text-white font-bold">{b.foodAndBeverage} / 5</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(b.foodAndBeverage / 5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Punctuality */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">On-Time Performance</span>
                          <span className="font-mono text-white font-bold">{b.onTimeReliability} / 5</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${(b.onTimeReliability / 5) * 100}%` }} />
                        </div>
                      </div>

                      {/* Value */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Value for Money</span>
                          <span className="font-mono text-white font-bold">{b.valueForMoney} / 5</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-purple-400 h-full rounded-full" style={{ width: `${(b.valueForMoney / 5) * 100}%` }} />
                        </div>
                      </div>

                    </div>

                    {/* Awards */}
                    {data.awards.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {data.awards.map((award, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20"
                          >
                            <Award className="h-3 w-3" />
                            {award}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  <button
                    onClick={() => {
                      setSelectedAirline(airline.name);
                      setActiveTab('reviews');
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                    <span>Read Recent Traveler Reviews</span>
                  </button>

                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* Tab 2: Recent Verified Passenger Reviews */
        <div className="space-y-5">
          {/* Airline Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Carrier:</span>
            {uniqueAirlines.map(a => {
              const isSelected = selectedAirline === a.name;
              return (
                <button
                  key={a.name}
                  onClick={() => setSelectedAirline(a.name)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {a.name} ({a.code})
                </button>
              );
            })}
          </div>

          {/* Reviews List */}
          {(() => {
            const currentData = reviewsData[selectedAirline] || getAirlineReviews(selectedAirline);
            const reviews = currentData.recentReviews || [];

            if (reviews.length === 0) {
              return (
                <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 text-xs">
                  No written reviews found for this airline yet.
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rev.author}</span>
                        {rev.verifiedPassenger && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> Verified Passenger
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">· {rev.route}</span>
                        <span className="text-xs text-slate-500 font-mono">({rev.cabinClass})</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <span>{rev.date}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      "{rev.title}"
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>

                    {/* Pros and Cons */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px]">
                      {rev.pros.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-emerald-400 font-semibold">Pros:</span>
                          {rev.pros.map((pro, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              + {pro}
                            </span>
                          ))}
                        </div>
                      )}
                      {rev.cons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-400 font-semibold">Cons:</span>
                          {rev.cons.map((con, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              - {con}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

      )}

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Ratings aggregated from verified post-flight surveys, Skytrax, and aviation authority passenger audits</span>
        </span>
        <span className="font-mono">Updated Daily</span>
      </div>

    </div>
  );
};
