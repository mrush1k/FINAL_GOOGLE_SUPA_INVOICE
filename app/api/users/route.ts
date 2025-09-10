import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const user = await prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        username: data.username,
        country: data.country,
        currency: data.currency,
        workType: data.workType,
        customWorkType: data.customWorkType,
        displayName: data.displayName,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}