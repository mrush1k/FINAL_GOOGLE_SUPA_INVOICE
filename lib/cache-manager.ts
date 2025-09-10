'use client'

import { voiceCache } from './voice-cache'

interface CacheStats {
  voiceCommands: {
    total: number
    pending: number
  }
  localStorage: {
    keys: string[]
    totalSize: number
  }
  sessionStorage: {
    keys: string[]
    totalSize: number
  }
}

class CacheManager {
  /**
   * Clear all application caches including:
   * - Voice command cache
   * - LocalStorage data
   * - SessionStorage data
   * - Browser cache (page reload)
   */
  clearAll(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Clear voice cache
        voiceCache.clearAll()
        
        // Clear localStorage (preserve theme settings)
        const themeSettings = localStorage.getItem('theme-settings')
        localStorage.clear()
        if (themeSettings) {
          localStorage.setItem('theme-settings', themeSettings)
        }
        
        // Clear sessionStorage
        sessionStorage.clear()
        
        // Force reload to clear browser cache
        window.location.reload()
        
        resolve()
      } catch (error) {
        console.error('Error clearing caches:', error)
        resolve()
      }
    })
  }

  /**
   * Clear only voice command cache
   */
  clearVoiceCache(): void {
    voiceCache.clearAll()
  }

  /**
   * Clear processed voice commands only
   */
  clearProcessedVoiceCommands(): void {
    voiceCache.clearProcessedCommands()
  }

  /**
   * Clear localStorage (preserve theme settings)
   */
  clearLocalStorage(): void {
    const themeSettings = localStorage.getItem('theme-settings')
    localStorage.clear()
    if (themeSettings) {
      localStorage.setItem('theme-settings', themeSettings)
    }
  }

  /**
   * Clear sessionStorage
   */
  clearSessionStorage(): void {
    sessionStorage.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const voiceStats = voiceCache.getCommandCount()
    
    // Get localStorage info
    const localStorageKeys: string[] = []
    let localStorageSize = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        localStorageKeys.push(key)
        const value = localStorage.getItem(key)
        if (value) {
          localStorageSize += new Blob([value]).size
        }
      }
    }
    
    // Get sessionStorage info
    const sessionStorageKeys: string[] = []
    let sessionStorageSize = 0
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        sessionStorageKeys.push(key)
        const value = sessionStorage.getItem(key)
        if (value) {
          sessionStorageSize += new Blob([value]).size
        }
      }
    }
    
    return {
      voiceCommands: voiceStats,
      localStorage: {
        keys: localStorageKeys,
        totalSize: localStorageSize
      },
      sessionStorage: {
        keys: sessionStorageKeys,
        totalSize: sessionStorageSize
      }
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const cacheManager = new CacheManager()

// Utility functions for common cache operations
export const clearAllCaches = () => cacheManager.clearAll()
export const clearVoiceCache = () => cacheManager.clearVoiceCache()
export const getCacheStats = () => cacheManager.getCacheStats()