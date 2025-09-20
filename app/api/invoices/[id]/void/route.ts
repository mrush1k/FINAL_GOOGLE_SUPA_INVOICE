import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Find the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Don't allow voiding deleted invoices
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Business rules for voiding
    const cannotVoidStatuses = ['PAID', 'PARTIALLY_PAID', 'VOIDED']
    if (cannotVoidStatuses.includes(invoice.status)) {
      let errorMessage = 'Cannot void this invoice'
      
      if (invoice.status === 'VOIDED') {
        errorMessage = 'Invoice is already voided'
      } else if (invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID') {
        errorMessage = 'Cannot void paid invoices. Consider creating a credit note instead.'
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Warning if invoice has payments
    const hasPayments = invoice.payments && invoice.payments.length > 0
    if (hasPayments && !data.confirmWithPayments) {
      return NextResponse.json({ 
        error: 'This invoice has payments recorded. Voiding will not affect payment records.',
        requiresConfirmation: true 
      }, { status: 400 })
    }

    // Start transaction for atomic void operation
    const result = await prisma.$transaction(async (tx) => {
      // Update invoice status and void fields
      const voidedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedBy: user.id,
          voidReason: data.reason || null,
          updatedAt: new Date(),
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      })

      // Create audit log entry
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId: id,
          userId: user.id,
          action: 'VOIDED',
          reason: data.reason || null,
          oldStatus: invoice.status,
          newStatus: 'VOIDED',
        },
      })

      return voidedInvoice
    })

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...result,
      subtotal: Number(result.subtotal),
      taxAmount: Number(result.taxAmount),
      total: Number(result.total),
      items: result.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: result.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json({
      message: 'Invoice voided successfully',
      invoice: serializedInvoice,
      hasPaymentsWarning: hasPayments,
    })
  } catch (error) {
    console.error('Error voiding invoice:', error)
    return NextResponse.json(
      { error: 'Failed to void invoice' },
      { status: 500 }
    )
  }
}