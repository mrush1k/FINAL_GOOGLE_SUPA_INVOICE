import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  generateOAuthState, 
  generateCodeVerifier, 
  generateCodeChallenge,
  buildMicrosoftAuthUrl,
  getBaseUrl
} from '@/lib/social-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if Microsoft OAuth is configured
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Microsoft OAuth not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables.' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const isSignUp = searchParams.get('signup') === 'true'
    const isTrial = searchParams.get('trial') === 'true'
    const returnTo = searchParams.get('returnTo') || '/dashboard'

    // Generate OAuth security parameters
    const state = generateOAuthState()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Build redirect URI
    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/auth/microsoft/callback`

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

    cookieStore.set('microsoft_oauth_state', state, cookieOptions)
    cookieStore.set('microsoft_code_verifier', codeVerifier, cookieOptions)
    cookieStore.set('microsoft_signup_context', JSON.stringify({
      isSignUp,
      isTrial,
      returnTo,
    }), cookieOptions)

    // Build authorization URL
    const authUrl = buildMicrosoftAuthUrl(redirectUri, state, codeChallenge)

    // Redirect user to Microsoft OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Microsoft OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Microsoft authentication' },
      { status: 500 }
    )
  }
}