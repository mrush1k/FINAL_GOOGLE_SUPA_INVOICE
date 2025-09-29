"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Lazy-load UI and icon components to reduce initial JS bundle
const Button = dynamic(() => import('@/components/ui/button').then(m => m.Button), { ssr: false })
const Card = dynamic(() => import('@/components/ui/card').then(m => m.Card), { ssr: false })
const CardContent = dynamic(() => import('@/components/ui/card').then(m => m.CardContent), { ssr: false })
const CardHeader = dynamic(() => import('@/components/ui/card').then(m => m.CardHeader), { ssr: false })
const CardTitle = dynamic(() => import('@/components/ui/card').then(m => m.CardTitle), { ssr: false })
const Table = dynamic(() => import('@/components/ui/table').then(m => m.Table), { ssr: false })
const TableBody = dynamic(() => import('@/components/ui/table').then(m => m.TableBody), { ssr: false })
const TableCell = dynamic(() => import('@/components/ui/table').then(m => m.TableCell), { ssr: false })
const TableHead = dynamic(() => import('@/components/ui/table').then(m => m.TableHead), { ssr: false })
const TableHeader = dynamic(() => import('@/components/ui/table').then(m => m.TableHeader), { ssr: false })
const TableRow = dynamic(() => import('@/components/ui/table').then(m => m.TableRow), { ssr: false })
const Badge = dynamic(() => import('@/components/ui/badge').then(m => m.Badge), { ssr: false })

const Plus = dynamic(() => import('lucide-react').then(m => m.Plus), { ssr: false })
const AlertCircle = dynamic(() => import('lucide-react').then(m => m.AlertCircle), { ssr: false })
const CheckCircle = dynamic(() => import('lucide-react').then(m => m.CheckCircle), { ssr: false })
const FileText = dynamic(() => import('lucide-react').then(m => m.FileText), { ssr: false })
const Users = dynamic(() => import('lucide-react').then(m => m.Users), { ssr: false })
const DollarSign = dynamic(() => import('lucide-react').then(m => m.DollarSign), { ssr: false })
const Calendar = dynamic(() => import('lucide-react').then(m => m.Calendar), { ssr: false })
const Mic = dynamic(() => import('lucide-react').then(m => m.Mic), { ssr: false })
const Mail = dynamic(() => import('lucide-react').then(m => m.Mail), { ssr: false })
const Download = dynamic(() => import('lucide-react').then(m => m.Download), { ssr: false })
import { format, isPast, parseISO } from 'date-fns'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import { OnboardingFlow } from '@/components/onboarding-flow'
import { useAuth } from '@/lib/auth-context'
import { Invoice, InvoiceStatus } from '@/lib/types'

