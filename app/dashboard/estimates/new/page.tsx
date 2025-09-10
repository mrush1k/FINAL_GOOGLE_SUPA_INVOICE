"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, Trash2, ArrowLeft, Save, Send, UserPlus, Calculator } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Customer, EstimateItem, COUNTRIES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
]

const TAX_PRESETS = [
  { label: 'No Tax', value: 0 },
  { label: 'GST 10%', value: 10 },
  { label: 'VAT 20%', value: 20 },
  { label: 'HST 13%', value: 13 },
  { label: 'Custom', value: null },
]

interface CustomerFormData {
  displayName: string
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  businessRegNumber: string
}

export default function NewEstimatePage() {
  const router = useRouter()
  const { user, userProfile, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [nextEstimateNumber, setNextEstimateNumber] = useState('')
  
  // Customer creation modal state
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>({
    displayName: '',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    businessRegNumber: '',
  })
  
  // Header Section State
  const [estimateNumber, setEstimateNumber] = useState('')
  const [estimateDate, setEstimateDate] = useState<Date>()
  const [validUntil, setValidUntil] = useState<Date>()
  
  // Customer Section State
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [businessInfo, setBusinessInfo] = useState('')
  
  // Items Section State
  const [items, setItems] = useState<Array<{
    itemName: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>>([
    { itemName: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])
  
  // Financial Section State
  const [currency, setCurrency] = useState('')
  const [taxPreset, setTaxPreset] = useState<number | null>(0)
  const [customTaxRate, setCustomTaxRate] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)
  
  // Notes Section State
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')

  useEffect(() => {
    if (user && userProfile) {
      fetchCustomers()
      fetchNextEstimateNumber()
      initializeDefaults()
    }
  }, [user, userProfile])

  const initializeDefaults = () => {
    const today = new Date()
    const validDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    setEstimateDate(today)
    setValidUntil(validDate)
    setCurrency(userProfile?.currency || 'USD')
    
    // Set business information from user profile
    const businessLines: string[] = []
    if (userProfile?.businessName) businessLines.push(userProfile.businessName)
    if (userProfile?.displayName) businessLines.push(userProfile.displayName)
    if (userProfile?.address) businessLines.push(userProfile.address)
    if (userProfile?.city && userProfile?.state) {
      businessLines.push(`${userProfile.city}, ${userProfile.state} ${userProfile.zipCode || ''}`.trim())
    }
    if (userProfile?.phone) businessLines.push(`Phone: ${userProfile.phone}`)
    if (userProfile?.email) businessLines.push(`Email: ${userProfile.email}`)
    if (userProfile?.businessRegNumber) {
      const country = COUNTRIES.find(c => c.code === userProfile.country)
      const label = country?.businessRegLabel || 'Business Registration'
      businessLines.push(`${label}: ${userProfile.businessRegNumber}`)
    }
    
    setBusinessInfo(businessLines.join('\n'))
    
    setTerms('This estimate is valid for 30 days from the issue date. Prices are subject to change after expiration.')
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: await getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchNextEstimateNumber = async () => {
    try {
      const response = await fetch('/api/estimates', {
        headers: await getAuthHeaders()
      })
      
      if (response.ok) {
        const estimates = await response.json()
        const highestNumber = estimates.reduce((max: number, estimate: any) => {
          const num = parseInt(estimate.number.replace('EST-', ''))
          return num > max ? num : max
        }, 0)
        
        const nextNum = `EST-${(highestNumber + 1).toString().padStart(4, '0')}`
        setNextEstimateNumber(nextNum)
        setEstimateNumber(nextNum)
      }
    } catch (error) {
      console.error('Error fetching next estimate number:', error)
      setNextEstimateNumber('EST-0001')
      setEstimateNumber('EST-0001')
    }
  }

  const calculateTotals = () => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0)
    const effectiveTaxRate = taxPreset === null ? customTaxRate : (taxPreset || 0)
    const newTaxAmount = (newSubtotal * effectiveTaxRate) / 100
    const newTotal = newSubtotal + newTaxAmount
    
    setSubtotal(newSubtotal)
    setTaxAmount(newTaxAmount)
    setTotal(newTotal)
  }

  useEffect(() => {
    calculateTotals()
  }, [items, taxPreset, customTaxRate])

  const addItem = () => {
    setItems([...items, { itemName: '', description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const createCustomer = async () => {
    if (!customerFormData.displayName) {
      toast({
        title: "Error",
        description: "Display name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(customerFormData),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomers([...customers, newCustomer])
        setSelectedCustomerId(newCustomer.id)
        setShowCustomerDialog(false)
        
        // Reset form
        setCustomerFormData({
          displayName: '',
          firstName: '',
          lastName: '',
          businessName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          businessRegNumber: '',
        })
        
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create customer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      })
    }
  }

  const saveEstimate = async (isDraft = true) => {
    if (!selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return
    }

    if (!estimateDate || !validUntil) {
      toast({
        title: "Error",
        description: "Please set estimate and valid until dates",
        variant: "destructive",
      })
      return
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      toast({
        title: "Error",
        description: "Please fill in all item details correctly",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const estimateData = {
        customerId: selectedCustomerId,
        number: estimateNumber,
        issueDate: estimateDate,
        validUntil: validUntil,
        currency,
        notes,
        terms,
        items: items.map(item => ({
          itemName: item.itemName || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }

      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(estimateData),
      })

      if (response.ok) {
        const estimate = await response.json()
        toast({
          title: "Success",
          description: `Estimate ${estimate.number} ${isDraft ? 'saved as draft' : 'created'} successfully`,
        })
        router.push('/dashboard/estimates')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create estimate",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating estimate:', error)
      toast({
        title: "Error",
        description: "Failed to create estimate",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode)
    return currency?.symbol || currencyCode
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
  const selectedCountry = COUNTRIES.find(c => c.code === customerFormData.country)

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/dashboard/estimates">
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Estimates
              </Button>
            </Link>
          </div>
          <h1 className="mobile-h1">New Estimate</h1>
          <p className="mobile-text text-gray-600">Create a new cost estimate for your client</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            onClick={() => saveEstimate(true)}
            disabled={loading}
            className="mobile-button"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => saveEstimate(false)}
            disabled={loading}
            className="mobile-button"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Create Estimate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Estimate Details */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className="mobile-h2">Estimate Details</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              <div className="mobile-form-row">
                <div className="flex-1">
                  <Label htmlFor="estimateNumber" className="mobile-label">Estimate Number</Label>
                  <Input
                    id="estimateNumber"
                    value={estimateNumber}
                    onChange={(e) => setEstimateNumber(e.target.value)}
                    className="mobile-input"
                    placeholder="EST-0001"
                  />
                </div>
                <div className="flex-1">
                  <Label className="mobile-label">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mobile-input">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mobile-form-row">
                <div className="flex-1">
                  <Label className="mobile-label">Estimate Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mobile-input justify-start text-left font-normal",
                          !estimateDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {estimateDate ? format(estimateDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={estimateDate}
                        onSelect={setEstimateDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex-1">
                  <Label className="mobile-label">Valid Until</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mobile-input justify-start text-left font-normal",
                          !validUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validUntil ? format(validUntil, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validUntil}
                        onSelect={setValidUntil}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="mobile-h2">Customer</CardTitle>
                <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mobile-button">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="displayName" className="mobile-label">Display Name *</Label>
                          <Input
                            id="displayName"
                            value={customerFormData.displayName}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="mobile-input"
                            placeholder="Customer display name"
                          />
                        </div>
                      </div>

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="firstName" className="mobile-label">First Name</Label>
                          <Input
                            id="firstName"
                            value={customerFormData.firstName}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="lastName" className="mobile-label">Last Name</Label>
                          <Input
                            id="lastName"
                            value={customerFormData.lastName}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                      </div>

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="businessName" className="mobile-label">Business Name</Label>
                          <Input
                            id="businessName"
                            value={customerFormData.businessName}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, businessName: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                      </div>

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="email" className="mobile-label">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={customerFormData.email}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="phone" className="mobile-label">Phone</Label>
                          <Input
                            id="phone"
                            value={customerFormData.phone}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                      </div>

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="country" className="mobile-label">Country</Label>
                          <Select 
                            value={customerFormData.country} 
                            onValueChange={(value) => setCustomerFormData(prev => ({ ...prev, country: value }))}
                          >
                            <SelectTrigger className="mobile-input">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedCountry && (
                        <div className="mobile-form-row">
                          <div className="flex-1">
                            <Label htmlFor="businessRegNumber" className="mobile-label">
                              {selectedCountry.businessRegLabel}
                            </Label>
                            <Input
                              id="businessRegNumber"
                              value={customerFormData.businessRegNumber}
                              onChange={(e) => setCustomerFormData(prev => ({ ...prev, businessRegNumber: e.target.value }))}
                              className="mobile-input"
                              pattern={selectedCountry.businessRegPattern}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="address" className="mobile-label">Address</Label>
                          <Input
                            id="address"
                            value={customerFormData.address}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                      </div>

                      <div className="mobile-form-row">
                        <div className="flex-1">
                          <Label htmlFor="city" className="mobile-label">City</Label>
                          <Input
                            id="city"
                            value={customerFormData.city}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="state" className="mobile-label">State/Province</Label>
                          <Input
                            id="state"
                            value={customerFormData.state}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, state: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="zipCode" className="mobile-label">Postal Code</Label>
                          <Input
                            id="zipCode"
                            value={customerFormData.zipCode}
                            onChange={(e) => setCustomerFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                            className="mobile-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createCustomer}>
                        Create Customer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="mobile-padding">
              <div className="space-y-4">
                <div>
                  <Label className="mobile-label">Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="mobile-input">
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="mobile-text">
                      <strong>{selectedCustomer.displayName}</strong>
                      {selectedCustomer.businessName && (
                        <div className="text-gray-600">{selectedCustomer.businessName}</div>
                      )}
                      {selectedCustomer.email && (
                        <div className="text-gray-600">{selectedCustomer.email}</div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="text-gray-600">{selectedCustomer.phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className="mobile-h2">Items</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              <div className="space-y-4">
                {/* Desktop Table Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-sm font-medium text-gray-700 pb-2 border-b">
                  <div className="col-span-3">Item Name</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-1">Total</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Items List */}
                {items.map((item, index) => (
                  <div key={index} className="space-y-3 sm:space-y-0">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden space-y-3 p-3 border rounded-lg">
                      <div>
                        <Label className="mobile-label">Item Name</Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                          className="mobile-input"
                          placeholder="Optional item name"
                        />
                      </div>
                      <div>
                        <Label className="mobile-label">Description *</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="mobile-input"
                          placeholder="Describe the item or service"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="mobile-label">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="mobile-input"
                          />
                        </div>
                        <div>
                          <Label className="mobile-label">Unit Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="mobile-input"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="mobile-text font-medium">
                          Total: {getCurrencySymbol(currency)} {item.total.toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-start">
                      <div className="col-span-3">
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                          className="mobile-input"
                          placeholder="Item name"
                        />
                      </div>
                      <div className="col-span-4">
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="mobile-input"
                          placeholder="Description"
                          rows={1}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="mobile-input"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="mobile-input"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="mobile-text font-medium">
                          {getCurrencySymbol(currency)} {item.total.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="w-full mobile-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className="mobile-h2">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="mobile-label">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mobile-input"
                    placeholder="Additional notes for the estimate"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="terms" className="mobile-label">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="mobile-input"
                    placeholder="Terms and conditions"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4 sm:space-y-6">
          {/* Business Information */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className="mobile-h2">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              <Textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                className="mobile-input"
                rows={6}
                placeholder="Your business information"
              />
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className="mobile-h2">Total</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              <div className="space-y-3">
                <div className="flex justify-between mobile-text">
                  <span>Subtotal:</span>
                  <span>{getCurrencySymbol(currency)} {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="mobile-label">Tax</Label>
                  <Select 
                    value={taxPreset === null ? 'custom' : taxPreset.toString()} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setTaxPreset(null)
                      } else {
                        setTaxPreset(parseFloat(value))
                      }
                    }}
                  >
                    <SelectTrigger className="mobile-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_PRESETS.map((preset) => (
                        <SelectItem 
                          key={preset.label} 
                          value={preset.value === null ? 'custom' : preset.value.toString()}
                        >
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {taxPreset === null && (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={customTaxRate}
                      onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || 0)}
                      className="mobile-input"
                      placeholder="Enter tax rate (%)"
                    />
                  )}
                </div>
                
                <div className="flex justify-between mobile-text">
                  <span>Tax ({taxPreset === null ? customTaxRate : (taxPreset || 0)}%):</span>
                  <span>{getCurrencySymbol(currency)} {taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{getCurrencySymbol(currency)} {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}