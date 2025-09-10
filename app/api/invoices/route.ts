import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { 
        userId: user.id,
        deletedAt: null // Only show non-deleted invoices
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert Decimal to number for JSON serialization
    const serializedInvoices = invoices.map(invoice => ({
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
    }))

    return NextResponse.json(serializedInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    )
    const total = subtotal + (data.taxAmount || 0)

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        customerId: data.customerId,
        number: data.number,
        issueDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        currency: data.currency,
        subtotal,
        taxAmount: data.taxAmount || 0,
        taxInclusive: data.taxInclusive || false,
        total: data.total,
        status: data.status,
        poNumber: data.poNumber,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

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
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}