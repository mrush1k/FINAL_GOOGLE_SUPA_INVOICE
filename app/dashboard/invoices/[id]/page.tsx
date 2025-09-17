"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { 
  ArrowLeft, 
  Send, 
  Edit, 
  Save, 
  X, 
  DollarSign, 
  CalendarIcon,
  FileText,
  Download,
  Mail,
  Ban,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Invoice, InvoiceStatus } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { generateInvoicePDF, generateReceiptPDF } from '@/lib/pdf-generator'
import { EmailTrackingStatus } from '@/components/email-tracking-status'
import Link from 'next/link'

const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Stripe',
  'Other'
]

// Map frontend display values to database enum values
const mapPaymentMethodToEnum = (displayMethod: string): string => {
  const mapping: { [key: string]: string } = {
    'Cash': 'CASH',
    'Check': 'CHECK',
    'Bank Transfer': 'BANK_TRANSFER',
    'Credit Card': 'CREDIT_CARD',
    'Debit Card': 'CREDIT_CARD', // Map debit card to credit card enum value
    'PayPal': 'PAYPAL',
    'Stripe': 'STRIPE',
    'Other': 'OTHER'
  }
  return mapping[displayMethod] || displayMethod
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)
  
  // Payment form state
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  // Edit form state
  const [editForm, setEditForm] = useState({
    invoiceDate: new Date(),
    dueDate: new Date(),
    poNumber: '',
    notes: '',
    paymentInstructions: '',
  })

  // Email form state
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    ccEmails: '',
    message: '',
  })

  useEffect(() => {
    if (user && params.id) {
      fetchInvoice()
    }
  }, [user, params.id])

  const fetchInvoice = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${params.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
        setPaymentAmount(data.total.toString())
        // Initialize edit form with current invoice data
        setEditForm({
          invoiceDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          poNumber: data.poNumber || '',
          notes: data.notes || '',
          paymentInstructions: data.paymentInstructions || '',
        })
        // Initialize email form with customer email
        setEmailForm({
          recipientEmail: data.customer?.email || '',
          ccEmails: data.ccEmails || '',
          message: '',
        })
      } else if (response.status === 404) {
        toast({
          title: "Error",
          description: "Invoice not found",
          variant: "destructive",
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (status: InvoiceStatus) => {
    if (!invoice) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setInvoice({ ...invoice, status })
        toast({
          title: "Success",
          description: `Invoice marked as ${status.toLowerCase()}`,
        })
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      })
    }
  }

  const recordPayment = async () => {
    if (!invoice || !paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all payment details",
        variant: "destructive",
      })
      return
    }

    try {
      const amount = parseFloat(paymentAmount)
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          paymentDate: paymentDate.toISOString(),
          method: mapPaymentMethodToEnum(paymentMethod),
        }),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoice(updatedInvoice)
        setShowPaymentModal(false)
        
        // Show success toast with receipt option
        toast({
          title: "Success",
          description: "Payment recorded successfully",
        })

        // Offer to download receipt
        setTimeout(() => {
          if (confirm('Would you like to download a receipt for this payment?')) {
            downloadReceiptPDF({
              amount,
              paymentDate: paymentDate.toISOString(),
              method: paymentMethod
            })
          }
        }, 500)

        setPaymentAmount('')
        setPaymentMethod('')
        setPaymentDate(new Date())
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      })
    }
  }

  const markAsPaid = async () => {
    if (!invoice) return

    setMarkingPaid(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: invoice.total - getTotalPaid(),
          paymentDate: new Date().toISOString(),
          method: 'OTHER',
        }),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoice(updatedInvoice)
        
        toast({
          title: "Success",
          description: "Invoice marked as paid",
        })
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      })
    } finally {
      setMarkingPaid(false)
    }
  }

  const saveEditChanges = async () => {
    if (!invoice) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          issueDate: editForm.invoiceDate.toISOString(),
          dueDate: editForm.dueDate.toISOString(),
          poNumber: editForm.poNumber || null,
          notes: editForm.notes || null,
          paymentInstructions: editForm.paymentInstructions || null,
        }),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoice(updatedInvoice)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        })
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      })
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    // Reset form to original values
    if (invoice) {
      setEditForm({
        invoiceDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        poNumber: invoice.poNumber || '',
        notes: invoice.notes || '',
        paymentInstructions: invoice.paymentInstructions || '',
      })
    }
  }

  const downloadInvoicePDF = () => {
    if (!invoice || !userProfile) return
    
    try {
      const pdf = generateInvoicePDF(invoice, userProfile)
      pdf.save(`Invoice-${invoice.number}.pdf`)
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const downloadReceiptPDF = (payment: { amount: number; paymentDate: string; method: string }) => {
    if (!invoice || !userProfile) return
    
    try {
      const pdf = generateReceiptPDF(invoice, userProfile, payment)
      pdf.save(`Receipt-${invoice.number}-${new Date(payment.paymentDate).toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Success",
        description: "Receipt PDF downloaded successfully",
      })
    } catch (error) {
      console.error('Error generating receipt PDF:', error)
      toast({
        title: "Error",
        description: "Failed to generate receipt PDF",
        variant: "destructive",
      })
    }
  }

  const sendInvoiceEmail = async () => {
    if (!invoice || !emailForm.recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      })
      return
    }

    // Validate CC emails if provided
    if (emailForm.ccEmails) {
      const ccEmails = emailForm.ccEmails.split(',').map(email => email.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = ccEmails.filter(email => !emailRegex.test(email))
      
      if (invalidEmails.length > 0) {
        toast({
          title: "Error",
          description: `Invalid CC email addresses: ${invalidEmails.join(', ')}`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientEmail: emailForm.recipientEmail,
          ccEmails: emailForm.ccEmails,
          message: emailForm.message,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Save CC emails to invoice
        if (emailForm.ccEmails) {
          const updateResponse = await fetch(`/api/invoices/${invoice.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              ccEmails: emailForm.ccEmails,
            }),
          })
        }
        
        // Refresh invoice data to get updated status
        await fetchInvoice()
        
        setShowEmailModal(false)
        setEmailForm({ recipientEmail: '', ccEmails: '', message: '' })
        
        toast({
          title: "Success",
          description: `Invoice sent successfully to ${result.sentTo}${result.statusUpdated ? ' and status updated to Sent' : ''}`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending invoice email:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not send invoice. Please check email address or connection.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      [InvoiceStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const },
      [InvoiceStatus.SENT]: { label: 'Sent', variant: 'default' as const },
      [InvoiceStatus.READ]: { label: 'Read', variant: 'default' as const },
      [InvoiceStatus.APPROVED]: { label: 'Approved', variant: 'default' as const },
      [InvoiceStatus.PAID]: { label: 'Paid', variant: 'default' as const },
      [InvoiceStatus.PARTIALLY_PAID]: { label: 'Partially Paid', variant: 'default' as const },
      [InvoiceStatus.OVERDUE]: { label: 'Overdue', variant: 'destructive' as const },
      [InvoiceStatus.CANCELLED]: { label: 'Cancelled', variant: 'secondary' as const },
      [InvoiceStatus.VOIDED]: { label: 'Voided', variant: 'destructive' as const },
    }
    
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, invoice?.currency || userProfile?.currency || 'USD')
  }

  const getTotalPaid = () => {
    if (!invoice?.payments) return 0
    return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getAmountDue = () => {
    if (!invoice) return 0
    return invoice.total - getTotalPaid()
  }

  const canVoidInvoice = (invoice: Invoice) => {
    const voidableStatuses = [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.READ, InvoiceStatus.APPROVED, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED]
    return voidableStatuses.includes(invoice.status) && !invoice.voidedAt
  }

  const canDeleteInvoice = (invoice: Invoice) => {
    const deletableStatuses = [InvoiceStatus.DRAFT, InvoiceStatus.VOIDED]
    return deletableStatuses.includes(invoice.status) && !invoice.deletedAt
  }

  const handleVoidInvoice = async () => {
    if (!invoice) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}/void`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          reason: voidReason || null,
          confirmWithPayments: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInvoice(result.invoice)
        setShowVoidModal(false)
        setVoidReason('')
        
        toast({
          title: "Success",
          description: `Invoice ${invoice.number} has been voided${result.hasPaymentsWarning ? '. Payment records are preserved.' : ''}.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to void invoice",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error voiding invoice:', error)
      toast({
        title: "Error",
        description: "Failed to void invoice",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInvoice = async () => {
    if (!invoice) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ 
          reason: deleteReason || null,
          confirmWithPayments: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowDeleteModal(false)
        setDeleteReason('')
        
        toast({
          title: "Success",
          description: `Invoice ${invoice.number} has been deleted${result.hasPaymentsWarning ? '. Payment records are preserved for audit.' : ''}.`,
        })
        
        // Redirect back to dashboard
        router.push('/dashboard')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete invoice",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container-mobile">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container-mobile">
        <div className="text-center space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoice Not Found</h1>
          <Link href="/dashboard">
            <Button className="touch-target">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile space-y-4 sm:space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {/* Back button and Invoice Info */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="touch-target w-fit">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden xs:inline">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Invoice {invoice.number}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              {getStatusBadge(invoice.status)}
              <span className="text-xs sm:text-sm text-gray-500">
                {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={saveEditChanges}
                disabled={loading}
                className="touch-target col-span-1"
              >
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button
                variant="outline"
                onClick={cancelEdit}
                className="touch-target col-span-1"
              >
                <X className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            </>
          ) : (
            <>
              {invoice.status === InvoiceStatus.DRAFT && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="touch-target col-span-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    onClick={() => updateInvoiceStatus(InvoiceStatus.SENT)}
                    className="touch-target col-span-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Send Invoice</span>
                    <span className="sm:hidden">Send</span>
                  </Button>
                </>
              )}
              
              {[InvoiceStatus.SENT, InvoiceStatus.READ, InvoiceStatus.APPROVED, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID].includes(invoice.status) && (
                <>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="touch-target col-span-1"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Record Payment</span>
                    <span className="sm:hidden">Payment</span>
                  </Button>
                  {getAmountDue() > 0 && (
                    <Button
                      onClick={markAsPaid}
                      disabled={markingPaid}
                      variant="outline"
                      className="touch-target col-span-1"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{markingPaid ? 'Marking...' : 'Mark as Paid'}</span>
                      <span className="sm:hidden">{markingPaid ? '...' : 'Paid'}</span>
                    </Button>
                  )}
                </>
              )}
              
              <Button 
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                disabled={!invoice.customer?.email}
                className="touch-target col-span-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Email Invoice</span>
                <span className="sm:hidden">Email</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={downloadInvoicePDF}
                className="touch-target col-span-1"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              
              {canVoidInvoice(invoice) && (
                <Button
                  variant="outline"
                  onClick={() => setShowVoidModal(true)}
                  className="touch-target col-span-1"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Void Invoice</span>
                  <span className="sm:hidden">Void</span>
                </Button>
              )}
              
              {canDeleteInvoice(invoice) && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="touch-target col-span-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete Invoice</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="mt-1">{invoice.customer?.displayName}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Invoice Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editForm.invoiceDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.invoiceDate ? format(editForm.invoiceDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editForm.invoiceDate}
                          onSelect={(date) => date && setEditForm(prev => ({ ...prev, invoiceDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="mt-1">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !editForm.dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.dueDate ? format(editForm.dueDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editForm.dueDate}
                          onSelect={(date) => date && setEditForm(prev => ({ ...prev, dueDate: date }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="mt-1">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Currency</Label>
                  <p className="mt-1">{invoice.currency}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.poNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="Optional"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{invoice.poNumber || 'N/A'}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes for the customer"
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{invoice.notes || 'No notes'}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Payment Instructions</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.paymentInstructions}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                    placeholder="e.g., Bank account details, payment terms, etc."
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{invoice.paymentInstructions || 'No payment instructions'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-3 space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxInclusive ? 'Inclusive' : 'Exclusive'}):</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-24">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReceiptPDF({
                              amount: payment.amount,
                              paymentDate: payment.paymentDate.toString(),
                              method: payment.paymentMethod
                            })}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoice Summary Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-4 mb-4">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(getTotalPaid())}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Amount Due:</span>
                    <span className="font-bold text-lg text-red-600">{formatCurrency(getAmountDue())}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <h4 className="font-medium mb-2">Customer Details:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{invoice.customer?.displayName}</p>
                  {invoice.customer?.email && <p>{invoice.customer.email}</p>}
                  {invoice.customer?.phone && <p>{invoice.customer.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Tracking Status */}
          <EmailTrackingStatus invoice={invoice} />
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Record Payment
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => date && setPaymentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Amount Received</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-4 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={recordPayment}
                  className="flex-1"
                >
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Email Invoice
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <Label htmlFor="ccEmails">CC (Optional)</Label>
                <Input
                  id="ccEmails"
                  type="text"
                  value={emailForm.ccEmails}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, ccEmails: e.target.value }))}
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <Label htmlFor="emailMessage">Message (Optional)</Label>
                <Textarea
                  id="emailMessage"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message to include with the invoice..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-4 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendInvoiceEmail}
                  className="flex-1"
                  disabled={!emailForm.recipientEmail}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Void Invoice Modal */}
      <AlertDialog open={showVoidModal} onOpenChange={setShowVoidModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice {invoice.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the invoice as voided. The invoice will be kept for audit purposes but cannot be sent or edited.
              {invoice.payments && invoice.payments.length > 0 && 
                " This invoice has payments recorded. Voiding will not affect the payment records."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="void-reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="void-reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Optional reason for voiding..."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowVoidModal(false)
              setVoidReason('')
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVoidInvoice}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="w-4 h-4 mr-2" />
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Invoice Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice {invoice.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the invoice from your active invoices. The invoice data will be preserved for audit purposes but will no longer be visible in your dashboard.
              {invoice.payments && invoice.payments.length > 0 && 
                " Payment records will be preserved for audit purposes."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delete-reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Optional reason for deletion..."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteModal(false)
              setDeleteReason('')
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}