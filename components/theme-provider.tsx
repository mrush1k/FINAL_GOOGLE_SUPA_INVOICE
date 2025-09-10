"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  primaryColor: string
  colorScheme: 'light' | 'dark' | 'system'
  setPrimaryColor: (color: string) => void
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void
  applyTheme: (color: string) => void
  loadThemePreferences: () => Promise<void>
  saveThemePreferences: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [primaryColor, setPrimaryColor] = useState('#0066CC')
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'system'>('light')
  const [isOnline, setIsOnline] = useState(true)
  const [pendingChanges, setPendingChanges] = useState(false)

  // Convert hex color to HSL for CSS variables
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
        default: h = 0
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  // Apply theme color to CSS variables
  const applyTheme = (color: string) => {
    const { h, s, l } = hexToHsl(color)
    
    // Update CSS custom properties
    document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`)
    document.documentElement.style.setProperty('--ring', `${h} ${s}% ${l}%`)
    document.documentElement.style.setProperty('--theme-primary', `${h} ${s}% ${l}%`)
    
    // Adjust foreground color based on lightness
    const foregroundLightness = l > 50 ? '0%' : '98%'
    document.documentElement.style.setProperty('--primary-foreground', `0 0% ${foregroundLightness}`)
    document.documentElement.style.setProperty('--theme-primary-foreground', `0 0% ${foregroundLightness}`)
  }

  // Apply color scheme (light/dark mode)
  const applyColorScheme = (scheme: 'light' | 'dark' | 'system') => {
    const html = document.documentElement
    
    if (scheme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    } else if (scheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Save theme preferences to localStorage
  const saveToLocalStorage = (color: string, scheme: 'light' | 'dark' | 'system') => {
    try {
      const themeData = {
        primaryColor: color,
        colorScheme: scheme,
        timestamp: Date.now()
      }
      localStorage.setItem('theme-preferences', JSON.stringify(themeData))
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
  }

  // Load theme preferences from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('theme-preferences')
      if (stored) {
        const themeData = JSON.parse(stored)
        return {
          primaryColor: themeData.primaryColor || '#0066CC',
          colorScheme: themeData.colorScheme || 'light'
        }
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
    }
    return null
  }

  // Sync pending changes when coming back online
  const syncPendingChanges = async () => {
    if (!pendingChanges || !isOnline) return

    try {
      await saveThemePreferences()
      setPendingChanges(false)
    } catch (error) {
      console.error('Error syncing pending theme changes:', error)
    }
  }

  // Load theme preferences from API
  const loadThemePreferences = async () => {
    // Try to load from localStorage first if offline
    if (!isOnline) {
      const localTheme = loadFromLocalStorage()
      if (localTheme) {
        setPrimaryColor(localTheme.primaryColor)
        setColorScheme(localTheme.colorScheme)
        applyTheme(localTheme.primaryColor)
        applyColorScheme(localTheme.colorScheme)
        return
      }
    }

    try {
      const response = await fetch('/api/users/theme', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const theme = await response.json()
        const color = theme.primaryColor || '#0066CC'
        const scheme = theme.colorScheme || 'light'
        
        setPrimaryColor(color)
        setColorScheme(scheme)
        
        // Apply theme immediately
        applyTheme(color)
        applyColorScheme(scheme)
        
        // Save to localStorage for offline use
        saveToLocalStorage(color, scheme)
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error)
      
      // Fallback to localStorage if API fails
      const localTheme = loadFromLocalStorage()
      if (localTheme) {
        setPrimaryColor(localTheme.primaryColor)
        setColorScheme(localTheme.colorScheme)
        applyTheme(localTheme.primaryColor)
        applyColorScheme(localTheme.colorScheme)
      }
    }
  }

  // Save theme preferences to API
  const saveThemePreferences = async () => {
    // Always save to localStorage first
    saveToLocalStorage(primaryColor, colorScheme)

    // If offline, mark as pending and return
    if (!isOnline) {
      setPendingChanges(true)
      return
    }

    try {
      const response = await fetch('/api/users/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          primaryColor,
          colorScheme
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save theme preferences')
      }
      
      // Clear pending changes if save was successful
      setPendingChanges(false)
    } catch (error) {
      console.error('Error saving theme preferences:', error)
      // Mark as pending if save failed (might be offline)
      setPendingChanges(true)
      throw error
    }
  }

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingChanges()
    }
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load theme on component mount
  useEffect(() => {
    // Load theme from localStorage or use defaults
    const localTheme = loadFromLocalStorage()
    if (localTheme) {
      setPrimaryColor(localTheme.primaryColor)
      setColorScheme(localTheme.colorScheme)
      applyTheme(localTheme.primaryColor)
      applyColorScheme(localTheme.colorScheme)
    } else {
      // Apply default theme
      applyTheme('#0066CC')
      applyColorScheme('light')
    }
  }, [])

  // Listen for system color scheme changes
  useEffect(() => {
    if (colorScheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyColorScheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [colorScheme])

  // Apply color scheme when it changes
  useEffect(() => {
    applyColorScheme(colorScheme)
  }, [colorScheme])

  // Sync pending changes when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges) {
      syncPendingChanges()
    }
  }, [isOnline, pendingChanges])

  const value: ThemeContextType = {
    primaryColor,
    colorScheme,
    setPrimaryColor: (color: string) => {
      setPrimaryColor(color)
      applyTheme(color)
      // Save to localStorage immediately for offline support
      saveToLocalStorage(color, colorScheme)
    },
    setColorScheme: (scheme: 'light' | 'dark' | 'system') => {
      setColorScheme(scheme)
      applyColorScheme(scheme)
      // Save to localStorage immediately for offline support
      saveToLocalStorage(primaryColor, scheme)
    },
    applyTheme,
    loadThemePreferences,
    saveThemePreferences
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}