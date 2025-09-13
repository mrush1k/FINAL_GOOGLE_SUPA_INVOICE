"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Save, User, Building, Bell, Lock, Trash2, Download, MessageCircle, Bot, Palette, HardDrive, RefreshCw, Wand2, DollarSign, HelpCircle, BookOpen, Clock, FileText } from 'lucide-react'
import { User as UserType } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { ColorPicker } from '@/components/color-picker'
import { useTheme } from '@/components/theme-provider'
import { cacheManager, getCacheStats } from '@/lib/cache-manager'
import { TutorialPopup } from '@/components/tutorial-popup'
import { generateTutorialForUser, getUserTutorial } from '@/lib/ai-tutorial'
import { TutorialLibrary } from '@/components/tutorial-library'

const countries = [
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'CA', name: 'Canada', currency: 'CAD' }
]

const currencies = ['USD', 'AUD', 'NZD', 'GBP', 'CAD', 'EUR']

const workTypes = [
  'Trades & Construction',
  'Creative & Digital', 
  'Freelance & Consulting',
  'Landscaping & Outdoor Work',
  'Retail & Sales Services',
  'Solo Operator / Small Business',
  'Other'
]

export default function SettingsPage() {
  const { userProfile: user, updateUser } = useAuth()
  const { toast } = useToast()
  const { primaryColor, colorScheme, setPrimaryColor, setColorScheme, saveThemePreferences } = useTheme()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    country: '',
    currency: '',
    workType: '',
    customWorkType: '',
    businessName: '',
    businessRegNumber: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    dateFormat: '',
    logoUrl: ''
  })

  // Company settings state
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyPostalCode: '',
    companyWebsite: '',
    logoUrl: '',
    invoiceTerms: '',
    invoiceNotes: '',
    emailSignature: ''
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    overdueReminders: true,
    paymentNotifications: true,
    invoiceUpdates: true
  })

  // Chatbot interactions state
  const [chatbotInteractions, setChatbotInteractions] = useState<any[]>([])
  const [loadingInteractions, setLoadingInteractions] = useState(false)

  // Cache management state
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [loadingCache, setLoadingCache] = useState(false)

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialCompleted, setTutorialCompleted] = useState(false)
  const [loadingTutorial, setLoadingTutorial] = useState(false)

  // Tax & Currency settings state
  const [taxCurrencyData, setTaxCurrencyData] = useState({
    country: '',
    currency: '',
    defaultTaxRate: ''
  })
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false)
  const [oldCurrency, setOldCurrency] = useState('')

  // Invoice appearance settings state
  const [invoiceAppearanceData, setInvoiceAppearanceData] = useState({
    invoiceTemplate: 'default',
    invoiceColorScheme: 'blue',
    alwaysCcSelf: false,
    defaultPaymentInstructions: ''
  })

  // Theme preferences are now managed by ThemeProvider

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        country: user.country || '',
        currency: user.currency || '',
        workType: user.workType || '',
        customWorkType: user.customWorkType || '',
        businessName: user.businessName || '',
        businessRegNumber: user.businessRegNumber || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        postalCode: user.postalCode || '',
        website: user.website || '',
        dateFormat: user.dateFormat || 'DD/MM/YYYY',
        logoUrl: user.logoUrl || ''
      })

      // Initialize tax & currency settings
      setTaxCurrencyData({
        country: user.country || '',
        currency: user.currency || '',
        defaultTaxRate: user.defaultTaxRate?.toString() || ''
      })

      // Initialize invoice appearance settings
      setInvoiceAppearanceData({
        invoiceTemplate: user.invoiceTemplate || 'default',
        invoiceColorScheme: user.invoiceColorScheme || 'blue',
        alwaysCcSelf: user.alwaysCcSelf || false,
        defaultPaymentInstructions: user.defaultPaymentInstructions || ''
      })
      
      // Load company and notification settings from user profile or API
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const settings = await response.json()
        if (settings.company) setCompanyData(settings.company)
        if (settings.notifications) setNotificationSettings(settings.notifications)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleProfileSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully."
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(companyData)
      })

      if (response.ok) {
        toast({
          title: "Company Settings Updated",
          description: "Your company settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update company settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationSettings)
      })

      if (response.ok) {
        toast({
          title: "Notification Settings Updated",
          description: "Your notification preferences have been updated successfully."
        })
      } else {
        throw new Error('Failed to update notification settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeSave = async () => {
    setLoading(true)
    try {
      await saveThemePreferences()
      toast({
        title: "Theme Updated",
        description: "Your theme preferences have been saved successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update theme preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaxCurrencySave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          country: taxCurrencyData.country,
          currency: taxCurrencyData.currency,
          defaultTaxRate: taxCurrencyData.defaultTaxRate ? parseFloat(taxCurrencyData.defaultTaxRate) : null
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        toast({
          title: "Tax & Currency Settings Updated",
          description: "Your tax and currency settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update tax and currency settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tax and currency settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceAppearanceSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceTemplate: invoiceAppearanceData.invoiceTemplate,
          invoiceColorScheme: invoiceAppearanceData.invoiceColorScheme,
          alwaysCcSelf: invoiceAppearanceData.alwaysCcSelf,
          defaultPaymentInstructions: invoiceAppearanceData.defaultPaymentInstructions || null
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        toast({
          title: "Invoice Appearance Updated",
          description: "Your invoice appearance settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update invoice appearance settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice appearance settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (value: string) => {
    const country = countries.find(c => c.code === value)
    setProfileData(prev => ({
      ...prev,
      country: value,
      currency: country?.currency || prev.currency
    }))
  }

  const handleTaxCurrencyCountryChange = (value: string) => {
    const country = countries.find(c => c.code === value)
    setTaxCurrencyData(prev => ({
      ...prev,
      country: value,
      currency: country?.currency || prev.currency
    }))
  }

  const handleCurrencyChange = (newCurrency: string) => {
    if (taxCurrencyData.currency && taxCurrencyData.currency !== newCurrency) {
      setOldCurrency(taxCurrencyData.currency)
      setShowCurrencyPrompt(true)
    }
    setTaxCurrencyData(prev => ({
      ...prev,
      currency: newCurrency
    }))
  }

  const handleUpdateExistingInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/update-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newCurrency: taxCurrencyData.currency,
          oldCurrency: oldCurrency
        })
      })

      if (response.ok) {
        toast({
          title: "Currency Updated",
          description: "All existing draft invoices and estimates have been updated to the new currency."
        })
      } else {
        throw new Error('Failed to update existing invoices')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update existing invoices. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowCurrencyPrompt(false)
      setOldCurrency('')
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/users/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-pro-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Data Exported",
          description: "Your data has been exported successfully."
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const loadChatbotHistory = async () => {
    if (!user?.id) return
    
    setLoadingInteractions(true)
    try {
      const response = await fetch(`/api/chatbot/log?userId=${user.id}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setChatbotInteractions(data.interactions || [])
      }
    } catch (error) {
      console.error('Error loading chatbot history:', error)
    } finally {
      setLoadingInteractions(false)
    }
  }

  const loadCacheStats = () => {
    setLoadingCache(true)
    try {
      const stats = getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error loading cache stats:', error)
    } finally {
      setLoadingCache(false)
    }
  }

  const handleClearAllCache = async () => {
    setLoadingCache(true)
    try {
      await cacheManager.clearAll()
      toast({
        title: "Cache Cleared",
        description: "All application cache has been cleared successfully. The page will reload to complete the process."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingCache(false)
    }
  }

  const handleClearVoiceCache = () => {
    try {
      cacheManager.clearVoiceCache()
      loadCacheStats()
      toast({
        title: "Voice Cache Cleared",
        description: "Voice command cache has been cleared successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear voice cache. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleClearLocalStorage = () => {
    try {
      cacheManager.clearLocalStorage()
      loadCacheStats()
      toast({
        title: "Local Storage Cleared",
        description: "Local storage has been cleared (theme settings preserved)."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear local storage. Please try again.",
        variant: "destructive"
      })
    }
  }

  const checkTutorialStatus = async () => {
    if (!user?.id) return
    
    setLoadingTutorial(true)
    try {
      const tutorial = generateTutorialForUser(user)
      if (tutorial) {
        const progress = await getUserTutorial(tutorial.id)
        setTutorialCompleted(progress?.completed || false)
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error)
    } finally {
      setLoadingTutorial(false)
    }
  }

  const handleStartTutorial = () => {
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    setTutorialCompleted(true)
    toast({
      title: "Tutorial Completed!",
      description: "You can always replay your AI tutorial from this page."
    })
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'branding', label: 'Branding', icon: Wand2 },
    { id: 'invoice-appearance', label: 'Invoice Appearance', icon: FileText },
    { id: 'tax-currency', label: 'Tax & Currency', icon: DollarSign },
    { id: 'theme', label: 'Theme Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help-support', label: 'Help & Support', icon: HelpCircle },
    { id: 'chatbot', label: 'Chatbot History', icon: MessageCircle },
    { id: 'cache', label: 'Cache Management', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === 'chatbot') {
                    loadChatbotHistory()
                  } else if (tab.id === 'cache') {
                    loadCacheStats()
                  } else if (tab.id === 'help-support') {
                    checkTutorialStatus()
                  }
                }}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={profileData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={profileData.currency} onValueChange={(value) => 
                    setProfileData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workType">Work Type</Label>
                  <Select value={profileData.workType} onValueChange={(value) => 
                    setProfileData(prev => ({ ...prev, workType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              
              {profileData.workType === 'Other' && (
                <div>
                  <Label htmlFor="customWorkType">Custom Work Type</Label>
                  <Input
                    id="customWorkType"
                    placeholder="Describe your work type"
                    value={profileData.customWorkType}
                    onChange={(e) => setProfileData(prev => ({ ...prev, customWorkType: e.target.value }))}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessRegNumber">Business Registration Number</Label>
                    <Input
                      id="businessRegNumber"
                      value={profileData.businessRegNumber}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessRegNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={profileData.dateFormat} onValueChange={(value) => 
                      setProfileData(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address</h3>
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={profileData.postalCode}
                      onChange={(e) => setProfileData(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <p className="text-sm text-gray-600">These details will appear on your invoices and receipts</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyData.companyEmail}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    value={companyData.companyPhone}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    value={companyData.companyWebsite}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Address</h3>
                <div>
                  <Label htmlFor="companyAddress">Street Address</Label>
                  <Input
                    id="companyAddress"
                    value={companyData.companyAddress}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="companyCity">City</Label>
                    <Input
                      id="companyCity"
                      value={companyData.companyCity}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, companyCity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyState">State/Province</Label>
                    <Input
                      id="companyState"
                      value={companyData.companyState}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, companyState: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyPostalCode">Postal Code</Label>
                    <Input
                      id="companyPostalCode"
                      value={companyData.companyPostalCode}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, companyPostalCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Invoice Defaults</h3>
                <div>
                  <Label htmlFor="invoiceTerms">Default Payment Terms</Label>
                  <Textarea
                    id="invoiceTerms"
                    placeholder="e.g., Payment due within 30 days of invoice date"
                    value={companyData.invoiceTerms}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, invoiceTerms: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceNotes">Default Invoice Notes</Label>
                  <Textarea
                    id="invoiceNotes"
                    placeholder="Additional notes that will appear on invoices"
                    value={companyData.invoiceNotes}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, invoiceNotes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="emailSignature">Email Signature</Label>
                  <Textarea
                    id="emailSignature"
                    placeholder="Signature for invoice emails"
                    value={companyData.emailSignature}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, emailSignature: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCompanySave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Company Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <p className="text-sm text-gray-600">Manage your AI-generated and custom logos</p>
            </CardHeader>
            <CardContent className="py-8">
              <div className="text-center">
                <Wand2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Branding Management</h3>
                <p className="text-gray-600 mb-4">
                  Access the full branding suite to manage your AI-generated logos, upload custom logos, and download assets.
                </p>
                <Button onClick={() => window.location.href = '/dashboard/settings/branding'}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Open Branding Manager
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Appearance Tab */}
      {activeTab === 'invoice-appearance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Templates</CardTitle>
              <p className="text-sm text-gray-600">Choose from pre-designed invoice templates</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'default', label: 'Default', description: 'Clean and professional template' },
                  { value: 'modern', label: 'Modern', description: 'Contemporary design with bold headers' },
                  { value: 'minimal', label: 'Minimal', description: 'Simple and clean design' }
                ].map((template) => (
                  <button
                    key={template.value}
                    onClick={() => setInvoiceAppearanceData(prev => ({ ...prev, invoiceTemplate: template.value }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-gray-50 ${
                      invoiceAppearanceData.invoiceTemplate === template.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <h4 className="font-medium">{template.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    {invoiceAppearanceData.invoiceTemplate === template.value && (
                      <Badge className="mt-2">Active</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <p className="text-sm text-gray-600">Choose a color scheme for your invoices</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
                  { value: 'green', label: 'Green', color: 'bg-green-500' },
                  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
                  { value: 'red', label: 'Red', color: 'bg-red-500' }
                ].map((colorScheme) => (
                  <button
                    key={colorScheme.value}
                    onClick={() => setInvoiceAppearanceData(prev => ({ ...prev, invoiceColorScheme: colorScheme.value }))}
                    className={`p-3 border-2 rounded-lg text-center transition-all hover:bg-gray-50 ${
                      invoiceAppearanceData.invoiceColorScheme === colorScheme.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 ${colorScheme.color} rounded mx-auto mb-2`}></div>
                    <span className="text-sm font-medium">{colorScheme.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <p className="text-sm text-gray-600">Configure default email behavior</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Always CC Myself</h4>
                  <p className="text-sm text-gray-600">Automatically CC yourself on all invoice emails</p>
                </div>
                <Button
                  variant={invoiceAppearanceData.alwaysCcSelf ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInvoiceAppearanceData(prev => ({
                    ...prev,
                    alwaysCcSelf: !prev.alwaysCcSelf
                  }))}
                >
                  {invoiceAppearanceData.alwaysCcSelf ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Payment Instructions</CardTitle>
              <p className="text-sm text-gray-600">Set default payment instructions for all new invoices</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={invoiceAppearanceData.defaultPaymentInstructions}
                onChange={(e) => setInvoiceAppearanceData(prev => ({ 
                  ...prev, 
                  defaultPaymentInstructions: e.target.value 
                }))}
                placeholder="Enter default payment instructions (e.g., bank account details, payment terms)"
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleInvoiceAppearanceSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Invoice Appearance'}
            </Button>
          </div>
        </div>
      )}

      {/* Tax & Currency Tab */}
      {activeTab === 'tax-currency' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Currency Settings</CardTitle>
              <p className="text-sm text-gray-600">Manage your business location, currency, and tax rates</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxCountry">Country</Label>
                  <Select value={taxCurrencyData.country} onValueChange={handleTaxCurrencyCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxCurrency">Currency</Label>
                  <Select value={taxCurrencyData.currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="defaultTaxRate">Default Tax Rate (optional)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={taxCurrencyData.defaultTaxRate}
                    onChange={(e) => setTaxCurrencyData(prev => ({ ...prev, defaultTaxRate: e.target.value }))}
                    className="w-32"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This will be applied as the default tax rate for new invoices and estimates
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleTaxCurrencySave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Tax & Currency Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currency Change Prompt */}
          {showCurrencyPrompt && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Currency Changed</CardTitle>
                <p className="text-sm text-amber-700">
                  You've changed your currency from {oldCurrency} to {taxCurrencyData.currency}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 mb-4">
                  Would you like to update all existing invoices and estimates to use this new currency?
                </p>
                <p className="text-xs text-amber-600 mb-4">
                  Note: This will only update draft and sent invoices/estimates. Finalized invoices will remain unchanged.
                </p>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateExistingInvoices} size="sm">
                    Yes, Update Existing Items
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCurrencyPrompt(false)
                      setOldCurrency('')
                    }} 
                    size="sm"
                  >
                    No, Keep Existing Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Theme Preferences Tab */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <ColorPicker
            selectedColor={primaryColor}
            onColorChange={setPrimaryColor}
            onSave={handleThemeSave}
            showPreview={true}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', description: 'Light backgrounds with dark text' },
                  { value: 'dark', label: 'Dark', description: 'Dark backgrounds with light text' },
                  { value: 'system', label: 'System', description: 'Follow your device settings' }
                ].map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => setColorScheme(scheme.value as any)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-gray-50 ${
                      colorScheme === scheme.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <h4 className="font-medium">{scheme.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleThemeSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Theme Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-gray-600">Choose which notifications you'd like to receive</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                  { key: 'overdueReminders', label: 'Overdue Reminders', description: 'Get notified when invoices become overdue' },
                  { key: 'paymentNotifications', label: 'Payment Notifications', description: 'Receive alerts when payments are received' },
                  { key: 'invoiceUpdates', label: 'Invoice Updates', description: 'Get notified about invoice status changes' }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{setting.label}</h4>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <div>
                      <Button
                        variant={notificationSettings[setting.key as keyof typeof notificationSettings] ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNotificationSettings(prev => ({
                          ...prev,
                          [setting.key]: !prev[setting.key as keyof typeof prev]
                        }))}
                      >
                        {notificationSettings[setting.key as keyof typeof notificationSettings] ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chatbot History Tab */}
      {activeTab === 'chatbot' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Interaction History</CardTitle>
              <p className="text-sm text-gray-600">View your complete conversation history with the AI assistant</p>
            </CardHeader>
            <CardContent>
              {loadingInteractions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading conversation history...</p>
                  </div>
                </div>
              ) : chatbotInteractions.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-600">Start a conversation with the AI assistant to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {chatbotInteractions.map((interaction) => (
                    <div key={interaction.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(interaction.timestamp).toLocaleString()}
                        </div>
                        {interaction.action && (
                          <Badge variant="outline" className="text-xs">
                            {JSON.parse(interaction.action).type?.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="bg-blue-50 rounded-lg p-2 flex-1">
                            <p className="text-sm text-gray-900">{interaction.userMessage}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Bot className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <div className="bg-gray-50 rounded-lg p-2 flex-1">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{interaction.botResponse}</p>
                          </div>
                        </div>
                      </div>
                      
                      {interaction.action && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm font-medium text-yellow-800">
                              Action: {JSON.parse(interaction.action).type?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {chatbotInteractions.length} conversation{chatbotInteractions.length !== 1 ? 's' : ''} found
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadChatbotHistory}
                    disabled={loadingInteractions}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Management Tab */}
      {activeTab === 'cache' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <p className="text-sm text-gray-600">Monitor and clear application cache to improve performance</p>
            </CardHeader>
            <CardContent>
              {loadingCache ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading cache information...</p>
                  </div>
                </div>
              ) : cacheStats ? (
                <div className="space-y-6">
                  {/* Cache Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Voice Commands</h4>
                          <p className="text-2xl font-bold text-blue-700">{cacheStats.voiceCommands.total}</p>
                          <p className="text-sm text-blue-600">{cacheStats.voiceCommands.pending} pending</p>
                        </div>
                        <MessageCircle className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">Local Storage</h4>
                          <p className="text-2xl font-bold text-green-700">{cacheStats.localStorage.keys.length}</p>
                          <p className="text-sm text-green-600">{cacheManager.formatBytes(cacheStats.localStorage.totalSize)}</p>
                        </div>
                        <HardDrive className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-900">Session Storage</h4>
                          <p className="text-2xl font-bold text-purple-700">{cacheStats.sessionStorage.keys.length}</p>
                          <p className="text-sm text-purple-600">{cacheManager.formatBytes(cacheStats.sessionStorage.totalSize)}</p>
                        </div>
                        <RefreshCw className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Cache Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cache Actions</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Clear All Cache</h4>
                          <p className="text-sm text-gray-600">Clear all cached data and reload the page. Recommended if you're experiencing display issues.</p>
                        </div>
                        <Button 
                          onClick={handleClearAllCache}
                          disabled={loadingCache}
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Clear Voice Cache</h4>
                          <p className="text-sm text-gray-600">Clear stored voice commands and speech recognition data.</p>
                        </div>
                        <Button 
                          onClick={handleClearVoiceCache}
                          disabled={loadingCache || cacheStats.voiceCommands.total === 0}
                          variant="outline"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Clear Voice Cache
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Clear Local Storage</h4>
                          <p className="text-sm text-gray-600">Clear locally stored data (theme settings will be preserved).</p>
                        </div>
                        <Button 
                          onClick={handleClearLocalStorage}
                          disabled={loadingCache || cacheStats.localStorage.keys.length === 0}
                          variant="outline"
                        >
                          <HardDrive className="w-4 h-4 mr-2" />
                          Clear Local Storage
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information */}
                  {(cacheStats.localStorage.keys.length > 0 || cacheStats.sessionStorage.keys.length > 0) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Detailed Information</h3>
                        
                        {cacheStats.localStorage.keys.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Local Storage Keys</h4>
                            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                              <code className="text-sm text-gray-700">
                                {cacheStats.localStorage.keys.join(', ')}
                              </code>
                            </div>
                          </div>
                        )}
                        
                        {cacheStats.sessionStorage.keys.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Session Storage Keys</h4>
                            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                              <code className="text-sm text-gray-700">
                                {cacheStats.sessionStorage.keys.join(', ')}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cache data loaded</h3>
                  <p className="text-gray-600 mb-4">Click the button below to load cache statistics.</p>
                  <Button onClick={loadCacheStats} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Cache Stats
                  </Button>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Last updated: {cacheStats ? 'Just now' : 'Never'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadCacheStats}
                    disabled={loadingCache}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help & Support Tab */}
      {activeTab === 'help-support' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <p className="text-sm text-gray-600">Get help and access your AI tutorial</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* My AI Tutorial Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>My AI Tutorial</span>
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {user?.workType ? `${user.workType.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Tutorial` : 'Business Tutorial'}
                      </h4>
                      <p className="text-blue-700 text-sm mb-4">
                        A personalized walkthrough showing you how to use Invoice Easy for your specific business type.
                        Learn to add customers, create invoices, track payments, and more.
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">5-6 minutes</span>
                        </div>
                        
                        {loadingTutorial ? (
                          <Badge variant="outline" className="text-blue-600">
                            Checking status...
                          </Badge>
                        ) : tutorialCompleted ? (
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                            ✓ Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                            Not started
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleStartTutorial}
                      disabled={loadingTutorial}
                      className="flex-shrink-0"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {tutorialCompleted ? 'Replay Tutorial' : 'Start Tutorial'}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tutorial Library */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Video Tutorials</h3>
                <TutorialLibrary compact={true} maxItems={6} showFilters={false} />
                <div className="text-center">
                  <Button variant="outline" onClick={() => window.open('/dashboard/help/tutorials', '_blank')}>
                    View All Tutorials
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Additional Help Resources */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Resources</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">AI Assistant</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Chat with our AI assistant for instant help with any questions about using Invoice Easy.
                    </p>
                    <p className="text-xs text-gray-500">
                      Look for the chat icon in the bottom-right corner of any page.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Voice Commands</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Use voice commands to create invoices, add customers, and mark payments hands-free.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/invoices/voice'}>
                      Try Voice Commands
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <p className="text-sm text-gray-600">Manage your account security and data</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-600">Last changed: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-gray-600">Download all your account data</p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tutorial Popup */}
      <TutorialPopup
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />
    </div>
  )
}