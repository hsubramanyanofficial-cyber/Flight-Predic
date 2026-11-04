import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCIES, SupportedCurrency, formatCurrency, convertFromInr } from '../utils/currency';
import {
  Globe,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Calculator,
  Check
} from 'lucide-react';

interface CurrencyConverterWidgetProps {
  lowestFareInr?: number;
  expectedFareInr?: number;
}

export const CurrencyConverterWidget: React.FC<CurrencyConverterWidgetProps> = ({
  lowestFareInr,
  expectedFareInr
}) => {
  const { currency, setCurrency } = useApp();

  const [inputInr, setInputInr] = useState<number>(() => lowestFareInr || expectedFareInr || 5000);
  const [ratesData, setRatesData] = useState<{
    timestamp: string;
    inrPerUnit: Record<string, number>;
    rates: Record<string, number>;
  } | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync default input when flight fare is loaded
  useEffect(() => {
    if (lowestFareInr && lowestFareInr > 0) {
      setInputInr(lowestFareInr);
    } else if (expectedFareInr && expectedFareInr > 0) {
      setInputInr(expectedFareInr);
    }
  }, [lowestFareInr, expectedFareInr]);

  const fetchRates = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/currency/rates');
      const data = await res.json();
      if (data.success) {
        setRatesData({
          timestamp: data.timestamp,
          inrPerUnit: data.inrPerUnit,
          rates: data.rates
        });
      }
    } catch (err) {
      console.error('Error fetching real-time FX rates:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const activeConfig = CURRENCIES[currency] || CURRENCIES.INR;
  const inrPerUnit = ratesData?.inrPerUnit[currency] || (currency === 'INR' ? 1 : Math.round((1 / activeConfig.rateFromInr) * 100) / 100);
  const convertedValue = convertFromInr(inputInr, currency);

  const popularCurrencies: SupportedCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden transition-all duration-200">
      
      {/* Top Main Bar: Preferred Currency Selector & Live Rate Ticker */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Tool Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Currency Conversion
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Market Rates
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Current display currency: <strong className="text-white">{activeConfig.name} ({activeConfig.code})</strong>
              {currency !== 'INR' && (
                <span className="text-sky-400 font-mono ml-2">
                  · 1 {currency} = ₹{inrPerUnit} INR
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick Currency Pills + Refresh + Calculator Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {popularCurrencies.map(code => {
              const isSelected = currency === code;
              return (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={CURRENCIES[code]?.name}
                >
                  {CURRENCIES[code]?.symbol.trim()} {code}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchRates}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Refresh Real-Time Exchange Rates"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isExpanded
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-sky-400" />
            <span>FX Calculator</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Interactive FX Calculator Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Input Box in INR */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Base Amount in Indian Rupees (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={inputInr}
                  onChange={e => setInputInr(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono font-bold text-sm focus:outline-none focus:border-sky-500"
                  placeholder="Enter INR airfare amount..."
                />
              </div>
              
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <span>Presets:</span>
                {lowestFareInr && lowestFareInr > 0 && (
                  <button
                    onClick={() => setInputInr(lowestFareInr)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono transition"
                  >
                    Lowest Offer (₹{lowestFareInr.toLocaleString('en-IN')})
                  </button>
                )}
                {expectedFareInr && expectedFareInr > 0 && (
                  <button
                    onClick={() => setInputInr(expectedFareInr)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono transition"
                  >
                    Expected Fare (₹{expectedFareInr.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>

            {/* Conversion Direction Icon */}
            <div className="md:col-span-2 flex items-center justify-center pt-2 md:pt-4">
              <div className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-sky-400 shadow-inner">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>

            {/* Output Box in Selected Currency */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Converted to Preferred Currency ({currency})
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                  className="bg-slate-900 border border-slate-700 rounded text-[11px] text-white px-2 py-0.5 focus:outline-none font-mono font-medium"
                >
                  {Object.values(CURRENCIES).map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()}) - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                  {formatCurrency(inputInr, currency)}
                </span>
                <span className="text-xs text-sky-300 font-mono font-semibold">
                  {activeConfig.name}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                <span>Interbank Rate: 1 INR = {activeConfig.rateFromInr} {currency}</span>
                <span>All flight prices update in real time</span>
              </div>
            </div>

          </div>

          {/* Quick Cross-Currency Conversion Grid for this fare */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Instant Global Price Comparison for ₹{inputInr.toLocaleString('en-IN')}:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {(['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'] as SupportedCurrency[]).map(c => {
                const isCurrent = currency === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`p-2 rounded-xl border text-center transition ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-500/15 text-white'
                        : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-mono">{c}</div>
                    <div className="text-xs font-bold font-mono text-sky-400 mt-0.5">
                      {formatCurrency(inputInr, c)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
