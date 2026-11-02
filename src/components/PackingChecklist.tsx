/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TripItinerary, PackingChecklistData, PackingItem } from '../types';
import { fetchAiPackingChecklist, generateLocalChecklist } from '../services/packingService';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sun,
  CloudSun,
  Thermometer,
  ShieldAlert,
  Shirt,
  Smartphone,
  FileText,
  HeartPulse,
  Compass,
  Filter,
  CheckCheck
} from 'lucide-react';

interface PackingChecklistProps {
  activeTrip: TripItinerary;
  onUpdateTripChecklist?: (tripId: string, checklist: PackingChecklistData) => void;
}

const CATEGORY_META = {
  clothing: { label: 'Clothing & Apparel', icon: Shirt, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  toiletries: { label: 'Toiletries & Liquids', icon: HeartPulse, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  electronics: { label: 'Electronics & Power', icon: Smartphone, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  documents: { label: 'Documents & Forex', icon: FileText, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  essentials: { label: 'Travel Essentials', icon: CheckCheck, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  destination_specific: { label: 'Destination Gear', icon: Compass, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
};

export const PackingChecklist: React.FC<PackingChecklistProps> = ({
  activeTrip,
  onUpdateTripChecklist
}) => {
  // Destination and duration estimation
  const destinationCity = useMemo(() => {
    if (activeTrip.legs.length > 0) {
      return activeTrip.legs[0].destinationCity || activeTrip.legs[0].destination;
    }
    return 'Dubai';
  }, [activeTrip]);

  const durationDays = useMemo(() => {
    if (activeTrip.startDate && activeTrip.endDate) {
      const d1 = new Date(activeTrip.startDate).getTime();
      const d2 = new Date(activeTrip.endDate).getTime();
      const days = Math.round((d2 - d1) / (1000 * 3600 * 24));
      return Math.max(1, days);
    }
    return 7;
  }, [activeTrip.startDate, activeTrip.endDate]);

  // Checklist state initialized from activeTrip or fallback
  const [checklist, setChecklist] = useState<PackingChecklistData>(() => {
    if (activeTrip.packingChecklist && activeTrip.packingChecklist.items.length > 0) {
      return activeTrip.packingChecklist;
    }
    return generateLocalChecklist(destinationCity, durationDays, 'leisure');
  });

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [showOnlyEssentials, setShowOnlyEssentials] = useState(false);
  const [tripStyle, setTripStyle] = useState<'leisure' | 'business' | 'adventure' | 'beach' | 'winter' | 'cultural'>('leisure');
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  // New item input
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PackingItem['category']>('clothing');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemEssential, setNewItemEssential] = useState<boolean>(false);

  // Synchronize when activeTrip changes
  useEffect(() => {
    if (activeTrip.packingChecklist && activeTrip.packingChecklist.items.length > 0) {
      setChecklist(activeTrip.packingChecklist);
    } else {
      const initial = generateLocalChecklist(destinationCity, durationDays, tripStyle);
      setChecklist(initial);
      if (onUpdateTripChecklist) {
        onUpdateTripChecklist(activeTrip.id, initial);
      }
    }
  }, [activeTrip.id, destinationCity, durationDays]);

  // Persist helper
  const updateAndPersistChecklist = (updated: PackingChecklistData) => {
    setChecklist(updated);
    if (onUpdateTripChecklist) {
      onUpdateTripChecklist(activeTrip.id, updated);
    }
  };

  // Toggle item packed status
  const handleTogglePacked = (itemId: string) => {
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    updateAndPersistChecklist({ ...checklist, items: updatedItems });
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = checklist.items.filter(item => item.id !== itemId);
    updateAndPersistChecklist({ ...checklist, items: updatedItems });
  };

  // Add custom item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PackingItem = {
      id: `custom_${Date.now()}`,
      category: newItemCategory,
      name: newItemName.trim(),
      quantity: newItemQuantity || 1,
      packed: false,
      isEssential: newItemEssential
    };

    updateAndPersistChecklist({
      ...checklist,
      items: [newItem, ...checklist.items]
    });

    setNewItemName('');
    setIsAddingItem(false);
  };

  // AI Generation Trigger
  const handleGenerateAiChecklist = async () => {
    setIsLoadingAi(true);
    try {
      const generated = await fetchAiPackingChecklist({
        destinationCity,
        startDate: activeTrip.startDate,
        endDate: activeTrip.endDate,
        durationDays,
        tripType: tripStyle,
        cabinClass: activeTrip.legs[0]?.cabinClass || 'economy'
      });
      updateAndPersistChecklist(generated);
    } catch (err) {
      console.error('Failed to generate checklist:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Copy checklist text
  const handleCopyChecklist = () => {
    let text = `🎒 PACKING CHECKLIST: ${activeTrip.title} (${destinationCity})\n`;
    text += `Climate: ${checklist.destinationClimate}\n`;
    text += `Duration: ${durationDays} days | Style: ${tripStyle}\n\n`;

    const categories = Array.from(new Set(checklist.items.map(i => i.category)));
    categories.forEach(cat => {
      const catMeta = CATEGORY_META[cat] || { label: cat };
      text += `--- ${catMeta.label.toUpperCase()} ---\n`;
      checklist.items
        .filter(i => i.category === cat)
        .forEach(item => {
          text += `[${item.packed ? 'X' : ' '}] ${item.name} ${item.quantity ? `(x${item.quantity})` : ''} ${item.isEssential ? '⭐' : ''}\n`;
          if (item.notes) text += `    Note: ${item.notes}\n`;
        });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2500);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return checklist.items.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (showOnlyPending && item.packed) return false;
      if (showOnlyEssentials && !item.isEssential) return false;
      return true;
    });
  }, [checklist.items, selectedCategory, showOnlyPending, showOnlyEssentials]);

  // Statistics
  const totalItems = checklist.items.length;
  const packedItems = checklist.items.filter(i => i.packed).length;
  const progressPercent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Destination Climate & AI Weather Intelligence Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="h-3 w-3" /> Gemini AI Powered
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {destinationCity} · {durationDays} Days / {Math.max(0, durationDays - 1)} Nights
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Destination Climate & Packing Checklist
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Customized packing recommendations calculated from destination meteorological patterns, seasonal climate, baggage limits, and your {durationDays}-day itinerary.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleCopyChecklist}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer"
            >
              {copiedChecklist ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
              <span>{copiedChecklist ? 'Checklist Copied' : 'Share Checklist'}</span>
            </button>

            <button
              onClick={handleGenerateAiChecklist}
              disabled={isLoadingAi}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingAi ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Climate...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Regenerate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Climate Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Destination Climate
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {checklist.destinationClimate}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Thermometer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Seasonal Weather Conditions
              </div>
              <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {checklist.weatherSummary}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Recommended Attire & Rules
              </div>
              <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {checklist.recommendedDressCode}
              </div>
            </div>
          </div>
        </div>

        {/* Style Selector & Progress Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Trip Vibe:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['leisure', 'business', 'adventure', 'beach', 'winter', 'cultural'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setTripStyle(style)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                    tripStyle === style
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Packed Progress</span>
                <span className="font-mono font-bold text-emerald-400">
                  {packedItems} / {totalItems} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Checklist Controls & Content */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl space-y-6">
        {/* Category Filter Pills & Toggle Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Items ({totalItems})
            </button>
            {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
              const count = checklist.items.filter(i => i.category === catKey).length;
              if (count === 0) return null;
              const Icon = meta.icon;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === catKey
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                showOnlyPending
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Only
            </button>

            <button
              onClick={() => setShowOnlyEssentials(!showOnlyEssentials)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                showOnlyEssentials
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Essentials Only
            </button>

            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Item</span>
            </button>
          </div>
        </div>

        {/* Add Custom Item Inline Form */}
        {isAddingItem && (
          <form onSubmit={handleAddCustomItem} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white">Add Item to Checklist</div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                placeholder="Item name (e.g. Scuba diving mask, power strip)..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="sm:col-span-6 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value as any)}
                className="sm:col-span-3 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 capitalize"
              >
                {Object.keys(CATEGORY_META).map(k => (
                  <option key={k} value={k}>{(CATEGORY_META as any)[k].label}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="20"
                value={newItemQuantity}
                onChange={e => setNewItemQuantity(Number(e.target.value))}
                className="sm:col-span-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-sky-500"
                title="Quantity"
              />
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Item Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map(item => {
            const meta = CATEGORY_META[item.category] || { label: item.category, color: 'text-slate-400 bg-slate-800 border-slate-700' };
            return (
              <div
                key={item.id}
                onClick={() => handleTogglePacked(item.id)}
                className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 cursor-pointer group ${
                  item.packed
                    ? 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 shrink-0">
                    {item.packed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${item.packed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {item.name}
                      </span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                          x{item.quantity}
                        </span>
                      )}
                      {item.isEssential && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                          ESSENTIAL
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className={`text-[11px] mt-0.5 ${item.packed ? 'text-slate-600' : 'text-slate-400'}`}>
                        {item.notes}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  className="p-1 text-slate-600 hover:text-rose-400 rounded transition opacity-0 group-hover:opacity-100"
                  title="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-10 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No items matching your active filter.
          </div>
        )}
      </div>
    </div>
  );
};
