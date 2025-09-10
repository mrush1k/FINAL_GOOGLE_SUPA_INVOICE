import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const { newCurrency, oldCurrency } = await request.json()

    if (!newCurrency || !oldCurrency) {
      return NextResponse.json({ error: 'Both newCurrency and oldCurrency are required' }, { status: 400 })
    }

    // Update invoices that are not finalized (PAID or PARTIALLY_PAID)
    const updatedInvoices = await prisma.invoice.updateMany({
      where: {
        userId: user.id,
        currency: oldCurrency,
        status: {
          not: {
            in: ['PAID', 'PARTIALLY_PAID', 'CANCELLED']
          }
        }
      },
      data: {
        currency: newCurrency
      }
    })

    // Update estimates that are not finalized (APPROVED, DECLINED, EXPIRED, CONVERTED)
    const updatedEstimates = await prisma.estimate.updateMany({
      where: {
        userId: user.id,
        currency: oldCurrency,
        status: {
          not: {
            in: ['APPROVED', 'DECLINED', 'EXPIRED', 'CONVERTED']
          }
        }
      },
      data: {
        currency: newCurrency
      }
    })

    return NextResponse.json({
      message: 'Currency updated successfully',
      invoicesUpdated: updatedInvoices.count,
      estimatesUpdated: updatedEstimates.count
    })

  } catch (error) {
    console.error('Error updating currency:', error)
    return NextResponse.json(
      { error: 'Failed to update currency' },
      { status: 500 }
    )
  }
}