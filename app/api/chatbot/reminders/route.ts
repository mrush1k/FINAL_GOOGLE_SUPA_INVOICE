import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Check for subscription renewals and create reminder messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }
    
    // Get user information for subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Calculate subscription renewal dates (simplified logic)
    const subscriptionStart = user.createdAt
    const now = new Date()
    const monthsSinceCreation = Math.floor((now.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const nextRenewalDate = new Date(subscriptionStart)
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + monthsSinceCreation + 1)
    
    const daysUntilRenewal = Math.ceil((nextRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const reminders: any[] = []
    
    // 7-day reminder
    if (daysUntilRenewal === 7) {
      reminders.push({
        type: 'subscription_renewal',
        title: 'Subscription Renewal Reminder',
        message: `Your Invoice Pro subscription will renew in 7 days on ${nextRenewalDate.toLocaleDateString()}. Make sure your payment method is up to date to avoid any service interruption.`,
        daysUntilRenewal: 7,
        renewalDate: nextRenewalDate.toISOString(),
        actions: [
          {
            label: 'Manage Subscription',
            url: '/dashboard/settings'
          }
        ]
      })
    }
    
    // 1-day reminder
    if (daysUntilRenewal === 1) {
      reminders.push({
        type: 'subscription_renewal',
        title: 'Subscription Renews Tomorrow',
        message: `Your Invoice Pro subscription will renew tomorrow (${nextRenewalDate.toLocaleDateString()}). Your payment method will be charged automatically.`,
        daysUntilRenewal: 1,
        renewalDate: nextRenewalDate.toISOString(),
        actions: [
          {
            label: 'Manage Subscription',
            url: '/dashboard/settings'
          }
        ]
      })
    }
    
    // Check for overdue invoices that might need attention
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: {
          in: ['SENT', 'APPROVED']
        },
        dueDate: {
          lt: now
        }
      },
      include: {
        customer: {
          select: {
            displayName: true
          }
        }
      },
      take: 5
    })
    
    if (overdueInvoices.length > 0) {
      reminders.push({
        type: 'overdue_invoices',
        title: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
        message: `Don't forget to follow up on overdue payments. The oldest is from ${overdueInvoices[0].customer.displayName} (Invoice #${overdueInvoices[0].number}).`,
        overdueCount: overdueInvoices.length,
        actions: [
          {
            label: 'View Overdue Invoices',
            url: '/dashboard'
          }
        ]
      })
    }
    
    // Check for draft invoices that haven't been sent
    const draftInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'DRAFT',
        createdAt: {
          lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
        }
      },
      take: 5
    })
    
    if (draftInvoices.length > 0) {
      reminders.push({
        type: 'draft_invoices',
        title: `You have ${draftInvoices.length} unsent invoice${draftInvoices.length > 1 ? 's' : ''}`,
        message: `You have draft invoices that haven't been sent to customers yet. Consider reviewing and sending them.`,
        draftCount: draftInvoices.length,
        actions: [
          {
            label: 'View Draft Invoices',
            url: '/dashboard/invoices'
          }
        ]
      })
    }
    
    return NextResponse.json({
      reminders,
      nextRenewalDate: nextRenewalDate.toISOString(),
      daysUntilRenewal
    })
    
  } catch (error) {
    console.error('Error checking reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mark reminder as seen/dismissed
export async function POST(request: NextRequest) {
  try {
    const { userId, reminderType } = await request.json()
    
    if (!userId || !reminderType) {
      return NextResponse.json(
        { error: 'userId and reminderType are required' },
        { status: 400 }
      )
    }
    
    // Log that the reminder was acknowledged
    await prisma.chatbotInteraction.create({
      data: {
        userId,
        userMessage: `Reminder dismissed: ${reminderType}`,
        botResponse: 'Reminder acknowledged and dismissed.',
        action: JSON.stringify({
          type: 'reminder_dismissed',
          reminderType
        })
      }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error dismissing reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}