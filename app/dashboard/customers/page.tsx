"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { Customer, COUNTRIES } from '@/lib/types'
import { Plus, Edit, Trash2, User, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

export default function CustomersPage() {
  const { user, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
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

  useEffect(() => {
    if (user) {
      fetchCustomers()
    }
  }, [user])

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
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
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
    setEditingCustomer(null)
  }

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        displayName: customer.displayName,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        businessName: customer.businessName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || '',
        businessRegNumber: customer.businessRegNumber || '',
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Frontend validation
    const trimmedDisplayName = formData.displayName.trim()
    if (!trimmedDisplayName) {
      toast({
        title: 'Validation Error',
        description: 'Display name is required',
        variant: 'destructive',
      })
      return
    }
    
    // Update formData with trimmed values
    const cleanFormData = {
      ...formData,
      displayName: trimmedDisplayName,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      businessName: formData.businessName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      country: formData.country.trim(),
      businessRegNumber: formData.businessRegNumber.trim(),
    }

    try {
      const url = editingCustomer 
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers'
      
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const payload = editingCustomer 
        ? cleanFormData
        : cleanFormData

      const headers = await getAuthHeaders()
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchCustomers()
        handleCloseDialog()
        toast({
          title: editingCustomer ? 'Customer updated' : 'Customer created',
          description: `${cleanFormData.displayName} has been ${editingCustomer ? 'updated' : 'added'} successfully.`,
        })
      } else {
        const errorData = await response.json()
        console.error('Customer save error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to save customer')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save customer. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.displayName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCustomers()
        toast({
          title: 'Customer deleted',
          description: `${customer.displayName} has been deleted successfully.`,
        })
      } else {
        throw new Error('Failed to delete customer')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getCountryConfig = (countryCode: string) => {
    return COUNTRIES.find(c => c.code === countryCode)
  }

  if (loading) {
    return (
      <div className="container-mobile">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
          <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto touch-target">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Add Customer</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                    placeholder="Name shown on invoices"
                    className={!formData.displayName.trim() && formData.displayName.length > 0 ? 'border-red-500' : ''}
                  />
                  {!formData.displayName.trim() && formData.displayName.length > 0 && (
                    <p className="text-sm text-red-500">Display name cannot be empty</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
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

                {formData.country && (
                  <div className="space-y-2">
                    <Label htmlFor="businessRegNumber">
                      {getCountryConfig(formData.country)?.businessRegLabel}
                    </Label>
                    <Input
                      id="businessRegNumber"
                      value={formData.businessRegNumber}
                      onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                      placeholder={getCountryConfig(formData.country)?.businessRegLabel}
                    />
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="order-2 sm:order-1">
                  Cancel
                </Button>
                <Button type="submit" className="order-1 sm:order-2">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">
              <User className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No customers yet</p>
              <p className="text-xs sm:text-sm">Add your first customer to get started</p>
            </div>
          ) : (
            <div className="responsive-table">
              <div className="block sm:hidden">
                {/* Mobile Card Layout */}
                <div className="space-y-3 p-3">
                  {customers.map((customer) => (
                    <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {customer.businessName ? (
                              <Building className="w-6 h-6 text-gray-400" />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{customer.displayName}</div>
                            {customer.firstName && customer.lastName && (
                              <div className="text-sm text-gray-500 truncate">
                                {customer.firstName} {customer.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(customer)}
                            className="touch-target p-1 h-8 w-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer)}
                            className="text-red-600 hover:text-red-700 touch-target p-1 h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {customer.email && <div className="text-blue-600">{customer.email}</div>}
                        {customer.phone && <div className="text-gray-600">{customer.phone}</div>}
                        {customer.city && customer.state && (
                          <div className="text-gray-500">{customer.city}, {customer.state}</div>
                        )}
                        {customer.businessName && (
                          <div className="text-gray-700">{customer.businessName}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:block">
                {/* Desktop Table Layout */}
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Business Info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {customer.businessName ? (
                            <Building className="w-8 h-8 text-gray-400" />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{customer.displayName}</div>
                          {customer.firstName && customer.lastName && (
                            <div className="text-sm text-gray-500">
                              {customer.firstName} {customer.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.email && <div>{customer.email}</div>}
                        {customer.phone && <div className="text-gray-500">{customer.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.city && customer.state && (
                          <div>{customer.city}, {customer.state}</div>
                        )}
                        {customer.country && (
                          <div className="text-gray-500">
                            {COUNTRIES.find(c => c.code === customer.country)?.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.businessName && <div>{customer.businessName}</div>}
                        {customer.businessRegNumber && (
                          <div className="text-gray-500">{customer.businessRegNumber}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(customer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}