"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Eye, Edit, Download, Mail, Calculator, ArrowRight } from 'lucide-react'
import { Estimate, EstimateStatus } from '@/lib/types'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800', 
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  converted: 'bg-purple-100 text-purple-800'
}

export default function EstimatesPage() {
  const { user } = useAuth()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (user) {
      fetchEstimates()
    }
  }, [user])

  const fetchEstimates = async () => {
    try {
      const response = await fetch('/api/estimates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstimates(data)
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstimateStatus = (estimate: Estimate) => {
    if (estimate.status === EstimateStatus.CONVERTED) {
      return 'converted'
    }
    
    if (estimate.status === EstimateStatus.SENT || estimate.status === EstimateStatus.APPROVED) {
      const validUntil = new Date(estimate.validUntil)
      const today = new Date()
      
      if (validUntil < today && estimate.status !== EstimateStatus.APPROVED) {
        return 'expired'
      }
    }
    
    return estimate.status.toLowerCase()
  }

  const handleConvertToInvoice = async (estimateId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update estimate status to converted
        setEstimates(prev => prev.map(est => 
          est.id === estimateId ? { ...est, status: EstimateStatus.CONVERTED } : est
        ))
        // You might want to show a success message here
        alert(`Estimate converted to invoice ${data.invoice.number}!`)
      }
    } catch (error) {
      console.error('Error converting estimate to invoice:', error)
    }
  }

  const filteredEstimates = estimates
    .filter(estimate => {
      const matchesSearch = 
        estimate.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estimate.customer?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || getEstimateStatus(estimate) === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'amount-high':
          return b.total - a.total
        case 'amount-low':
          return a.total - b.total
        case 'valid-until':
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading estimates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="mobile-h1">Estimates</h1>
          <p className="mobile-text text-gray-600">Create and manage cost estimates for clients</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard/estimates/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto mobile-button">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">New Estimate</span>
              <span className="xs:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mobile-card">
        <CardContent className="mobile-padding">
          <div className="mobile-form-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search estimates or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mobile-input pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mobile-input w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="mobile-input w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount-high">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-low">Amount (Low to High)</SelectItem>
                <SelectItem value="valid-until">Valid Until</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estimate Statistics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Total Estimates</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{estimates.length}</div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Draft Estimates</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {estimates.filter(est => est.status === EstimateStatus.DRAFT).length}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Approved Estimates</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {estimates.filter(est => est.status === EstimateStatus.APPROVED).length}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Converted</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {estimates.filter(est => est.status === EstimateStatus.CONVERTED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estimates Table */}
      <Card className="mobile-card">
        <CardHeader className="mobile-padding">
          <CardTitle className="mobile-h2">All Estimates ({filteredEstimates.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEstimates.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="mobile-text text-gray-500">No estimates found</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              ) : (
                <Link href="/dashboard/estimates/new">
                  <Button className="mt-4 mobile-button">Create Your First Estimate</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3 p-3">
                {filteredEstimates.map((estimate) => {
                  const status = getEstimateStatus(estimate)
                  return (
                    <div key={estimate.id} className={`mobile-table-card ${
                      status === 'expired' ? 'border-orange-200 bg-orange-50' : 
                      status === 'approved' ? 'border-green-200 bg-green-50' : 
                      status === 'converted' ? 'border-purple-200 bg-purple-50' : 
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <Link 
                          href={`/dashboard/estimates/${estimate.id}`} 
                          className="text-blue-600 hover:text-blue-800 font-semibold mobile-text"
                        >
                          {estimate.number}
                        </Link>
                        <Badge className={statusColors[status as keyof typeof statusColors]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Customer: </span>
                          <span>{estimate.customer?.displayName || 'No Customer'}</span>
                        </div>
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Amount: </span>
                          <span className="font-semibold">{estimate.currency} {estimate.total.toFixed(2)}</span>
                        </div>
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Valid Until: </span>
                          <span className={status === 'expired' ? 'text-orange-600 font-medium' : ''}>
                            {new Date(estimate.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="mobile-text text-gray-500">
                          Created: {new Date(estimate.issueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/estimates/${estimate.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          {estimate.status === EstimateStatus.DRAFT && (
                            <Link href={`/dashboard/estimates/${estimate.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          
                          {estimate.status === EstimateStatus.APPROVED && !estimate.convertedToInvoiceId && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleConvertToInvoice(estimate.id)}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden sm:block">
                <div className="responsive-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estimate #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstimates.map((estimate) => {
                        const status = getEstimateStatus(estimate)
                        return (
                          <TableRow key={estimate.id}>
                            <TableCell className="font-medium">
                              <Link href={`/dashboard/estimates/${estimate.id}`} className="text-blue-600 hover:text-blue-800">
                                {estimate.number}
                              </Link>
                            </TableCell>
                            <TableCell>{estimate.customer?.displayName || 'No Customer'}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[status as keyof typeof statusColors]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(estimate.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell className={status === 'expired' ? 'text-orange-600 font-medium' : ''}>
                              {new Date(estimate.validUntil).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {estimate.currency} {estimate.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Link href={`/dashboard/estimates/${estimate.id}`}>
                                  <Button variant="ghost" size="sm" className="touch-target">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                
                                {estimate.status === EstimateStatus.DRAFT && (
                                  <Link href={`/dashboard/estimates/${estimate.id}`}>
                                    <Button variant="ghost" size="sm" className="touch-target">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                                
                                {estimate.status === EstimateStatus.APPROVED && !estimate.convertedToInvoiceId && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="touch-target"
                                    onClick={() => handleConvertToInvoice(estimate.id)}
                                    title="Convert to Invoice"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}