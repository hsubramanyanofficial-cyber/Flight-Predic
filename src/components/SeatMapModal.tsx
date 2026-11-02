import React, { useState } from 'react';
import { FlightOffer, CabinClass } from '../types';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import { Armchair, Check, X, Sparkles, ShieldCheck, DollarSign, Info } from 'lucide-react';

import { SupportedCurrency } from '../utils/currency';

interface SeatMapModalProps {
  flight: FlightOffer;
  onClose: () => void;
  currency: SupportedCurrency;
}

interface Seat {
  id: string;
  row: number;
  col: string;
  type: 'standard' | 'extra_legroom' | 'window' | 'aisle' | 'middle';
  status: 'available' | 'occupied' | 'selected' | 'premium';
  priceInr: number;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({ flight, onClose, currency }) => {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [successBooked, setSuccessBooked] = useState(false);

  // Generate deterministic cabin seat grid based on flight ID
  const rows = flight.cabinClass === 'business' ? 6 : flight.cabinClass === 'premium_economy' ? 10 : 25;
  const cols = flight.cabinClass === 'business' ? ['A', 'C', 'D', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F'];

  const [seats, setSeats] = useState<Seat[]>(() => {
    const list: Seat[] = [];
    for (let r = 1; r <= rows; r++) {
      cols.forEach((c, cIdx) => {
        // Deterministic occupancy based on row & col char code
        const isOcc = (r * 7 + c.charCodeAt(0)) % 3 === 0;
        const isExtra = r === 1 || r === 12 || r === 13; // Emergency exit or bulkhead
        const isWindow = c === cols[0] || c === cols[cols.length - 1];
        const isAisle = cIdx === 1 || cIdx === 2 || cIdx === 3 && cols.length === 6;

        let type: Seat['type'] = 'standard';
        let seatPrice = 0;

        if (isExtra) {
          type = 'extra_legroom';
          seatPrice = 1200;
        } else if (isWindow) {
          type = 'window';
          seatPrice = 400;
        } else if (isAisle) {
          type = 'aisle';
          seatPrice = 300;
        }

        if (flight.cabinClass === 'business') {
          seatPrice = 3500;
          type = 'extra_legroom';
        }

        list.push({
          id: `${r}${c}`,
          row: r,
          col: c,
          type,
          status: isOcc ? 'occupied' : 'available',
          priceInr: seatPrice
        });
      });
    }
    return list;
  });

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;

    setSeats(prev => prev.map(s => {
      if (s.id === selectedSeat?.id) {
        return { ...s, status: 'available' };
      }
      if (s.id === seat.id) {
        return { ...s, status: 'selected' };
      }
      return s;
    }));

    setSelectedSeat(seat);
  };

  const handleConfirmSeat = () => {
    if (!selectedSeat) return;
    setSuccessBooked(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
              <Armchair className="h-4 w-4" />
              <span>Interactive Cabin Seat Selector</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {flight.airlineName} {flight.flightNumber} ({flight.origin} ➔ {flight.destination})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cabin Class: <strong className="text-white capitalize">{flight.cabinClass.replace('_', ' ')}</strong> · Select your preferred seating layout.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successBooked ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Seat {selectedSeat?.id} Reserved Successfully!</h3>
            <p className="text-xs text-slate-400">Added to your flight booking preferences.</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-slate-800 border border-slate-700" />
                <span className="text-slate-300">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-sky-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">✓</div>
                <span className="text-sky-300 font-semibold">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-amber-500/20 border border-amber-500/40" />
                <span className="text-amber-300">Extra Legroom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-slate-900 border border-slate-800 opacity-40" />
                <span className="text-slate-500">Occupied</span>
              </div>
            </div>

            {/* Cabin Grid */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col items-center space-y-2 overflow-x-auto">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 pb-2">
                ▲ Front of Aircraft (Cockpit) ▲
              </div>

              <div className="space-y-1.5 w-full max-w-md">
                {Array.from({ length: rows }).map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  const rowSeats = seats.filter(s => s.row === rowNum);
                  return (
                    <div key={rowNum} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-right font-mono text-[11px] text-slate-500">{rowNum}</span>
                      <div className="flex items-center gap-1">
                        {rowSeats.slice(0, Math.ceil(cols.length / 2)).map(seat => {
                          const isSelected = seat.status === 'selected';
                          const isOccupied = seat.status === 'occupied';
                          const isExtra = seat.type === 'extra_legroom';
                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={isOccupied}
                              className={`h-8 w-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                                isOccupied
                                  ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-400'
                                  : isExtra
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer'
                              }`}
                              title={`${seat.id} - ${seat.type.replace('_', ' ')} (${seat.priceInr > 0 ? formatCurrency(seat.priceInr, currency) : 'Free'})`}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                      </div>

                      {/* Aisle Gap */}
                      <div className="w-6" />

                      <div className="flex items-center gap-1">
                        {rowSeats.slice(Math.ceil(cols.length / 2)).map(seat => {
                          const isSelected = seat.status === 'selected';
                          const isOccupied = seat.status === 'occupied';
                          const isExtra = seat.type === 'extra_legroom';
                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={isOccupied}
                              className={`h-8 w-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                                isOccupied
                                  ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-400'
                                  : isExtra
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer'
                              }`}
                              title={`${seat.id} - ${seat.type.replace('_', ' ')} (${seat.priceInr > 0 ? formatCurrency(seat.priceInr, currency) : 'Free'})`}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection Summary & Confirm Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                <div className="text-xs text-slate-400">Selected Seat</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {selectedSeat ? `${selectedSeat.id} (${selectedSeat.type.replace('_', ' ')})` : 'No seat selected'}
                  {selectedSeat && selectedSeat.priceInr > 0 && (
                    <span className="text-sky-400 font-semibold ml-2">
                      (+{formatCurrency(selectedSeat.priceInr, currency)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSeat}
                  disabled={!selectedSeat}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition disabled:opacity-40 disabled:pointer-events-none shadow-md cursor-pointer"
                >
                  Confirm Seat Selection
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
