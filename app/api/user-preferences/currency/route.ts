import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPreferences = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        country: true,
        currency: true,
        taxLabel: true,
        businessIdLabel: true,
        locale: true,
        dateFormat: true,
        defaultTaxRate: true,
      }
    })

    if (!userPreferences) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Convert Decimal to number for JSON serialization
    const serializedPreferences = {
      ...userPreferences,
      defaultTaxRate: userPreferences.defaultTaxRate ? Number(userPreferences.defaultTaxRate) : null,
    }

    return NextResponse.json(serializedPreferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { migrateExisting, ...preferences } = data

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        country: preferences.country,
        currency: preferences.currency,
        taxLabel: preferences.taxLabel,
        businessIdLabel: preferences.businessIdLabel,
        locale: preferences.locale,
        dateFormat: preferences.dateFormat,
        defaultTaxRate: preferences.defaultTaxRate,
      }
    })

    // If migration is requested, update existing invoices and estimates
    if (migrateExisting) {
      // Update currency in invoices
      if (preferences.currency) {
        await prisma.invoice.updateMany({
          where: { 
            userId: user.id,
            deletedAt: null 
          },
          data: { currency: preferences.currency }
        })

        await prisma.estimate.updateMany({
          where: { userId: user.id },
          data: { currency: preferences.currency }
        })
      }

      // You could add more migration logic here for other fields if needed
    }

    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      migrated: migrateExisting 
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}