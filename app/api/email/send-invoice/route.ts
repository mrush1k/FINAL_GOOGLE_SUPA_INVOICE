import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId, recipientEmail, message } = await request.json()

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

    // Generate invoice PDF buffer
    // Note: For production, you'd want to use a headless PDF generator
    // For now, we'll just send the email without attachment
    
    const emailSubject = `Invoice ${invoice.number} from ${userProfile.username || 'Your Business'}`
    
    const emailBody = `
Dear ${invoice.customer?.displayName || 'Customer'},

Please find your invoice details below:

Invoice Number: ${invoice.number}
Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Total Amount: ${formatCurrency(Number(invoice.total), invoice.currency)}

${message ? `\nMessage from ${userProfile.username}:\n${message}` : ''}

Items:
${invoice.items?.map(item => 
  `- ${item.description}: ${item.quantity} × ${formatCurrency(Number(item.unitPrice), invoice.currency)} = ${formatCurrency(Number(item.total), invoice.currency)}`
).join('\n')}

Subtotal: ${formatCurrency(Number(invoice.subtotal), invoice.currency)}
Tax: ${formatCurrency(Number(invoice.taxAmount), invoice.currency)}
Total: ${formatCurrency(Number(invoice.total), invoice.currency)}

${invoice.notes ? `\nNotes:\n${invoice.notes}` : ''}

Thank you for your business!

Best regards,
${userProfile.username || 'Your Business'}
${userProfile.email}
`

    // Send email
    await transporter.sendMail({
      from: `"${userProfile.username || 'Your Business'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully' 
    })

  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice email' },
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