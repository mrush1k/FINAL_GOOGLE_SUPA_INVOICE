import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amounts consistently throughout the app
 * Uses the user's preferred currency from their profile
 */
export function formatCurrency(amount: number, currency?: string): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrency(0, currency);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency?: string): string {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'AUD': 'A$',
    'NZD': 'NZ$',
    'CAD': 'C$',
    'GBP': '£',
    'EUR': '€',
  };
  
  return currencySymbols[currency || 'USD'] || '$';
}
