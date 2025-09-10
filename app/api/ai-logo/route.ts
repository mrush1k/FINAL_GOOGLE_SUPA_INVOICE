import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName } = body

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' }, 
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

    // Generate a simple text-based logo using Canvas API or a simple SVG
    const logoPrompt = `Modern minimal logo for ${businessName}`
    
    // For now, create a simple text-based logo using Canvas-style design
    // In production, this would call OpenAI DALL-E API or similar service
    const logoSvg = generateSimpleTextLogo(businessName)
    
    // Convert SVG to base64 data URL for storage
    const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

    // Save logo info to user database
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        aiLogoUrl: logoDataUrl,
        aiLogoPrompt: logoPrompt,
        aiLogoGeneratedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      logoUrl: logoDataUrl,
      prompt: logoPrompt,
      generatedAt: updatedUser.aiLogoGeneratedAt,
    })

  } catch (error) {
    console.error('AI Logo generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate logo' }, 
      { status: 500 }
    )
  }
}

function generateSimpleTextLogo(businessName: string): string {
  const initials = businessName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3)

  const colors = ['#0066CC', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#EA580C']
  const primaryColor = colors[Math.floor(Math.random() * colors.length)]
  
  return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${primaryColor}CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" />
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
            text-anchor="middle" dominant-baseline="central" fill="white">
        ${initials}
      </text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="#333">
        ${businessName}
      </text>
    </svg>
  `.trim()
}