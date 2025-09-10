import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all paid invoices for the specified year
    const startDate = new Date(year, 0, 1) // January 1st of the year
    const endDate = new Date(year + 1, 0, 1) // January 1st of the next year

    const paidInvoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: 'PAID',
        deletedAt: null,
        updatedAt: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        total: true,
        updatedAt: true
      }
    })

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(year, index).toLocaleString('default', { month: 'short' }),
      income: 0,
      year: year
    }))

    // Aggregate income by month
    paidInvoices.forEach(invoice => {
      const monthIndex = new Date(invoice.updatedAt).getMonth()
      monthlyData[monthIndex].income += Number(invoice.total || 0)
    })

    // Also get outstanding balances
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: {
          in: ['SENT', 'READ']
        },
        dueDate: {
          lt: new Date()
        }
      },
      select: {
        total: true
      }
    })

    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: {
          in: ['SENT', 'READ']
        },
        dueDate: {
          gte: new Date()
        }
      },
      select: {
        total: true
      }
    })

    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    const response = {
      monthlyData,
      outstandingBalances: {
        overdue: {
          count: overdueInvoices.length,
          total: overdueTotal
        },
        pending: {
          count: pendingInvoices.length,
          total: pendingTotal
        },
        total: overdueTotal + pendingTotal
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching cashflow data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}