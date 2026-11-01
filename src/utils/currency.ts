export type SupportedCurrency =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | 'JPY';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  rateFromInr: number; // multiply INR by this rate
  decimals: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromInr: 1, decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateFromInr: 0.0116, decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateFromInr: 0.0108, decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateFromInr: 0.0091, decimals: 0 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateFromInr: 0.0426, decimals: 0 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateFromInr: 0.0156, decimals: 0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateFromInr: 0.0182, decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateFromInr: 0.0163, decimals: 0 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateFromInr: 1.81, decimals: 0 },
};

export function convertFromInr(amountInInr: number, currency: SupportedCurrency = 'INR'): number {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const converted = amountInInr * config.rateFromInr;
  return config.decimals === 0 ? Math.round(converted) : Math.round(converted * 100) / 100;
}

export function formatCurrency(
  amountInInr: number,
  currency: SupportedCurrency = 'INR',
  options?: { compact?: boolean; hideSymbol?: boolean }
): string {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const value = convertFromInr(amountInInr, currency);

  if (options?.compact && value >= 1000) {
    if (value >= 1000000) {
      return `${options.hideSymbol ? '' : config.symbol}${(value / 1000000).toFixed(1)}M`;
    }
    return `${options.hideSymbol ? '' : config.symbol}${(value / 1000).toFixed(0)}k`;
  }

  // Locale-based number formatting
  let locale = 'en-US';
  if (currency === 'INR') locale = 'en-IN';
  else if (currency === 'EUR') locale = 'de-DE';
  else if (currency === 'GBP') locale = 'en-GB';
  else if (currency === 'JPY') locale = 'ja-JP';

  const formattedNum = value.toLocaleString(locale, {
    maximumFractionDigits: config.decimals,
    minimumFractionDigits: config.decimals
  });

  return options?.hideSymbol ? formattedNum : `${config.symbol}${formattedNum}`;
}
