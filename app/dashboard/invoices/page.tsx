"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Eye, Edit, Download, Mail, Mic, Wifi, WifiOff, Trash2 } from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Invoice, InvoiceStatus } from '@/lib/types'
import { getWebSocketClient, WebSocketMessage } from '@/lib/websocket-client'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800', 
  approved: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  'partially-paid': 'bg-orange-100 text-orange-800',
  voided: 'bg-red-100 text-red-800 border-red-200'
}

export default function InvoicesPage() {
  const { user, getAuthHeaders } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isRealTimeActive, setIsRealTimeActive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [trackingActivity, setTrackingActivity] = useState<string>('')
  const [errorCount, setErrorCount] = useState(0)
  const [wsConnected, setWsConnected] = useState(false)
  const [useWebSocket, setUseWebSocket] = useState(true)
  const lastWsErrorAt = useRef<number | null>(null)
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [deleteConfirmWithPayments, setDeleteConfirmWithPayments] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchInvoices()
      setIsRealTimeActive(true)
      
      // Initialize WebSocket connection
      if (useWebSocket) {
        initializeWebSocket()
      }
    }
  }, [user])

  const initializeWebSocket = async () => {
    try {
      const wsClient = getWebSocketClient()
      if (wsClient && user) {
        setTrackingActivity('Connecting to real-time updates...')
        
        await wsClient.connect(user.id)
        setWsConnected(true)
        setTrackingActivity('Real-time connection established!')
        
        // Subscribe to invoice updates
        wsClient.subscribe('invoice-list', handleWebSocketMessage)
        
        setTimeout(() => setTrackingActivity(''), 3000)
      }
    } catch (error) {
      // Rate-limit noisy WebSocket error logs to once every 30s
      const now = Date.now()
      if (!lastWsErrorAt.current || now - lastWsErrorAt.current > 30000) {
        console.warn('WebSocket connection failed (will fallback to polling):', error)
        lastWsErrorAt.current = now
      }
      setWsConnected(false)
      setUseWebSocket(false)
      setTrackingActivity('Using enhanced polling for real-time updates')
      setTimeout(() => setTrackingActivity(''), 3000)
    }
  }

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === 'invoice_update' || message.type === 'email_tracking') {
      setTrackingActivity(`Live update: ${message.type.replace('_', ' ')}`)
      fetchInvoices(true)
      
      setTimeout(() => setTrackingActivity(''), 2000)
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    let activityTimeout: NodeJS.Timeout | null = null
    
    if (user && isRealTimeActive && !wsConnected) {
      // Use enhanced polling (15 seconds) when WebSocket is not available
      const pollingInterval = wsConnected ? 60000 : 15000 // 1 minute if WS connected, 15 seconds if not
      
      intervalId = setInterval(() => {
        if (!wsConnected) {
          setTrackingActivity('Checking for updates...')
        }
        fetchInvoices(true) // Silent fetch without loading state
        
        // Clear activity message after 2 seconds
        if (!wsConnected) {
          activityTimeout = setTimeout(() => {
            setTrackingActivity('')
          }, 2000)
        }
      }, pollingInterval)
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
    }
  }, [user, isRealTimeActive, wsConnected])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      const wsClient = getWebSocketClient()
      if (wsClient) {
        try {
          wsClient.unsubscribe('invoice-list')
          // Ensure the client fully disconnects to stop reconnection attempts
          wsClient.disconnect()
        } catch (e) {
          // swallow errors during unmount
        }
      }
    }
  }, [])

  const fetchInvoices = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true)
      
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', { 
        headers,
        cache: 'no-cache' // Ensure fresh data for real-time tracking
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Reset error count on successful fetch
        setErrorCount(0)
        
        // Check if data has changed for real-time indicator
        setInvoices(prev => {
          const hasChanges = JSON.stringify(prev) !== JSON.stringify(data)
          if (hasChanges && silent) {
            setLastUpdate(new Date())
            setTrackingActivity('Changes detected!')
            
            // Show activity for 3 seconds
            setTimeout(() => {
              setTrackingActivity('')
            }, 3000)
          }
          return data
        })
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setErrorCount(prev => prev + 1)
      
      // If too many errors, pause real-time tracking
      if (errorCount >= 3 && silent) {
        setIsRealTimeActive(false)
        setTrackingActivity('Tracking paused due to errors')
        
        setTimeout(() => {
          setTrackingActivity('')
        }, 5000)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [getAuthHeaders, errorCount])

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIALLY_PAID) {
      return invoice.status.toLowerCase().replace('_', '-')
    }
    
    if (invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.APPROVED) {
      const dueDate = new Date(invoice.dueDate)
      const today = new Date()
      
      if (dueDate < today) {
        return 'overdue'
      }
    }
    
    return invoice.status.toLowerCase()
  }

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || getInvoiceStatus(invoice) === statusFilter
      
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
        case 'due-date':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        default:
          return 0
      }
    })

  const handleSendEmail = async (invoiceId: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        // Immediate update for better UX
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId ? { 
            ...inv, 
            status: InvoiceStatus.SENT,
            lastEmailSentAt: new Date(),
            emailCount: (inv.emailCount || 0) + 1
          } : inv
        ))
        
        // Show tracking activity
        setTrackingActivity('Email sent! Updating tracking...')
        
        // Force refresh to get updated tracking data
        setTimeout(() => {
          fetchInvoices(true)
          setTimeout(() => setTrackingActivity(''), 2000)
        }, 1000)
      }
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, { headers })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoices.find(inv => inv.id === invoiceId)?.number}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }
  
  // Show delete confirmation dialog
  const confirmDelete = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    
    // Check if invoice can be deleted based on status
    const canDeleteStatuses = ['DRAFT', 'VOIDED']
    if (invoice && !canDeleteStatuses.includes(invoice.status)) {
      let errorMessage = 'Cannot delete this invoice'
      
      if (['SENT', 'APPROVED', 'OVERDUE'].includes(invoice.status)) {
        errorMessage = 'Cannot delete sent invoices. You can void the invoice instead.'
      } else if (['PAID', 'PARTIALLY_PAID'].includes(invoice.status)) {
        errorMessage = 'Cannot delete paid invoices. Consider voiding first or creating a credit note.'
      }
      
      setDeleteError(errorMessage)
      setDeleteDialogOpen(true)
      return
    }
    
    // Set invoice to delete and open dialog
    setInvoiceToDelete(invoiceId)
    setDeleteError(null)
    setDeleteConfirmWithPayments(false)
    setDeleteDialogOpen(true)
  }
  
  // Handle actual invoice deletion
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return
    
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoiceToDelete}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmWithPayments: deleteConfirmWithPayments
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Remove the invoice from the list
        setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceToDelete))
        setTrackingActivity('Invoice deleted successfully')
        setTimeout(() => setTrackingActivity(''), 3000)
        setDeleteDialogOpen(false)
      } else if (response.status === 400 && data.requiresConfirmation) {
        // Need confirmation for invoice with payments
        setDeleteError(data.error)
        setDeleteConfirmWithPayments(true)
      } else {
        // Other error
        setDeleteError(data.error || 'Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      setDeleteError('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="mobile-h1">Invoices</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-500 animate-pulse' :
                isRealTimeActive ? 'bg-green-500 animate-pulse' : 
                errorCount > 0 ? 'bg-orange-500' : 'bg-gray-300'
              }`}></div>
              <div className="flex items-center gap-1">
                {wsConnected ? <Wifi className="w-3 h-3 text-emerald-600" /> : 
                 isRealTimeActive ? <Wifi className="w-3 h-3 text-green-600" /> : 
                 <WifiOff className="w-3 h-3 text-gray-500" />}
                <span className="text-xs text-gray-500">
                  {wsConnected ? 'Real-time' : 
                   isRealTimeActive ? 'Enhanced Polling' : 
                   errorCount > 0 ? 'Connection Issues' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <p className="mobile-text text-gray-600">
            Manage and track all your invoices
            <span className="block mt-1 text-xs">
              {trackingActivity && (
                <span className="text-blue-600 font-medium animate-pulse">
                  {trackingActivity}
                </span>
              )}
              {!trackingActivity && lastUpdate && (
                <span className="text-green-600">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              {!trackingActivity && !lastUpdate && isRealTimeActive && (
                <span className="text-gray-500">
                  Monitoring for changes...
                </span>
              )}
            </span>
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard/invoices/voice" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto mobile-button">
              <Mic className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Voice Invoice</span>
              <span className="xs:hidden">Voice</span>
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto mobile-button">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">New Invoice</span>
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
                  placeholder="Search invoices or customers..."
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
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially-paid">Partially Paid</SelectItem>
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
                <SelectItem value="due-date">Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Draft Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {invoices.filter(inv => inv.status === InvoiceStatus.DRAFT).length}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {invoices.filter(inv => getInvoiceStatus(inv) === 'overdue').length}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="mobile-text font-medium text-gray-600">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {invoices.filter(inv => inv.status === InvoiceStatus.PAID).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="mobile-card">
        <CardHeader className="mobile-padding">
          <CardTitle className="mobile-h2">All Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="mobile-text text-gray-500">No invoices found</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              ) : (
                <Link href="/dashboard/invoices/new">
                  <Button className="mt-4 mobile-button">Create Your First Invoice</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3 p-3">
                {filteredInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice)
                  return (
                    <Link 
                      key={invoice.id} 
                      href={`/dashboard/invoices/${invoice.id}`}
                      className={`block mobile-table-card hover:shadow-md transition-shadow cursor-pointer ${
                        status === 'overdue' ? 'border-red-200 bg-red-50 hover:bg-red-100' : 
                        status === 'paid' ? 'border-green-200 bg-green-50 hover:bg-green-100' : 
                        'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-blue-600 font-semibold mobile-text">
                          {invoice.number}
                        </div>
                        <Badge className={statusColors[status as keyof typeof statusColors]}>
                          {status === 'voided' ? 'VOIDED' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Customer: </span>
                          <span>{invoice.customer?.displayName || 'No Customer'}</span>
                        </div>
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Amount: </span>
                          <span className="font-semibold">{invoice.currency} {invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="mobile-text">
                          <span className="font-medium text-gray-700">Due: </span>
                          <span className={status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        {invoice.lastEmailSentAt && (
                          <div className="mobile-text">
                            <span className="font-medium text-gray-700">Last Emailed: </span>
                            <span className="text-green-600">
                              {new Date(invoice.lastEmailSentAt).toLocaleDateString()}
                              {invoice.emailCount && invoice.emailCount > 1 && ` (${invoice.emailCount}x)`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="mobile-text text-gray-500">
                          Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {invoice.status === InvoiceStatus.DRAFT && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownloadPDF(invoice.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          {invoice.status !== InvoiceStatus.DRAFT && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSendEmail(invoice.id)}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(invoice.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden sm:block">
                <div className="responsive-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const status = getInvoiceStatus(invoice)
                        return (
                          <TableRow 
                            key={invoice.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                          >
                            <TableCell className="font-medium">
                              <div className="text-blue-600">
                                {invoice.number}
                              </div>
                            </TableCell>
                            <TableCell>{invoice.customer?.displayName || 'No Customer'}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[status as keyof typeof statusColors]}>
                                {status === 'voided' ? 'VOIDED' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell className={status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {invoice.currency} {invoice.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="touch-target"
                                  onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                {invoice.status === InvoiceStatus.DRAFT && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="touch-target"
                                    onClick={() => window.location.href = `/dashboard/invoices/${invoice.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="touch-target"
                                  onClick={() => handleDownloadPDF(invoice.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                
                                {invoice.status !== InvoiceStatus.DRAFT && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="touch-target"
                                    onClick={() => handleSendEmail(invoice.id)}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="touch-target text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(invoice.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError && !deleteConfirmWithPayments ? "Cannot Delete Invoice" : "Permanently Delete Invoice"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <div className="text-red-500">
                  {deleteError}
                </div>
              ) : (
                <>
                  This action cannot be undone. This will permanently delete the invoice
                  and remove it from our servers.
                  
                  {deleteConfirmWithPayments && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="font-medium text-amber-700">Warning: This invoice has payment records</p>
                      <p className="text-amber-600 text-sm mt-1">
                        Deleting will hide the invoice but preserve payment history for audit purposes.
                      </p>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {(deleteError && !deleteConfirmWithPayments) ? (
              <AlertDialogAction onClick={() => setDeleteDialogOpen(false)}>
                OK
              </AlertDialogAction>
            ) : (
              <AlertDialogAction 
                onClick={handleDeleteInvoice}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteConfirmWithPayments ? "Confirm Delete" : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}