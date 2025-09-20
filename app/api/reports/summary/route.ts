import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Build date filter
    const dateFilter: any = {}
    if (fromDate) {
      dateFilter.gte = new Date(fromDate + 'T00:00:00.000Z')
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate + 'T23:59:59.999Z')
    }

    const whereClause = {
      userId: user.id,
      deletedAt: null, // Only include non-deleted invoices
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    }

    // Get all invoices in the date range
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
        select: {
        id: true,
        status: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        dueDate: true,
        createdAt: true
      }
    })

    const now = new Date()

    // Calculate summaries
    const paid = invoices.filter(inv => inv.status === 'PAID')
    const unpaid = invoices.filter(inv => inv.status === 'SENT' || inv.status === 'READ')
    const overdue = invoices.filter(inv => 
      (inv.status === 'SENT' || inv.status === 'READ') && 
      inv.dueDate && 
      new Date(inv.dueDate) < now
    )

    const summary = {
      paid: {
        count: paid.length,
        total: paid.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      },
      unpaid: {
        count: unpaid.length,
        total: unpaid.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      },
      overdue: {
        count: overdue.length,
        total: overdue.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      },
      taxCollected: paid.reduce((sum, inv) => sum + Number(inv.taxAmount || 0), 0),
      period: fromDate && toDate 
        ? `${format(new Date(fromDate), 'MMM dd, yyyy')} - ${format(new Date(toDate), 'MMM dd, yyyy')}`
        : 'All time'
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching invoice summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}