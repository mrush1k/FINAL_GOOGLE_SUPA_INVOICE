"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Invoice, InvoiceStatus } from '@/lib/types'
import { 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Users, 
  DollarSign,
  Calendar,
  Mic
} from 'lucide-react'
import Link from 'next/link'
import { format, isPast, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { user, getAuthHeaders } = useAuth()
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
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const overdueInvoices = invoices.filter(invoice => {
    const isOverdue = isPast(parseISO(invoice.dueDate.toString())) && 
                     ![InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.CANCELLED].includes(invoice.status)
    return isOverdue || invoice.status === InvoiceStatus.OVERDUE
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const paidInvoices = invoices.filter(invoice => 
    [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID].includes(invoice.status)
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
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard/invoices/voice" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto touch-target">
              <Mic className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Voice Invoice</span>
              <span className="xs:hidden">Voice</span>
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutstanding, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueInvoices.length} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices */}
      <Card>
        <CardHeader className="bg-red-50 border-b">
          <CardTitle className="flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            Overdue Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overdueInvoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No overdue invoices
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount Owing</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paid Invoices */}
      <Card>
        <CardHeader className="bg-green-50 border-b">
          <CardTitle className="flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            Paid Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paidInvoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No paid invoices yet
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}