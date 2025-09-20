import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'
import { generateReceiptPDF } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId, paymentId, recipientEmail, message } = await request.json()

    // Fetch invoice with relations
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        userId: user.id 
      },
      include: {
        customer: true,
        payments: true,
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Find the specific payment
    const payment = invoice.payments.find(p => p.id === paymentId)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Fetch user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if email credentials are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please contact support.' 
      }, { status: 500 })
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

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const amountDue = Number(invoice.total) - totalPaid
    
    // Enhanced subject line with business name, invoice number, and amount
    const businessName = userProfile.businessName || userProfile.username || 'Your Business'
    const formattedBusinessName = businessName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const emailSubject = `${formattedBusinessName} – Receipt #${invoice.number} for ${formatCurrency(Number(payment.amount), invoice.currency)}`
    
    // Enhanced email body with comprehensive details and friendly messaging
    const emailBody = `
Hi ${invoice.customer?.displayName || 'Customer'},

Please find your receipt attached. Let us know if you have any questions. Thanks for your business!

--- Payment Receipt Details ---
• Business Name: ${businessName}
• Invoice Number: ${invoice.number}
• Payment Date: ${new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
• Amount Paid: ${formatCurrency(Number(payment.amount), invoice.currency)}
• Payment Method: ${payment.paymentMethod}

${message ? `\n--- Custom Message ---\n${message}\n` : ''}

Best regards,
${businessName}
${userProfile.email}
`

    // Generate PDF for attachment
    const pdf = generateReceiptPDF(invoice as any, userProfile as any, {
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate.toISOString(),
      method: payment.paymentMethod
    })
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Enhanced PDF filename with business name
    const sanitizedBusinessName = formattedBusinessName.replace(/[^a-zA-Z0-9]/g, '')
    const pdfFilename = `Receipt-${invoice.number}-${sanitizedBusinessName}.pdf`

    // Enhanced HTML email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt ${invoice.number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .receipt-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .summary-label { font-weight: bold; color: #495057; }
        .summary-value { color: #28a745; }
        .message-box { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .footer { text-align: center; border-top: 2px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; }
        .business-info { font-weight: bold; color: #28a745; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: #28a745; margin: 0;">${businessName}</h1>
        <p style="color: #6c757d; margin: 10px 0 0 0;">Payment Receipt for Invoice #${invoice.number}</p>
    </div>

    <div class="greeting">
        Hi ${invoice.customer?.displayName || 'Customer'},<br><br>
        Thank you for your payment! Please find your receipt attached. Let us know if you have any questions.
    </div>

    <div class="receipt-summary">
        <div class="summary-row">
            <span class="summary-label">Business Name:</span>
            <span class="summary-value">${businessName}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Invoice Number:</span>
            <span class="summary-value">${invoice.number}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Payment Date:</span>
            <span class="summary-value">${new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Amount Paid:</span>
            <span class="summary-value">${formatCurrency(Number(payment.amount), invoice.currency)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Payment Method:</span>
            <span class="summary-value">${payment.paymentMethod}</span>
        </div>
    </div>

    ${message ? `<div class="message-box"><strong>Custom Message:</strong><br>${message}</div>` : ''}

    <div class="footer">
        <div class="business-info">${businessName}</div>
        <div>${userProfile.email}</div>
        <div style="margin-top: 15px; font-size: 14px;">Thank you for your payment!</div>
    </div>
</body>
</html>
`

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"${businessName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipientEmail,
      bcc: userProfile.email, // BCC to user for record keeping
      subject: emailSubject,
      text: emailBody,
      html: emailHtml,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Receipt sent successfully' 
    })

  } catch (error) {
    console.error('Error sending receipt email:', error)
    return NextResponse.json(
      { error: 'Failed to send receipt email' },
      { status: 500 }
    )
  }
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}