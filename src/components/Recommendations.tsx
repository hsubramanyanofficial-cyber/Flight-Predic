import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RecommendationOffer } from '../types';
import { FlightCard } from './FlightCard';
import * as api from '../services/api';
import { Compass, Sparkles, Award, Zap, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

export const Recommendations: React.FC = () => {
  const { userPreferences, setActiveTab, setSearchParams } = useApp();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [homeAirport, setHomeAirport] = useState('DEL');
  const [destination, setDestination] = useState('BOM');
  const [travelDate, setTravelDate] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.fetchRecommendations();
      setRecommendations(data.recommendations || []);
      setHomeAirport(data.homeAirport);
      setDestination(data.destination);
      setTravelDate(data.travelDate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Compass className="h-4 w-4" />
            <span>Intelligent Personalized Curation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Personalized Itinerary Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tailored specifically for {userPreferences?.displayName || 'you'} departing from home base{' '}
            <strong className="text-white font-mono">{homeAirport}</strong> based on your preferred airlines, historical price assessments, and travel preferences.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('profile')}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 transition"
        >
          Customize Travel Preferences →
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-20 text-center border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400">
          No recommendations available for the selected profile criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec, index) => {
            const getCategoryBadge = () => {
              switch (rec.category) {
                case 'BEST_VALUE':
                  return {
                    label: 'Best Overall Value',
                    icon: <Award className="h-4 w-4 text-sky-400" />,
                    bg: 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  };
                case 'FASTEST':
                  return {
                    label: 'Fastest Transit',
                    icon: <Zap className="h-4 w-4 text-amber-400" />,
                    bg: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  };
                case 'BUDGET_PICK':
                  return {
                    label: 'Lowest Fare Deal',
                    icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
                    bg: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  };
                case 'LOYALTY_CHOICE':
                  return {
                    label: 'Preferred Airline Match',
                    icon: <HeartHandshake className="h-4 w-4 text-rose-400" />,
                    bg: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  };
                default:
                  return {
                    label: 'Recommended',
                    icon: <Sparkles className="h-4 w-4 text-sky-400" />,
                    bg: 'border-slate-700 bg-slate-800 text-slate-200'
                  };
              }
            };

            const cat = getCategoryBadge();

            return (
              <div
                key={rec.offer.id || index}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4"
              >
                {/* Recommendation Explanatory Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wider">
                      {cat.icon}
                      <span className="text-white">{cat.label}</span>
                    </div>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-sky-400 font-mono font-semibold">Match Score: {rec.score}%</span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Route: {rec.offer.origin} → {rec.offer.destination} ({travelDate})
                  </span>
                </div>

                {/* Plain-language explanation of why it was picked */}
                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Why recommended:</strong> {rec.rationale}
                </div>

                {/* Render the Flight Card for this offer */}
                <FlightCard
                  flight={rec.offer}
                  prediction={rec.prediction}
                  intelligence={rec.priceIntelligence}
                />
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
