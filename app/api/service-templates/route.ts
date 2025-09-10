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

    // Get user's service templates ordered by usage count and preference
    const templates = await prisma.serviceTemplate.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPreferred: 'desc' },
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json(templates)

  } catch (error) {
    console.error('Error fetching service templates:', error)
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

    const { name, description, unitPrice, quantity, category, keywords, isPreferred } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    // Create new service template
    const template = await prisma.serviceTemplate.create({
      data: {
        userId: user.id,
        name,
        description,
        unitPrice: unitPrice || 0,
        quantity: quantity || 1,
        category: category || '',
        keywords: keywords || '',
        isPreferred: isPreferred || false
      }
    })

    return NextResponse.json(template, { status: 201 })

  } catch (error) {
    console.error('Error creating service template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}