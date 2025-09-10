export interface CountrySettings {
  country: string
  currency: string
  taxLabel: string
  businessIdLabel: string
  locale: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY'
}

export const COUNTRY_SETTINGS: Record<string, CountrySettings> = {
  'AU': {
    country: 'AU',
    currency: 'AUD',
    taxLabel: 'GST',
    businessIdLabel: 'ABN',
    locale: 'en-AU',
    dateFormat: 'DD/MM/YYYY'
  },
  'US': {
    country: 'US',
    currency: 'USD',
    taxLabel: 'Tax',
    businessIdLabel: 'EIN',
    locale: 'en-US',
    dateFormat: 'MM/DD/YYYY'
  },
  'GB': {
    country: 'GB',
    currency: 'GBP',
    taxLabel: 'VAT',
    businessIdLabel: 'UTR',
    locale: 'en-GB',
    dateFormat: 'DD/MM/YYYY'
  },
  'CA': {
    country: 'CA',
    currency: 'CAD',
    taxLabel: 'GST/HST',
    businessIdLabel: 'BN',
    locale: 'en-CA',
    dateFormat: 'DD/MM/YYYY'
  },
  'NZ': {
    country: 'NZ',
    currency: 'NZD',
    taxLabel: 'GST',
    businessIdLabel: 'NZBN',
    locale: 'en-NZ',
    dateFormat: 'DD/MM/YYYY'
  },
  'IE': {
    country: 'IE',
    currency: 'EUR',
    taxLabel: 'VAT',
    businessIdLabel: 'VAT Number',
    locale: 'en-IE',
    dateFormat: 'DD/MM/YYYY'
  },
  'DE': {
    country: 'DE',
    currency: 'EUR',
    taxLabel: 'MwSt.',
    businessIdLabel: 'Steuernummer',
    locale: 'de-DE',
    dateFormat: 'DD/MM/YYYY'
  },
  'FR': {
    country: 'FR',
    currency: 'EUR',
    taxLabel: 'TVA',
    businessIdLabel: 'SIRET',
    locale: 'fr-FR',
    dateFormat: 'DD/MM/YYYY'
  },
  'IN': {
    country: 'IN',
    currency: 'INR',
    taxLabel: 'GST',
    businessIdLabel: 'GSTIN',
    locale: 'en-IN',
    dateFormat: 'DD/MM/YYYY'
  },
  'SG': {
    country: 'SG',
    currency: 'SGD',
    taxLabel: 'GST',
    businessIdLabel: 'UEN',
    locale: 'en-SG',
    dateFormat: 'DD/MM/YYYY'
  }
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'AUD': 'A$',
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'CAD': 'C$',
  'NZD': 'NZ$',
  'INR': '₹',
  'SGD': 'S$'
}

export const COUNTRY_NAMES: Record<string, string> = {
  'AU': 'Australia',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'NZ': 'New Zealand',
  'IE': 'Ireland',
  'DE': 'Germany',
  'FR': 'France',
  'IN': 'India',
  'SG': 'Singapore'
}

export async function detectUserCountry(): Promise<string | null> {
  try {
    // Try multiple IP geolocation services
    const services = [
      'https://ipapi.co/country_code/',
      'https://ip.nf/me.json',
      'https://ipinfo.io/json'
    ]

    for (const service of services) {
      try {
        const response = await fetch(service, { timeout: 5000 } as RequestInit)
        if (response.ok) {
          if (service.includes('ipapi.co')) {
            const countryCode = await response.text()
            return countryCode.trim().toUpperCase()
          } else if (service.includes('ip.nf')) {
            const data = await response.json()
            return data.ip?.country_code?.toUpperCase() || null
          } else if (service.includes('ipinfo.io')) {
            const data = await response.json()
            return data.country?.toUpperCase() || null
          }
        }
      } catch (error) {
        console.warn(`Failed to detect country from ${service}:`, error)
        continue
      }
    }

    // Fallback: use browser locale
    const browserCountry = getBrowserCountry()
    if (browserCountry) {
      return browserCountry
    }

  } catch (error) {
    console.warn('Country detection failed:', error)
  }

  // Ultimate fallback
  return 'AU'
}

export function getBrowserCountry(): string | null {
  try {
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || navigator.languages?.[0]
      if (locale) {
        const countryMatch = locale.match(/-([A-Z]{2})$/)
        return countryMatch ? countryMatch[1] : null
      }
    }
  } catch (error) {
    console.warn('Browser country detection failed:', error)
  }
  return null
}

export function getSettingsForCountry(countryCode: string): CountrySettings {
  return COUNTRY_SETTINGS[countryCode.toUpperCase()] || COUNTRY_SETTINGS['AU']
}

export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  } catch (error) {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode
    return `${symbol}${amount.toFixed(2)}`
  }
}