export default function DashboardPage() {
  const { user, userProfile, getAuthHeaders } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user])

  const fetchInvoices = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', { headers })
      if (response.ok) {
        const data = await response.json()
        
        // Validate invoice data structure and filter out invalid ones
        const validInvoices = data.filter((invoice: any) => {
          if (!invoice.status) {
            console.warn('Invoice missing status:', invoice.id)
            return false
          }
          return true
        })
        
        console.log('Fetched invoices:', validInvoices.length, 'valid out of', data.length, 'total')
        setInvoices(validInvoices)
      } else {
        console.error('Failed to fetch invoices:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const overdueInvoices = invoices.filter(invoice => {
    // Skip invoices with invalid status
    if (!invoice.status) {
      console.warn('Invoice with missing status:', invoice.id)
      return false
    }
    
    const isOverdue = isPast(parseISO(invoice.dueDate.toString())) && 
                     ![InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.CANCELLED].includes(invoice.status)
    return isOverdue || invoice.status === InvoiceStatus.OVERDUE
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const paidInvoices = invoices.filter(invoice => 
    invoice.status && [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID].includes(invoice.status)
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const totalOutstanding = overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const totalCustomers = new Set(invoices.map(invoice => invoice.customerId)).size

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const },
      [InvoiceStatus.SENT]: { label: 'Sent', variant: 'default' as const },
      [InvoiceStatus.APPROVED]: { label: 'Approved', variant: 'default' as const },
      [InvoiceStatus.PAID]: { label: 'Paid', variant: 'default' as const },
      [InvoiceStatus.PARTIALLY_PAID]: { label: 'Partially Paid', variant: 'default' as const },
      [InvoiceStatus.OVERDUE]: { label: 'Overdue', variant: 'destructive' as const },
      [InvoiceStatus.CANCELLED]: { label: 'Cancelled', variant: 'secondary' as const },
    }
    
    const config = statusConfig[status]
    
    // Add fallback for undefined or unknown status
    if (!config) {
      console.warn('Unknown invoice status:', status, 'Type:', typeof status)
      return <Badge variant="secondary" className="text-xs">Unknown</Badge>
    }
    
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
  }

  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyUtil(amount, currency || userProfile?.currency || 'USD')
  }

  if (loading) {
    return (
      <div className="container-mobile">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      <OnboardingFlow />
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          {userProfile?.businessName && (
            <p className="text-lg sm:text-xl text-gray-600 mt-1">
              Welcome {userProfile.businessName}! 👋
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard/invoices/voice" prefetch className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto touch-target">
              <Mic className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Voice Invoice</span>
              <span className="xs:hidden">Voice</span>
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new" prefetch className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto touch-target">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">New Invoice</span>
              <span className="xs:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueInvoices.length} overdue
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} paid
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Customers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices */}
      <Card>
        <CardHeader className="bg-red-50 border-b p-3 sm:p-6">
          <CardTitle className="flex items-center text-red-700 text-sm sm:text-base">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Overdue Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overdueInvoices.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">
              No overdue invoices
            </div>
          ) : (
            <div className="responsive-table">
              <div className="block sm:hidden">
                {/* Mobile Card Layout */}
                <div className="space-y-3 p-3">
                  {overdueInvoices.map((invoice) => (
                    <div key={invoice.id} className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {invoice.number}
                        </Link>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {invoice.customer?.displayName}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-red-600 text-sm flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(invoice.dueDate), 'MMM dd')}
                        </div>
                        <div className="font-medium text-red-600">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount Owing</TableHead>
                      <TableHead className="text-center w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.customer?.displayName}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Link href={`/dashboard/invoices/${invoice.id}`} title="Record Payment">
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <DollarSign className="w-3 h-3" />
                                <span className="sr-only">Record Payment</span>
                              </Button>
                            </Link>
                            <Link href={`/dashboard/invoices/${invoice.id}`} title="Email Invoice">
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <Mail className="w-3 h-3" />
                                <span className="sr-only">Email Invoice</span>
                              </Button>
                            </Link>
                            <Link href={`/dashboard/invoices/${invoice.id}`} title="Download PDF">
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <Download className="w-3 h-3" />
                                <span className="sr-only">Download PDF</span>
                              </Button>
                            </Link>
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

      {/* Paid Invoices */}
      <Card>
        <CardHeader className="bg-green-50 border-b p-3 sm:p-6">
          <CardTitle className="flex items-center text-green-700 text-sm sm:text-base">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Paid Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paidInvoices.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">
              No paid invoices yet
            </div>
          ) : (
            <div className="responsive-table">
              <div className="block sm:hidden">
                {/* Mobile Card Layout */}
                <div className="space-y-3 p-3">
                  {paidInvoices.slice(0, 10).map((invoice) => (
                    <div key={invoice.id} className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {invoice.number}
                        </Link>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {invoice.customer?.displayName}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-green-600 text-sm flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(invoice.updatedAt), 'MMM dd')}
                        </div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Date Paid</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidInvoices.slice(0, 10).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(invoice.updatedAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.customer?.displayName}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(invoice.total, invoice.currency)}
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