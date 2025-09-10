"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Globe, DollarSign, FileText } from 'lucide-react'
import { COUNTRY_SETTINGS, COUNTRY_NAMES, CURRENCY_SYMBOLS, getSettingsForCountry } from '@/lib/country-utils'

interface UserPreferences {
  country?: string
  currency?: string
  taxLabel?: string
  businessIdLabel?: string
  locale?: string
  dateFormat?: string
  defaultTaxRate?: number
}

export default function CurrencySettings() {
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<UserPreferences>({})

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences/currency')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const settings = getSettingsForCountry(countryCode)
    const newPreferences = {
      ...preferences,
      country: settings.country,
      currency: settings.currency,
      taxLabel: settings.taxLabel,
      businessIdLabel: settings.businessIdLabel,
      locale: settings.locale,
      dateFormat: settings.dateFormat,
    }
    setPreferences(newPreferences)
  }

  const savePreferences = async (migrateExisting = false) => {
    setSaving(true)
    try {
      const response = await fetch('/api/user-preferences/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          migrateExisting
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: migrateExisting 
            ? "Settings updated and applied to existing invoices and estimates"
            : "Settings updated successfully",
        })
        setShowMigrationDialog(false)
        setPendingChanges({})
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    // Check if currency or country changed
    const currencyChanged = pendingChanges.currency !== preferences.currency
    const countryChanged = pendingChanges.country !== preferences.country
    
    if (currencyChanged || countryChanged) {
      setPendingChanges(preferences)
      setShowMigrationDialog(true)
    } else {
      savePreferences(false)
    }
  }

  const currentCurrencySymbol = preferences.currency ? CURRENCY_SYMBOLS[preferences.currency] : '$'

  if (loading) {
    return <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Currency & Tax Settings</h1>
        <p className="text-muted-foreground">
          Configure your regional settings, currency, and tax preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Select your country to automatically configure currency and tax settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={preferences.country}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
            </CardTitle>
            <CardDescription>
              Configure your default currency and formatting preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                      <SelectItem key={code} value={code}>
                        {code} ({symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={preferences.defaultTaxRate || ''}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    defaultTaxRate: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="10.00"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Currency Preview</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Amounts will be displayed as: <span className="font-mono font-bold">
                  {currentCurrencySymbol}1,234.56
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax & Business Settings
            </CardTitle>
            <CardDescription>
              Configure tax labels and business identification fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxLabel">Tax Label</Label>
                <Input
                  id="taxLabel"
                  value={preferences.taxLabel || ''}
                  onChange={(e) => setPreferences({ ...preferences, taxLabel: e.target.value })}
                  placeholder="GST, VAT, Tax, etc."
                />
                <p className="text-xs text-muted-foreground">
                  This label will appear on invoices and estimates
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessIdLabel">Business ID Label</Label>
                <Input
                  id="businessIdLabel"
                  value={preferences.businessIdLabel || ''}
                  onChange={(e) => setPreferences({ ...preferences, businessIdLabel: e.target.value })}
                  placeholder="ABN, EIN, VAT Number, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Label for your business identification number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <AlertDialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Settings to Existing Data?</AlertDialogTitle>
            <AlertDialogDescription>
              You've changed your currency or regional settings. Would you like to apply these 
              new settings to your existing invoices and estimates?
              <br /><br />
              <strong>This will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Update currency symbols on existing invoices</li>
                <li>Apply new tax labels where applicable</li>
                <li>Update date formats in existing documents</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => savePreferences(false)}>
              Save Without Migration
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => savePreferences(true)}>
              Apply to Existing Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}