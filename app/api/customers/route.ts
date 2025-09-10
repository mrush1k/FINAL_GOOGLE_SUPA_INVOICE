import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in Prisma database (handle OAuth users)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      console.log('Creating user record for OAuth user:', user.id)
      // Create user record for OAuth user
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
          country: 'US', // Default values
          currency: 'USD',
          displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          firstName: user.user_metadata?.given_name || '',
          lastName: user.user_metadata?.family_name || '',
        }
      })
      console.log('Created user record:', dbUser.id)
    }

    const data = await request.json()
    console.log('Customer creation data:', data)

    // Validate required fields
    console.log('Raw displayName value:', JSON.stringify(data.displayName))
    console.log('DisplayName type:', typeof data.displayName)
    console.log('DisplayName length:', data.displayName?.length)
    
    if (!data.displayName || data.displayName.trim() === '') {
      console.error('Missing required field: displayName')
      return NextResponse.json({ 
        error: 'Display name is required',
        debug: {
          received: data.displayName,
          type: typeof data.displayName,
          length: data.displayName?.length,
          trimmed: data.displayName?.trim()
        }
      }, { status: 400 })
    }
    
    // Ensure displayName is at least 1 character after trimming
    const trimmedDisplayName = data.displayName.trim()
    if (trimmedDisplayName.length === 0) {
      console.error('DisplayName is empty after trimming')
      return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 })
    }

    const customerData = {
      userId: user.id,
      displayName: trimmedDisplayName, // Use the validated trimmed name
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      businessName: data.businessName?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      zipCode: data.zipCode?.trim() || null,
      country: data.country?.trim() || null,
      businessRegNumber: data.businessRegNumber?.trim() || null,
    }
    
    console.log('Creating customer with data:', JSON.stringify(customerData, null, 2))
    
    const customer = await prisma.customer.create({
      data: customerData,
    })

    console.log('Customer created successfully:', customer.id)
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer - detailed:', error)
    
    // Check if it's a Prisma error
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}