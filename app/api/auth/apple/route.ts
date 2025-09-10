import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  generateOAuthState, 
  buildAppleAuthUrl,
  getBaseUrl
} from '@/lib/social-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if Apple OAuth is configured
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Apple Sign In not configured. Please set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables.' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const isSignUp = searchParams.get('signup') === 'true'
    const isTrial = searchParams.get('trial') === 'true'
    const returnTo = searchParams.get('returnTo') || '/dashboard'

    // Generate OAuth security parameters
    const state = generateOAuthState()

    // Build redirect URI
    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/auth/apple/callback`

    // Store OAuth state and parameters in secure cookies
    const cookieStore = await cookies()
    
    // Set cookies with security flags
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    }

    cookieStore.set('apple_oauth_state', state, cookieOptions)
    cookieStore.set('apple_signup_context', JSON.stringify({
      isSignUp,
      isTrial,
      returnTo,
    }), cookieOptions)

    // Build authorization URL
    const authUrl = buildAppleAuthUrl(redirectUri, state)

    // Redirect user to Apple OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Apple OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Apple authentication' },
      { status: 500 }
    )
  }
}