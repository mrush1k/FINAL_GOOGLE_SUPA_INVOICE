import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only access their own data
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const userData = await prisma.user.findUnique({
      where: { id: id },
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only update their own data
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = await request.json()
    
    const userData = await prisma.user.update({
      where: { id: id },
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        country: data.country,
        currency: data.currency,
        workType: data.workType,
        customWorkType: data.customWorkType,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        businessRegNumber: data.businessRegNumber,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        postalCode: data.postalCode,
        website: data.website,
        dateFormat: data.dateFormat,
        logoUrl: data.logoUrl,
      },
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}