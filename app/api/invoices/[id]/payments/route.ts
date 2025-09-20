import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { InvoiceStatus } from '@/lib/types'
import nodemailer from 'nodemailer'

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

    const data = await request.json()

    // Verify the invoice belongs to the user
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: id,
        userId: user.id 
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Create the payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.method,
      },
    })

    // Calculate total paid amount
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount
    const invoiceTotal = Number(invoice.total)

    // Determine new invoice status
    let newStatus = invoice.status
    if (totalPaid >= invoiceTotal) {
      newStatus = InvoiceStatus.PAID
    } else if (totalPaid > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID
    }

    // Update invoice status if needed
    if (newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: id },
        data: { status: newStatus },
      })
    }

    // Fetch updated invoice with all relations
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    // Send receipt email automatically if invoice is fully paid and customer has email
    if (newStatus === InvoiceStatus.PAID && updatedInvoice?.customer?.email) {
      try {
        await sendReceiptEmail(updatedInvoice, payment, user.id)
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError)
        // Continue with response even if email fails
      }
    }

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...updatedInvoice,
      subtotal: Number(updatedInvoice!.subtotal),
      taxAmount: Number(updatedInvoice!.taxAmount),
      total: Number(updatedInvoice!.total),
      items: updatedInvoice!.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: updatedInvoice!.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

async function sendReceiptEmail(invoice: any, payment: any, userId: string) {
  // Check if email credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service not configured')
  }

  // Fetch user profile for email sender info
  const userProfile = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!userProfile) {
    throw new Error('User profile not found')
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const amountDue = Number(invoice.total) - totalPaid
  
  const emailSubject = `Payment Receipt for Invoice ${invoice.number}`
  
  const emailBody = `
Dear ${invoice.customer?.displayName || 'Customer'},

Thank you for your payment! Please find your payment receipt below:

PAYMENT RECEIPT
Receipt for Invoice: ${invoice.number}
Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}
Payment Method: ${payment.paymentMethod}
Amount Paid: ${formatCurrency(Number(payment.amount), invoice.currency)}

PAYMENT SUMMARY
Invoice Total: ${formatCurrency(Number(invoice.total), invoice.currency)}
Total Paid: ${formatCurrency(totalPaid, invoice.currency)}
${amountDue > 0 ? `Amount Due: ${formatCurrency(amountDue, invoice.currency)}` : 'Status: PAID IN FULL'}

Thank you for your payment!

Best regards,
${userProfile.username || 'Your Business'}
${userProfile.email}
`

  // Send email
  await transporter.sendMail({
    from: `"${userProfile.username || 'Your Business'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: invoice.customer.email,
    subject: emailSubject,
    text: emailBody,
    html: emailBody.replace(/\n/g, '<br>'),
  })

  console.log(`Receipt email sent successfully for invoice ${invoice.number} to ${invoice.customer.email}`)
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}