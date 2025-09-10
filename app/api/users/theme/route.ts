import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    return dbUser
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

// GET /api/users/theme - Retrieve user theme preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get theme preferences from user record or return defaults
    const themePreferences = {
      primaryColor: user.primaryColor || '#0066CC',
      colorScheme: user.colorScheme || 'light'
    }

    return NextResponse.json(themePreferences)
  } catch (error) {
    console.error('Error retrieving theme preferences:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve theme preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/users/theme - Update user theme preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { primaryColor, colorScheme } = body

    // Validate input
    if (!primaryColor || !colorScheme) {
      return NextResponse.json(
        { error: 'primaryColor and colorScheme are required' },
        { status: 400 }
      )
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexColorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use HEX (#000000) format.' },
        { status: 400 }
      )
    }

    // Validate color scheme
    const validColorSchemes = ['light', 'dark', 'system']
    if (!validColorSchemes.includes(colorScheme)) {
      return NextResponse.json(
        { error: 'Invalid color scheme. Must be light, dark, or system.' },
        { status: 400 }
      )
    }

    // Update user theme preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        primaryColor,
        colorScheme,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Theme preferences updated successfully',
      theme: {
        primaryColor: updatedUser.primaryColor,
        colorScheme: updatedUser.colorScheme
      }
    })
  } catch (error) {
    console.error('Error updating theme preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update theme preferences' },
      { status: 500 }
    )
  }
}