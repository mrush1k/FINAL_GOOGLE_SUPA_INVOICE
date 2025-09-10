import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProcessedCommand {
  intent: string
  entities: {
    customerName?: string
    amount?: number
    currency?: string
    description?: string
    dueDate?: string
    invoiceNumber?: string
    paymentMethod?: string
  }
  confidence: number
}

// Natural Language Processing for invoice commands
function processNaturalLanguage(message: string): ProcessedCommand {
  const lowerMessage = message.toLowerCase()
  
  // Intent classification
  let intent = 'general'
  let confidence = 0.5
  
  if (lowerMessage.includes('create') && (lowerMessage.includes('invoice') || lowerMessage.includes('bill'))) {
    intent = 'create_invoice'
    confidence = 0.9
  } else if (lowerMessage.includes('add') && (lowerMessage.includes('customer') || lowerMessage.includes('client'))) {
    intent = 'add_customer'
    confidence = 0.9
  } else if (lowerMessage.includes('mark') && lowerMessage.includes('paid')) {
    intent = 'mark_paid'
    confidence = 0.9
  } else if (lowerMessage.includes('send') && lowerMessage.includes('invoice')) {
    intent = 'send_invoice'
    confidence = 0.8
  } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    intent = 'help'
    confidence = 0.8
  } else if (lowerMessage.includes('yes') || lowerMessage.includes('confirm') || lowerMessage.includes('proceed') || lowerMessage.includes('ok')) {
    intent = 'confirm'
    confidence = 0.8
  } else if (lowerMessage.includes('no') || lowerMessage.includes('cancel') || lowerMessage.includes('abort')) {
    intent = 'cancel'
    confidence = 0.8
  }
  
  // Entity extraction
  const entities: any = {}
  
  // Extract customer names (patterns: "for John Smith", "to Mary Johnson", etc.)
  const customerMatch = lowerMessage.match(/(?:for|to|from)\s+([a-z\s]+?)(?:\s|,|$|for|amount|due)/i)
  if (customerMatch) {
    entities.customerName = customerMatch[1].trim()
  }
  
  // Extract amounts (patterns: "$250", "250 dollars", "250", etc.)
  const amountMatch = lowerMessage.match(/(?:\$|dollars?|amount|cost|price|charge|bill)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:dollars?|\$)/i)
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1] || amountMatch[2])
    entities.currency = 'USD' // Default to USD
  }
  
  // Extract currency
  const currencyMatch = lowerMessage.match(/\b(usd|eur|gbp|aud|cad|nzd)\b/i)
  if (currencyMatch) {
    entities.currency = currencyMatch[1].toUpperCase()
  }
  
  // Extract descriptions/services
  const descMatch = lowerMessage.match(/(?:for|service|work|job|description|item)\s+(.+?)(?:\s|,|$|due|amount|payment)/i)
  if (descMatch && !entities.customerName?.includes(descMatch[1])) {
    entities.description = descMatch[1].trim()
  }
  
  // Extract due dates (patterns: "due in 7 days", "net 30", "due tomorrow", etc.)
  const dueDateMatch = lowerMessage.match(/(?:due|payment)\s+(?:in\s+)?(\d+)\s+days?|net\s+(\d+)|due\s+(tomorrow|today|next\s+week|next\s+month)/i)
  if (dueDateMatch) {
    if (dueDateMatch[1]) {
      const days = parseInt(dueDateMatch[1])
      entities.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    } else if (dueDateMatch[2]) {
      const days = parseInt(dueDateMatch[2])
      entities.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    } else if (dueDateMatch[3]) {
      const dateStr = dueDateMatch[3]
      if (dateStr === 'tomorrow') {
        entities.dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } else if (dateStr === 'today') {
        entities.dueDate = new Date().toISOString()
      } else if (dateStr.includes('week')) {
        entities.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (dateStr.includes('month')) {
        entities.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  }
  
  // Extract invoice numbers (patterns: "invoice #123", "invoice 123", "#123", etc.)
  const invoiceMatch = lowerMessage.match(/(?:invoice\s*#?|#)(\d+)/i)
  if (invoiceMatch) {
    entities.invoiceNumber = invoiceMatch[1]
  }
  
  // Extract payment methods
  const paymentMatch = lowerMessage.match(/(?:paid|payment)\s+(?:by|via|with)\s+(cash|check|bank\s+transfer|credit\s+card|paypal|stripe)/i)
  if (paymentMatch) {
    entities.paymentMethod = paymentMatch[1]
  }
  
  return { intent, entities, confidence }
}

// Generate appropriate responses based on intent and entities
function generateResponse(processed: ProcessedCommand, originalMessage: string): { response: string; action?: any } {
  const { intent, entities, confidence } = processed
  
  if (confidence < 0.6) {
    // Provide more helpful error messages based on what we could understand
    let helpMessage = "I didn't catch that clearly. "
    
    if (entities.customerName || entities.amount) {
      helpMessage += "I heard some details but need clarification. "
    }
    
    helpMessage += "Here are some examples of what you can ask me:\n\n"
    helpMessage += "**Create Invoices:**\n"
    helpMessage += "• \"Create an invoice for John Smith, $250 for plumbing work, due in 7 days\"\n"
    helpMessage += "• \"Bill ABC Company $500 for consulting services\"\n\n"
    helpMessage += "**Manage Customers:**\n"
    helpMessage += "• \"Add a new customer named Jane Doe\"\n\n"
    helpMessage += "**Track Payments:**\n"
    helpMessage += "• \"Mark invoice #123 as paid\"\n"
    helpMessage += "• \"Invoice 456 was paid by bank transfer\"\n\n"
    helpMessage += "**Get Help:**\n"
    helpMessage += "• \"How do I send an invoice?\"\n"
    helpMessage += "• \"What payment methods are supported?\"\n\n"
    helpMessage += "💡 **Tip:** Speak clearly and include the customer name and amount for invoices."
    
    return { response: helpMessage }
  }
  
  switch (intent) {
    case 'create_invoice':
      if (entities.customerName && entities.amount) {
        // Build confirmation message with auto-creation notifications
        let confirmMessage = `I'll create an invoice for ${entities.customerName} with an amount of $${entities.amount}${entities.description ? ` for ${entities.description}` : ''}${entities.dueDate ? ` due ${new Date(entities.dueDate).toLocaleDateString()}` : ''}.`
        
        // Note: In a real implementation, you'd check if customer/service exists first
        // For now, we'll indicate potential auto-creation
        confirmMessage += `\n\n⚠️ **Auto-creation enabled:** If this customer or service doesn't exist, I'll create them automatically with default settings.`
        
        confirmMessage += `\n\nSay "yes" to proceed or "no" to cancel.`
        
        return {
          response: confirmMessage,
          action: {
            type: 'create_invoice',
            data: {
              customerName: entities.customerName,
              amount: entities.amount,
              currency: entities.currency || 'USD',
              description: entities.description || 'Service provided',
              dueDate: entities.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            requiresConfirmation: true
          }
        }
      } else {
        return {
          response: `I can help you create an invoice! I need a few details:\n\n${!entities.customerName ? '• Customer name\n' : ''}${!entities.amount ? '• Invoice amount\n' : ''}\nPlease tell me something like: \"Create an invoice for John Smith, $250 for consulting work\"`
        }
      }
      
    case 'add_customer':
      if (entities.customerName) {
        return {
          response: `I'll add ${entities.customerName} as a new customer to your database.`,
          action: {
            type: 'add_customer',
            data: {
              customerName: entities.customerName
            }
          }
        }
      } else {
        return {
          response: "I can help you add a new customer! Please tell me the customer's name, like: \"Add a new customer named John Smith\""
        }
      }
      
    case 'mark_paid':
      if (entities.invoiceNumber) {
        return {
          response: `I'll mark invoice #${entities.invoiceNumber} as paid${entities.paymentMethod ? ` (payment method: ${entities.paymentMethod})` : ''}.`,
          action: {
            type: 'mark_paid',
            data: {
              invoiceNumber: entities.invoiceNumber,
              paymentMethod: entities.paymentMethod || 'cash'
            }
          }
        }
      } else {
        return {
          response: "I can help you mark an invoice as paid! Please tell me the invoice number, like: \"Mark invoice #123 as paid\""
        }
      }
      
    case 'send_invoice':
      if (entities.invoiceNumber) {
        return {
          response: `I'll help you send invoice #${entities.invoiceNumber} to your customer via email.`,
          action: {
            type: 'send_invoice',
            data: {
              invoiceNumber: entities.invoiceNumber
            }
          }
        }
      } else {
        return {
          response: "I can help you send an invoice! Please tell me which invoice number you'd like to send, like: \"Send invoice #123\""
        }
      }
      
    case 'help':
      const helpTopics = {
        'create': `**How to Create an Invoice:**

1. **Via AI Assistant**: Simply tell me "Create an invoice for [customer name], $[amount] for [service description]"
2. **Manual Creation**: Go to Dashboard → New Invoice button
3. **Voice Command**: Use the Voice Invoice feature for hands-free creation

**Tips:**
• I can automatically create customers if they don't exist
• Include due dates like "due in 30 days" or "net 15"
• Specify currencies: USD, AUD, GBP, EUR, CAD, NZD`,

        'send': `**How to Send an Invoice:**

1. **From Invoice Page**: Click "Send Invoice" button
2. **Via AI Assistant**: Tell me "Send invoice #[number]"
3. **Email Integration**: Invoices are sent as professional PDFs

**Requirements:**
• Customer must have an email address
• SMTP settings configured in environment
• Invoice status will automatically update to "Sent"`,

        'payment': `**How to Record Payments:**

1. **Via AI Assistant**: Say "Mark invoice #[number] as paid"
2. **Manual Entry**: Open invoice → Mark as Paid button
3. **Partial Payments**: Supported for gradual payment tracking

**Payment Methods Supported:**
• Cash, Check, Bank Transfer
• Credit Card, PayPal, Stripe
• Custom payment methods`,

        'customers': `**Customer Management:**

1. **Add Customers**: "Add a new customer named [name]"
2. **Dynamic Fields**: Business registration numbers adapt by country
   - Australia → ABN (11-digit)
   - USA → EIN, UK → Company Reg + VAT
   - Canada → BN with RT suffix
3. **Edit Anytime**: Customers page allows full editing`,

        'general': `**Getting Started with Invoice Pro:**

🏠 **Dashboard**: Overview of overdue/paid invoices and financial metrics
📋 **Invoices**: Create, edit, send, and track all invoices
👥 **Customers**: Manage client information with country-specific fields
⚙️ **Settings**: Configure profile, company details, and preferences

**Quick Commands for AI Assistant:**
• "Create an invoice for John Smith, $500 for consulting, due in 30 days"
• "Add customer Jane Doe with email jane@company.com"
• "Mark invoice #0045 as paid via bank transfer"
• "Send invoice #0023 to customer"

**Need More Help?** Ask specific questions like:
• "How do I change my invoice template?"
• "What currencies are supported?"
• "How do I set up email sending?"`
      }

      // Check if user is asking about a specific topic
      const helpLowerMessage = originalMessage.toLowerCase()
      
      if (helpLowerMessage.includes('create') || helpLowerMessage.includes('invoice')) {
        return { response: helpTopics.create }
      } else if (helpLowerMessage.includes('send') || helpLowerMessage.includes('email')) {
        return { response: helpTopics.send }
      } else if (helpLowerMessage.includes('payment') || helpLowerMessage.includes('paid')) {
        return { response: helpTopics.payment }
      } else if (helpLowerMessage.includes('customer') || helpLowerMessage.includes('client')) {
        return { response: helpTopics.customers }
      } else {
        return { response: helpTopics.general }
      }

    case 'confirm':
      return {
        response: "✅ Great! I'll proceed with your request. Please wait while I process this...",
        action: {
          type: 'confirmed_action',
          data: {}
        }
      }

    case 'cancel':
      return {
        response: "❌ No problem! Your request has been cancelled. What else can I help you with?"
      }
      
    default:
      return {
        response: "I'm here to help with invoices, customers, and payments. Try asking me to create an invoice, add a customer, or mark an invoice as paid. You can also ask \"help\" for more information!"
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()
    
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      )
    }
    
    // Process the natural language message
    const processed = processNaturalLanguage(message)
    
    // Generate response
    const result = generateResponse(processed, message)
    
    // Return the response and any actions
    return NextResponse.json({
      response: result.response,
      action: result.action,
      processed: {
        intent: processed.intent,
        entities: processed.entities,
        confidence: processed.confidence
      }
    })
    
  } catch (error) {
    console.error('Error processing chatbot command:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}