import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: id,
        userId: user.id,
        deletedAt: null // Only show non-deleted invoices
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Verify the invoice belongs to the user
    const existingInvoice = await prisma.invoice.findUnique({
      where: { 
        id: id,
        userId: user.id 
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: id },
      data: {
        status: data.status,
        ...data,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...updatedInvoice,
      subtotal: Number(updatedInvoice.subtotal),
      taxAmount: Number(updatedInvoice.taxAmount),
      total: Number(updatedInvoice.total),
      items: updatedInvoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: updatedInvoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await request.json().catch(() => ({}))

    // Find the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Don't allow deleting already deleted invoices
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Business rules for deletion
    const canDeleteStatuses = ['DRAFT', 'VOIDED']
    if (!canDeleteStatuses.includes(invoice.status)) {
      let errorMessage = 'Cannot delete this invoice'
      
      if (['SENT', 'APPROVED', 'OVERDUE'].includes(invoice.status)) {
        errorMessage = 'Cannot delete sent invoices. You can void the invoice instead.'
      } else if (['PAID', 'PARTIALLY_PAID'].includes(invoice.status)) {
        errorMessage = 'Cannot delete paid invoices. Consider voiding first or creating a credit note.'
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Warning if invoice has payments (even for VOIDED invoices)
    const hasPayments = invoice.payments && invoice.payments.length > 0
    if (hasPayments && !requestData.confirmWithPayments) {
      return NextResponse.json({ 
        error: 'This invoice has payment records. Deleting will hide the invoice but preserve payment history for audit purposes.',
        requiresConfirmation: true 
      }, { status: 400 })
    }

    // Perform soft delete with audit trail
    const result = await prisma.$transaction(async (tx) => {
      // Soft delete the invoice (preserves all data for audit)
      const deletedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
          deleteReason: requestData.reason || null,
          updatedAt: new Date(),
        },
      })

      // Create audit log entry
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId: id,
          userId: user.id,
          action: 'DELETED',
          reason: requestData.reason || null,
          oldStatus: invoice.status,
          newStatus: 'DELETED',
        },
      })

      return deletedInvoice
    })

    return NextResponse.json({
      message: 'Invoice deleted successfully',
      hasPaymentsWarning: hasPayments,
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}