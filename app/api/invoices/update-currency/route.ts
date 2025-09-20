import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
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