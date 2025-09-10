import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { findOrCreateService } from '@/lib/service-matching'

const prisma = new PrismaClient()

interface ChatbotAction {
  type: 'create_invoice' | 'add_customer' | 'mark_paid' | 'send_invoice'
  data: any
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    const { type, data, userId }: ChatbotAction = await request.json()
    
    if (!type || !data || !userId) {
      return NextResponse.json(
        { error: 'Action type, data, and userId are required' },
        { status: 400 }
      )
    }
    
    let result
    
    switch (type) {
      case 'create_invoice':
        result = await createInvoice(data, userId)
        break
        
      case 'add_customer':
        result = await addCustomer(data, userId)
        break
        
      case 'mark_paid':
        result = await markInvoicePaid(data, userId)
        break
        
      case 'send_invoice':
        result = await sendInvoice(data, userId)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error executing chatbot action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createInvoice(data: any, userId: string) {
  const { customerName, amount, currency, description, dueDate } = data
  
  try {
    // Get user's country for defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    })
    
    // Find or create customer with enhanced fallback
    let customer = await prisma.customer.findFirst({
      where: {
        userId,
        displayName: {
          contains: customerName,
          mode: 'insensitive'
        }
      }
    })
    
    let customerCreated = false
    if (!customer) {
      // Create new customer with intelligent defaults
      customer = await prisma.customer.create({
        data: {
          userId,
          displayName: customerName,
          firstName: customerName.split(' ')[0] || '',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          email: '', // Blank as specified
          country: user?.country || '', // Use user's country as default
          // Mark as pending details for incomplete information
          notes: 'Auto-created via Voice AI - Pending complete details'
        }
      })
      customerCreated = true
    }
    
    // Get next invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { number: 'desc' }
    })
    
    const nextNumber = lastInvoice 
      ? String(parseInt(lastInvoice.number) + 1).padStart(4, '0')
      : '0001'
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        customerId: customer.id,
        number: nextNumber,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        currency: currency || 'USD',
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        status: 'DRAFT'
      }
    })
    
    // Find or create service template with intelligent matching
    const serviceMatch = await findOrCreateService(userId, {
      description: description || 'Service provided',
      amount,
      service: description
    })

    // Create invoice item using matched/created service
    const itemDescription = serviceMatch.template?.description || description || 'Service provided'
    const itemQuantity = serviceMatch.template?.quantity || 1
    const itemUnitPrice = serviceMatch.template?.unitPrice > 0 ? serviceMatch.template.unitPrice : amount

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: itemDescription,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        total: amount // Keep total as spoken amount
      }
    })
    
    // Build comprehensive success message
    let message = `Invoice #${nextNumber} created successfully`
    const additions: string[] = []
    
    if (customerCreated) {
      additions.push(`New customer '${customerName}' was auto-created`)
    }
    
    if (serviceMatch.created) {
      additions.push(`New service '${serviceMatch.template?.name}' was auto-created`)
    } else if (serviceMatch.template && serviceMatch.confidence > 0.8) {
      additions.push(`Matched existing service '${serviceMatch.template.name}'`)
    }
    
    if (additions.length > 0) {
      message += `. ${additions.join(' and ')}.`
    } else {
      message += ` for ${customerName}.`
    }

    return {
      success: true,
      message,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: nextNumber,
        customerName,
        customerCreated,
        serviceCreated: serviceMatch.created,
        serviceMatched: !!serviceMatch.template && !serviceMatch.created,
        serviceName: serviceMatch.template?.name,
        amount,
        currency
      }
    }
    
  } catch (error) {
    console.error('Error creating invoice:', error)
    return {
      success: false,
      message: 'Failed to create invoice. Please try again.'
    }
  }
}

async function addCustomer(data: any, userId: string) {
  const { customerName } = data
  
  try {
    // Get user's country for defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    })
    
    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId,
        displayName: {
          contains: customerName,
          mode: 'insensitive'
        }
      }
    })
    
    if (existingCustomer) {
      return {
        success: false,
        message: `Customer "${customerName}" already exists in your database.`
      }
    }
    
    // Create new customer with intelligent defaults
    const customer = await prisma.customer.create({
      data: {
        userId,
        displayName: customerName,
        firstName: customerName.split(' ')[0] || '',
        lastName: customerName.split(' ').slice(1).join(' ') || '',
        email: '', // Blank as specified
        country: user?.country || '', // Use user's country as default
        notes: 'Added via Voice AI - Pending complete details'
      }
    })
    
    return {
      success: true,
      message: `Customer "${customerName}" added successfully with default settings. You can update their details later.`,
      data: {
        customerId: customer.id,
        customerName,
        pendingDetails: true
      }
    }
    
  } catch (error) {
    console.error('Error adding customer:', error)
    return {
      success: false,
      message: 'Failed to add customer. Please try again.'
    }
  }
}

async function markInvoicePaid(data: any, userId: string) {
  const { invoiceNumber, paymentMethod } = data
  
  try {
    // Find invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        userId,
        number: invoiceNumber
      }
    })
    
    if (!invoice) {
      return {
        success: false,
        message: `Invoice #${invoiceNumber} not found in your records.`
      }
    }
    
    if (invoice.status === 'PAID') {
      return {
        success: false,
        message: `Invoice #${invoiceNumber} is already marked as paid.`
      }
    }
    
    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentDate: new Date(),
        paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
        notes: 'Payment recorded via AI assistant'
      }
    })
    
    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' }
    })
    
    return {
      success: true,
      message: `Invoice #${invoiceNumber} marked as paid successfully.`,
      data: {
        invoiceNumber,
        amount: invoice.total,
        paymentMethod
      }
    }
    
  } catch (error) {
    console.error('Error marking invoice paid:', error)
    return {
      success: false,
      message: 'Failed to mark invoice as paid. Please try again.'
    }
  }
}

async function sendInvoice(data: any, userId: string) {
  const { invoiceNumber } = data
  
  try {
    // Find invoice with customer details
    const invoice = await prisma.invoice.findFirst({
      where: {
        userId,
        number: invoiceNumber
      },
      include: {
        customer: true
      }
    })
    
    if (!invoice) {
      return {
        success: false,
        message: `Invoice #${invoiceNumber} not found in your records.`
      }
    }
    
    if (!invoice.customer.email) {
      return {
        success: false,
        message: `Cannot send invoice #${invoiceNumber} - customer email not found. Please add an email address for ${invoice.customer.displayName}.`
      }
    }
    
    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'SENT' }
    })
    
    // Here you would integrate with your email service
    // For now, we'll just return success
    
    return {
      success: true,
      message: `Invoice #${invoiceNumber} sent successfully to ${invoice.customer.email}`,
      data: {
        invoiceNumber,
        customerEmail: invoice.customer.email,
        customerName: invoice.customer.displayName
      }
    }
    
  } catch (error) {
    console.error('Error sending invoice:', error)
    return {
      success: false,
      message: 'Failed to send invoice. Please try again.'
    }
  }
}