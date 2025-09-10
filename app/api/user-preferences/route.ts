import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(authHeader.split(' ')[1])
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user preferences including service templates
    const templates = await prisma.serviceTemplate.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPreferred: 'desc' },
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Get most used customers for quick reference
    const customerUsage = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { userId: user.id },
      _count: {
        customerId: true
      },
      orderBy: {
        _count: {
          customerId: 'desc'
        }
      },
      take: 10
    })

    const customerIds = customerUsage.map(c => c.customerId)
    const frequentCustomers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        userId: user.id
      }
    })

    // Build learning data
    const preferences = {
      serviceTemplates: templates,
      frequentCustomers: frequentCustomers.map(customer => ({
        ...customer,
        usageCount: customerUsage.find(u => u.customerId === customer.id)?._count.customerId || 0
      })),
      preferredServices: templates.filter(t => t.isPreferred),
      totalInvoices: await prisma.invoice.count({ where: { userId: user.id } }),
      totalCustomers: await prisma.customer.count({ where: { userId: user.id } })
    }

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(authHeader.split(' ')[1])
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case 'mark_preferred':
        // Mark a service template as preferred
        const { templateId, isPreferred } = data
        await prisma.serviceTemplate.update({
          where: { id: templateId, userId: user.id },
          data: { isPreferred }
        })
        return NextResponse.json({ success: true, message: 'Service preference updated' })

      case 'add_keyword':
        // Add keywords to a service template for better matching
        const { templateId: keywordTemplateId, keywords } = data
        const template = await prisma.serviceTemplate.findFirst({
          where: { id: keywordTemplateId, userId: user.id }
        })
        
        if (!template) {
          return NextResponse.json({ error: 'Service template not found' }, { status: 404 })
        }

        const existingKeywords = template.keywords || ''
        const newKeywords = existingKeywords 
          ? `${existingKeywords}, ${keywords}`
          : keywords

        await prisma.serviceTemplate.update({
          where: { id: keywordTemplateId },
          data: { keywords: newKeywords }
        })
        
        return NextResponse.json({ success: true, message: 'Keywords added to service' })

      case 'create_standard_service':
        // Create a new standard service from user input
        const { name, description, unitPrice, category, keywords: serviceKeywords } = data
        
        const newTemplate = await prisma.serviceTemplate.create({
          data: {
            userId: user.id,
            name,
            description,
            unitPrice: unitPrice || 0,
            quantity: 1,
            category: category || 'general',
            keywords: serviceKeywords || '',
            isPreferred: true // New standard services are preferred by default
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: `Standard service '${name}' created`,
          template: newTemplate
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}