import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        aiLogoUrl: true,
        aiLogoPrompt: true,
        aiLogoGeneratedAt: true,
        logoUrl: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Logo fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logo data' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { logoUrl } = body

    if (!logoUrl) {
      return NextResponse.json(
        { error: 'Logo URL is required' }, 
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { logoUrl },
    })

    return NextResponse.json({
      success: true,
      logoUrl: updatedUser.logoUrl,
    })

  } catch (error) {
    console.error('Logo update error:', error)
    return NextResponse.json(
      { error: 'Failed to update logo' }, 
      { status: 500 }
    )
  }
}