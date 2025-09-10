import { NextRequest, NextResponse } from 'next/server'
import { getOAuthSession } from '@/lib/oauth-session'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getOAuthSession()
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Get user profile from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { socialAccounts: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        country: user.country,
        currency: user.currency,
        businessName: user.businessName,
        oauthProvider: session.provider,
      }
    })
  } catch (error) {
    console.error('OAuth session check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}