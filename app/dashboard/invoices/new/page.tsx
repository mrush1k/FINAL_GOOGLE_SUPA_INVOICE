"use client"

import { useState, useEffect, useRef } from 'react'
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
import { CalendarIcon, Plus, Trash2, ArrowLeft, Save, Send, UserPlus, FileText, Eye, PenTool, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Customer, InvoiceItem, COUNTRIES } from '@/lib/types'
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

const PAYMENT_TERMS = [
  { label: 'Due on Receipt', value: 0 },
  { label: 'Net 7', value: 7 },
  { label: 'Net 15', value: 15 },
  { label: 'Net 30', value: 30 },
  { label: 'Net 60', value: 60 },
  { label: 'Net 90', value: 90 },
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

interface SavedItem {
  id: string
  name: string
  description: string
  unitPrice: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { user, userProfile, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('')
  
  // Customer creation modal state
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showSavedItemsDialog, setShowSavedItemsDialog] = useState(false)
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
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [currency, setCurrency] = useState('')
  
  // Customer & Business Info State
  const [customerId, setCustomerId] = useState('')
  const [businessInfo, setBusinessInfo] = useState('')
  
  // Items Section State
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { name: '', description: '', quantity: undefined, unitPrice: undefined }
  ])
  
  // Tax & Discount Section State
  const [taxRate, setTaxRate] = useState(0)
  const [customTaxRate, setCustomTaxRate] = useState('')
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  
  // Signature Section State
  const [mySignature, setMySignature] = useState('')
  const [clientSignature, setClientSignature] = useState('')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureType, setSignatureType] = useState<'my' | 'client'>('my')
  const [mySignatureFile, setMySignatureFile] = useState<string | null>(null)
  const [clientSignatureFile, setClientSignatureFile] = useState<string | null>(null)
  
  // Additional fields
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      fetchCustomers()
      fetchSavedItems()
      generateNextInvoiceNumber()
    }
  }, [user])

  useEffect(() => {
    if (userProfile) {
      loadBusinessInfo()
      // Set default currency from user profile
      if (userProfile.currency && !currency) {
        setCurrency(userProfile.currency)
      }
    }
  }, [userProfile, user])

  const fetchCustomers = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/customers', { headers })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchSavedItems = async () => {
    // Mock saved items for now - implement API endpoint later
    setSavedItems([
      { id: '1', name: 'Consultation', description: 'Business consultation services', unitPrice: 150 },
      { id: '2', name: 'Design Work', description: 'Graphic design and branding', unitPrice: 100 },
      { id: '3', name: 'Development', description: 'Web development services', unitPrice: 125 },
    ])
  }

  const loadBusinessInfo = () => {
    if (userProfile) {
      const info = `${userProfile.displayName || 'Your Business'}\n${userProfile.address || ''}\n${userProfile.city ? `${userProfile.city}, ${userProfile.state || ''} ${userProfile.zipCode || ''}` : ''}\n${userProfile.phone || ''}\n${user?.email || ''}`
      setBusinessInfo(info.replace(/\n+/g, '\n').trim())
    }
  }

  const generateNextInvoiceNumber = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices/next-number', { headers })
      if (response.ok) {
        const data = await response.json()
        const nextNumber = data.nextNumber
        setNextInvoiceNumber(nextNumber)
        setInvoiceNumber(nextNumber)
      }
    } catch (error) {
      console.error('Error generating invoice number:', error)
      setInvoiceNumber('#0001')
      setNextInvoiceNumber('#0001')
    }
  }

  const resetCustomerForm = () => {
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
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...customerFormData, userId: user?.id }),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        await fetchCustomers()
        setCustomerId(newCustomer.id)
        setShowCustomerDialog(false)
        resetCustomerForm()
        toast({
          title: 'Customer created',
          description: `${customerFormData.displayName} has been added successfully.`,
        })
      } else {
        throw new Error('Failed to create customer')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getCountryConfig = (countryCode: string) => {
    return COUNTRIES.find(c => c.code === countryCode)
  }

  const addItem = () => {
    setItems([...items, { name: '', description: '', quantity: undefined, unitPrice: undefined }])
  }

  const addSavedItem = (savedItem: SavedItem) => {
    setItems([...items, { 
      name: savedItem.name, 
      description: savedItem.description, 
      quantity: 1, 
      unitPrice: savedItem.unitPrice 
    }])
    setShowSavedItemsDialog(false)
    toast({
      title: 'Item added',
      description: `${savedItem.name} has been added to the invoice.`,
    })
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const calculateItemTotal = (quantity?: number, unitPrice?: number) => {
    if (!quantity || !unitPrice) return 0
    return quantity * unitPrice
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.quantity, item.unitPrice)
    }, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    if (taxInclusive) {
      // For inclusive tax, the tax is already included in the subtotal
      // Tax = subtotal * (taxRate / (100 + taxRate))
      return subtotal * (taxRate / (100 + taxRate))
    } else {
      // For exclusive tax, add tax on top of subtotal
      return subtotal * (taxRate / 100)
    }
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (discountType === 'percentage') {
      return subtotal * (discountAmount / 100)
    }
    return discountAmount
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discount = calculateDiscount()
    
    if (taxInclusive) {
      // For inclusive tax, subtotal already includes tax
      // Total = subtotal - discount (tax is already in subtotal)
      return subtotal - discount
    } else {
      // For exclusive tax, add tax on top
      return subtotal + tax - discount
    }
  }

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency || userProfile?.currency || 'USD')
  }

  const validateForm = () => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return false
    }
    
    if (!currency) {
      toast({
        title: "Error", 
        description: "Please select a currency",
        variant: "destructive",
      })
      return false
    }
    
    if (!invoiceDate) {
      toast({
        title: "Error",
        description: "Please select an invoice date",
        variant: "destructive",
      })
      return false
    }
    
    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      })
      return false
    }

    const validItems = items.filter(item => 
      item.description && item.quantity && item.unitPrice
    )
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one invoice item with description, quantity, and unit price",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const saveInvoice = async (status: 'DRAFT' | 'SENT') => {
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const validItems = items.filter(item => 
        item.description && item.quantity && item.unitPrice
      )

      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const discountAmount = calculateDiscount()
      const total = calculateTotal()
      
      const invoiceData = {
        number: invoiceNumber,
        customerId,
        currency,
        invoiceDate: invoiceDate!.toISOString(),
        dueDate: dueDate!.toISOString(),
        poNumber: poNumber || null,
        notes: notes || null,
        subtotal,
        taxAmount,
        taxInclusive,
        total,
        status,
        mySignature: mySignature || mySignatureFile || null,
        clientSignature: clientSignature || clientSignatureFile || null,
        items: validItems.map(item => ({
          name: item.name || '',
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          total: calculateItemTotal(item.quantity, item.unitPrice)
        }))
      }

      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const invoice = await response.json()
        toast({
          title: "Success",
          description: `Invoice ${status === 'DRAFT' ? 'saved as draft' : 'sent to customer'}`,
        })
        router.push(`/dashboard/invoices/${invoice.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const previewPDF = () => {
    // Implementation for PDF preview
    toast({
      title: "PDF Preview",
      description: "PDF preview will open in a new window",
    })
  }

  const handlePaymentTermsChange = (days: number) => {
    setSelectedPaymentTerms(days)
    if (invoiceDate) {
      const newDueDate = new Date(invoiceDate)
      newDueDate.setDate(newDueDate.getDate() + days)
      setDueDate(newDueDate)
    }
  }
  
  // Handle signature file uploads
  const handleSignatureUpload = (type: 'my' | 'client', file: File) => {
    if (!file) return
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPEG)",
        variant: "destructive",
      })
      return
    }
    
    // Create a URL for the image file
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'my') {
        setMySignatureFile(result)
      } else {
        setClientSignatureFile(result)
      }
      
      toast({
        title: "Signature uploaded",
        description: `${type === 'my' ? 'Your' : 'Client'} signature has been uploaded.`,
      })
    }
    reader.readAsDataURL(file)
  }
  
  // References for file inputs
  const mySignatureInputRef = useRef<HTMLInputElement>(null)
  const clientSignatureInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mobile-button w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="mobile-h1">New Invoice</h1>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => saveInvoice('DRAFT')}
            disabled={loading}
            className="mobile-button"
          >
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Save Draft</span>
            <span className="xs:hidden">Save</span>
          </Button>
          <Button
            variant="outline"
            onClick={previewPDF}
            disabled={loading}
            className="mobile-button"
          >
            <Eye className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Preview PDF</span>
            <span className="xs:hidden">Preview</span>
          </Button>
          <Button
            onClick={() => saveInvoice('SENT')}
            disabled={loading}
            className="mobile-button"
          >
            <Send className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Send Invoice</span>
            <span className="xs:hidden">Send</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* A. Header Section */}
        <Card className="mobile-card">
          <CardHeader className="mobile-padding">
            <CardTitle className="mobile-h2">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="mobile-padding space-y-4">
            <div className="mobile-form-row">
              <div className="mobile-form-group">
                <Label htmlFor="invoiceNumber" className="mobile-text font-medium">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={nextInvoiceNumber}
                  className="mobile-input"
                />
              </div>
              
              <div className="mobile-form-group">
                <Label className="mobile-text font-medium">Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mobile-input justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mobile-form-group">
                <Label className="mobile-text font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mobile-input justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
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

              <div className="md:col-span-2">
                <Label>Payment Terms</Label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_TERMS.map((term) => (
                    <Button
                      key={term.label}
                      variant={selectedPaymentTerms === term.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePaymentTermsChange(term.value)}
                      className={`text-xs ${
                        selectedPaymentTerms === term.value 
                          ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                          : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      }`}
                    >
                      {term.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* B. Customer & Business Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerId">Customer</Label>
                <div className="flex gap-2">
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={customers.length === 0 ? "No customers found" : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                          No customers found.<br />
                          Create your first customer to get started.
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                placeholder="Your business details..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* C. Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700 mb-4">
              <div className="col-span-2">Item Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Line Total</div>
              <div className="col-span-1">Action</div>
            </div>
            
            {/* Items */}
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-700">Item #{index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Item Name</Label>
                      <Input
                        value={item.name || ''}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Item name"
                        className="h-11"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Description</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="1"
                          className="h-11"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-1 block">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="1000"
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Total</Label>
                      <div className="h-11 px-3 py-2 bg-white border rounded-md flex items-center font-medium text-gray-800">
                        {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <Input
                      value={item.name || ''}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="h-11"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="h-11"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="1"
                      className="h-11"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                      className="h-11"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="h-11 px-3 py-2 bg-white border rounded-md flex items-center font-medium text-gray-800">
                      {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="h-11 w-11"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={addItem}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              
              <Dialog open={showSavedItemsDialog} onOpenChange={setShowSavedItemsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 bg-gray-800 text-white hover:bg-gray-900">
                    <FileText className="w-4 h-4 mr-2" />
                    Select Saved
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Saved Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {savedItems.map((savedItem) => (
                      <div key={savedItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{savedItem.name}</h4>
                          <p className="text-sm text-gray-600">{savedItem.description}</p>
                          <p className="text-sm font-medium">{formatCurrency(savedItem.unitPrice)}</p>
                        </div>
                        <Button size="sm" onClick={() => addSavedItem(savedItem)}>
                          Add
                        </Button>
                      </div>
                    ))}
                    {savedItems.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No saved items found</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* D. Tax & Discount Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tax, Discount & Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Tax Rate</Label>
                  <Select value={taxRate.toString()} onValueChange={(value) => {
                    if (value === 'custom') {
                      setTaxRate(parseFloat(customTaxRate) || 0)
                    } else {
                      setTaxRate(parseFloat(value))
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.value?.toString() || 'custom'}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {taxRate === 0 && (
                  <div>
                    <Label htmlFor="customTaxRate">Custom Tax Rate (%)</Label>
                    <Input
                      id="customTaxRate"
                      type="number"
                      min="0"
                      step="0.1"
                      value={customTaxRate}
                      onChange={(e) => {
                        setCustomTaxRate(e.target.value)
                        setTaxRate(parseFloat(e.target.value) || 0)
                      }}
                      placeholder="Enter tax rate"
                    />
                  </div>
                )}

                {taxRate > 0 && (
                  <div>
                    <Label>GST/Tax Method</Label>
                    <Select value={taxInclusive ? 'inclusive' : 'exclusive'} onValueChange={(value) => setTaxInclusive(value === 'inclusive')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">Tax Exclusive (add tax on top)</SelectItem>
                        <SelectItem value="inclusive">Tax Inclusive (tax included in prices)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {taxInclusive 
                        ? "Tax is included in your item prices. Tax amount will be calculated as part of the total." 
                        : "Tax will be added on top of your subtotal."}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(value: 'fixed' | 'percentage') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountAmount">
                    Discount {discountType === 'percentage' ? '(%)' : `(${currency || 'USD'})`}
                  </Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Tax ({taxRate}% - {taxInclusive ? 'Inclusive' : 'Exclusive'}):
                </span>
                <span className="font-medium">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculateDiscount())}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E. Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>My Signature (Invoice Creator)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSignatureType('my')
                      setShowSignatureModal(true)
                    }}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Draw
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => mySignatureInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      Use Saved
                    </Button>
                    <input 
                      type="file" 
                      ref={mySignatureInputRef} 
                      onChange={(e) => e.target.files && handleSignatureUpload('my', e.target.files[0])} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  {mySignature && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">Signature added ✓</p>
                    </div>
                  )}
                  {mySignatureFile && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <img 
                        src={mySignatureFile} 
                        alt="My signature" 
                        className="max-h-20 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Client Signature (Required on Payment)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSignatureType('client')
                      setShowSignatureModal(true)
                    }}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Draw
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => clientSignatureInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <input 
                      type="file" 
                      ref={clientSignatureInputRef} 
                      onChange={(e) => e.target.files && handleSignatureUpload('client', e.target.files[0])} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  {clientSignature && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">Client signature added ✓</p>
                    </div>
                  )}
                  {clientSignatureFile && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <img 
                        src={clientSignatureFile} 
                        alt="Client signature" 
                        className="max-h-20 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Client signature is required before marking invoice as Paid
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="poNumber">Purchase Order Number</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Purchase Order Number (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms for the customer"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Creation Modal */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={customerFormData.displayName}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, displayName: e.target.value })}
                  required
                  placeholder="Name shown on invoices"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={customerFormData.firstName}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={customerFormData.lastName}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={customerFormData.businessName}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, businessName: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={customerFormData.country} 
                  onValueChange={(value) => setCustomerFormData({ ...customerFormData, country: value })}
                >
                  <SelectTrigger>
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

              {/* Dynamic Business Registration Field */}
              {customerFormData.country && getCountryConfig(customerFormData.country) && (
                <div className="space-y-2">
                  <Label htmlFor="businessRegNumber">
                    {getCountryConfig(customerFormData.country)?.businessRegLabel}
                  </Label>
                  <Input
                    id="businessRegNumber"
                    value={customerFormData.businessRegNumber}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, businessRegNumber: e.target.value })}
                    placeholder={`Enter ${getCountryConfig(customerFormData.country)?.businessRegLabel}`}
                  />
                </div>
              )}
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={customerFormData.city}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={customerFormData.state}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={customerFormData.zipCode}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, zipCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCustomerDialog(false)
                  resetCustomerForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {signatureType === 'my' ? 'My Signature' : 'Client Signature'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Draw signature here</p>
              <p className="text-sm text-gray-400">Signature canvas would go here</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSignatureModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (signatureType === 'my') {
                  setMySignature('signature-data')
                } else {
                  setClientSignature('signature-data')
                }
                setShowSignatureModal(false)
                toast({
                  title: 'Signature saved',
                  description: `${signatureType === 'my' ? 'Your' : 'Client'} signature has been saved.`,
                })
              }}>
                Save Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}