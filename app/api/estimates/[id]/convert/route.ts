import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimate = await prisma.estimate.findFirst({
      where: {
        id: id,
        userId: user.id,
        status: 'APPROVED'
      },
      include: {
        items: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ 
        error: 'Estimate not found or not approved' 
      }, { status: 404 })
    }

    if (estimate.convertedToInvoiceId) {
      return NextResponse.json({ 
        error: 'Estimate already converted to invoice' 
      }, { status: 400 })
    }

    // Get next invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId: user.id },
      orderBy: { number: 'desc' }
    })

    let nextNumber = '#0001'
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.number.replace('#', ''))
      nextNumber = `#${(lastNumber + 1).toString().padStart(4, '0')}`
    }

    // Create invoice from estimate
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        customerId: estimate.customerId,
        number: nextNumber,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        currency: estimate.currency,
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        total: estimate.total,
        notes: estimate.notes,
        terms: estimate.terms,
        items: {
          create: estimate.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
        }
      },
      include: {
        customer: true,
        items: true
      }
    })

    // Update estimate to mark as converted
    await prisma.estimate.update({
      where: { id: id },
      data: {
        status: 'CONVERTED',
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date()
      }
    })

    const formattedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    }

    return NextResponse.json({
      message: 'Estimate converted to invoice successfully',
      invoice: formattedInvoice
    })
  } catch (error) {
    console.error('Error converting estimate to invoice:', error)
    return NextResponse.json(
      { error: 'Failed to convert estimate to invoice' },
      { status: 500 }
    )
  }
}