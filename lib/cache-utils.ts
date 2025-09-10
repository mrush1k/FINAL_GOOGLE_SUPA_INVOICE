// Simple in-memory cache for API responses
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()
  private maxSize = 100 // Maximum number of cached items
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  set(key: string, data: any, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const expires = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expires })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Delete all cache entries matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  dashboardData: (userId: string) => `dashboard:${userId}`,
  invoiceList: (userId: string, page: number) => `invoices:${userId}:${page}`,
  customerList: (userId: string) => `customers:${userId}`,
  invoice: (id: string) => `invoice:${id}`,
  customer: (id: string) => `customer:${id}`,
  userTheme: (userId: string) => `theme:${userId}`,
}

// Cache invalidation helpers
export const invalidateCache = {
  userDashboard: (userId: string) => {
    cache.invalidatePattern(`dashboard:${userId}`)
    cache.invalidatePattern(`invoices:${userId}:`)
  },
  
  userInvoices: (userId: string) => {
    cache.invalidatePattern(`invoices:${userId}:`)
    cache.delete(cacheKeys.dashboardData(userId))
  },

  userCustomers: (userId: string) => {
    cache.delete(cacheKeys.customerList(userId))
  },

  invoice: (invoiceId: string, userId: string) => {
    cache.delete(cacheKeys.invoice(invoiceId))
    invalidateCache.userDashboard(userId)
  },

  customer: (customerId: string, userId: string) => {
    cache.delete(cacheKeys.customer(customerId))
    cache.delete(cacheKeys.customerList(userId))
  }
}

// Wrapper function for cached API calls
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()
  
  // Cache the result
  cache.set(key, data, ttl)
  
  return data
}