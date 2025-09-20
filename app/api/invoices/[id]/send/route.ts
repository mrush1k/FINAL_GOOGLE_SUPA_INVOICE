import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'
import { InvoiceStatus } from '@/lib/types'
import { randomUUID } from 'crypto'
import { generateInvoicePDF } from '@/lib/pdf-generator'

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

    const invoiceId = id
    const body = await request.json()
    const { recipientEmail, ccEmails, message } = body

    // Fetch invoice with relations
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        userId: user.id 
      },
      include: {
        customer: true,
        items: true,
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
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
        error: 'Email service not configured. Please set up SMTP credentials in environment variables.' 
      }, { status: 500 })
    }

    // Use customer email if no recipient email provided
    const emailRecipient = recipientEmail || invoice.customer?.email
    if (!emailRecipient) {
      return NextResponse.json({ 
        error: 'No recipient email provided and customer has no email address' 
      }, { status: 400 })
    }

    // Duplicate email prevention - check if email was sent recently (within 30 seconds)
    if (invoice.lastEmailSentAt) {
      const timeSinceLastEmail = Date.now() - new Date(invoice.lastEmailSentAt).getTime()
      const thirtySecondsInMs = 30 * 1000
      if (timeSinceLastEmail < thirtySecondsInMs) {
        return NextResponse.json({ 
          error: 'Email was sent recently. Please wait before sending again to prevent duplicates.' 
        }, { status: 429 })
      }
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

    // Generate unique tracking ID for this email
    const trackingId = randomUUID()
    const baseUrl = 'https://final-google-supa-invoice.vercel.app'
    
    // Enhanced subject line with business name, invoice number, and amount
    const businessName = userProfile.businessName || userProfile.username || 'Your Business'
    const formattedBusinessName = businessName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const emailSubject = `${formattedBusinessName} – Invoice #${invoice.number} for ${formatCurrency(Number(invoice.total), invoice.currency)}`
    
    // Enhanced email body with comprehensive details and friendly messaging
    const emailBody = `
Hi ${invoice.customer?.displayName || 'Customer'},

Please find your invoice attached. Let us know if you have any questions. Thanks for your business!

--- Invoice Details ---
• Business Name: ${businessName}
• Invoice Number: ${invoice.number}
• Invoice Total: ${formatCurrency(Number(invoice.total), invoice.currency)}
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${message ? `\n--- Custom Message ---\n${message}\n` : ''}

Best regards,
${businessName}
${userProfile.email}
`

    // Generate PDF for attachment
    const invoiceForPDF = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      status: invoice.status as any,
      poNumber: invoice.poNumber || undefined,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      sentAt: invoice.sentAt || undefined,
      sentTo: invoice.sentTo || undefined,
      emailCount: invoice.emailCount || undefined,
      lastEmailSentAt: invoice.lastEmailSentAt || undefined,
      items: invoice.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })) || []
    }

    const pdf = generateInvoicePDF(invoiceForPDF as any, userProfile as any)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Enhanced PDF filename with business name
    const sanitizedBusinessName = formattedBusinessName.replace(/[^a-zA-Z0-9]/g, '')
    const pdfFilename = `Invoice-${invoice.number}-${sanitizedBusinessName}.pdf`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .invoice-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .summary-label { font-weight: bold; color: #495057; }
        .summary-value { color: #0066cc; }
        .message-box { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .footer { text-align: center; border-top: 2px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; }
        .business-info { font-weight: bold; color: #0066cc; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: #0066cc; margin: 0;">${businessName}</h1>
        <p style="color: #6c757d; margin: 10px 0 0 0;">Invoice #${invoice.number}</p>
    </div>

    <div class="greeting">
        Hi ${invoice.customer?.displayName || 'Customer'},<br><br>
        Please find your invoice attached. Let us know if you have any questions. Thanks for your business!
    </div>

    <div class="invoice-summary">
        <div class="summary-row">
            <span class="summary-label">Business Name:</span>
            <span class="summary-value">${businessName}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Invoice Number:</span>
            <span class="summary-value">${invoice.number}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Invoice Total:</span>
            <span class="summary-value">${formatCurrency(Number(invoice.total), invoice.currency)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Due Date:</span>
            <span class="summary-value">${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
    </div>

    ${message ? `<div class="message-box"><strong>Custom Message:</strong><br>${message}</div>` : ''}

    <div class="footer">
        <div class="business-info">${businessName}</div>
        <div>${userProfile.email}</div>
        <div style="margin-top: 15px; font-size: 14px;">Thank you for your business!</div>
    </div>

    <!-- Email tracking pixel -->
    <img src="${baseUrl}/api/webhooks/email-tracking?trackingId=${trackingId}" width="1" height="1" style="display:none;" alt="">
</body>
</html>
`

    // Prepare CC list
    let ccList: string[] = []
    if (ccEmails) {
      ccList = ccEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email)
    }
    
    // Always CC self if user has that preference
    if (userProfile.alwaysCcSelf && !ccList.includes(userProfile.email)) {
      ccList.push(userProfile.email)
    }

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"${businessName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: emailRecipient,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: userProfile.email, // BCC to user for record keeping (in addition to CC if enabled)
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

    // Update invoice with email tracking information
    const updateData: any = {
      sentTo: emailRecipient,
      lastEmailSentAt: new Date(),
      emailCount: (invoice.emailCount || 0) + 1,
      trackingId: trackingId,
      deliveryStatus: 'sent',
      emailDelivered: false,
      emailOpened: false,
      emailClicked: false,
      emailBounced: false,
    }

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === InvoiceStatus.DRAFT) {
      updateData.status = InvoiceStatus.SENT
      updateData.sentAt = new Date()
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    // Log the email send event for tracking
    console.log(`Invoice ${invoice.number} sent to ${emailRecipient} by user ${user.id} (email #${updateData.emailCount})`)

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      sentTo: emailRecipient,
      sentAt: new Date().toISOString(),
      emailCount: updateData.emailCount,
      trackingId: trackingId,
      statusUpdated: invoice.status === InvoiceStatus.DRAFT,
    })

  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice email. Please check your SMTP configuration.' },
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