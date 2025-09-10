import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { supabase } from '@/lib/supabase'
import { 
  exchangeAppleCode,
  decodeAppleIdToken,
  encryptToken,
  getBaseUrl
} from '@/lib/social-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Apple uses form_post response mode, so we need to handle POST requests
    const formData = await request.formData()
    const code = formData.get('code') as string
    const state = formData.get('state') as string
    const error = formData.get('error') as string
    const user = formData.get('user') as string // Apple sends user data only on first authorization

    // Handle OAuth errors
    if (error) {
      const errorMap: Record<string, string> = {
        'user_cancelled_authorize': 'You cancelled the Apple Sign In',
        'invalid_request': 'Invalid Apple Sign In request',
        'invalid_client': 'Invalid Apple Sign In client configuration',
        'invalid_grant': 'Invalid or expired authorization grant',
        'unsupported_response_type': 'Unsupported Apple Sign In response type'
      }
      
      const errorMessage = errorMap[error] || 'Apple Sign In failed'
      return NextResponse.redirect(`${getBaseUrl()}/login?error=${encodeURIComponent(errorMessage)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Missing authorization code`)
    }

    // Retrieve and validate stored OAuth state
    const cookieStore = await cookies()
    const storedState = cookieStore.get('apple_oauth_state')?.value
    const contextCookie = cookieStore.get('apple_signup_context')?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Invalid OAuth state`)
    }

    // Parse signup context
    let context = { isSignUp: false, isTrial: false, returnTo: '/dashboard' }
    try {
      if (contextCookie) {
        context = JSON.parse(contextCookie)
      }
    } catch (e) {
      console.warn('Failed to parse signup context:', e)
    }

    // Parse user data if provided (only on first authorization)
    let userData: any = null
    if (user) {
      try {
        userData = JSON.parse(user)
      } catch (e) {
        console.warn('Failed to parse Apple user data:', e)
      }
    }

    // Exchange authorization code for tokens
    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/auth/apple/callback`
    
    const tokenResponse = await exchangeAppleCode(code, redirectUri)
    
    if (tokenResponse.error) {
      console.error('Apple token exchange error:', tokenResponse.error)
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Failed to exchange authorization code`)
    }

    const { access_token, refresh_token, id_token } = tokenResponse

    if (!id_token) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=No ID token received from Apple`)
    }

    // Decode the ID token to get user information
    const idTokenPayload = decodeAppleIdToken(id_token)
    
    if (!idTokenPayload.email) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Unable to retrieve email from Apple`)
    }

    // Extract user information
    const email = idTokenPayload.email
    const emailVerified = idTokenPayload.email_verified === 'true' || idTokenPayload.email_verified === true
    const providerId = idTokenPayload.sub
    
    // Use user data from the form if available, otherwise try to extract from email
    let name = ''
    if (userData && userData.name) {
      name = `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim()
    } else {
      // Extract name from email as fallback
      name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim()
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { socialAccounts: true }
      })

      if (existingUser) {
        // Check if Apple account is already linked
        const existingAppleAccount = existingUser.socialAccounts.find(
          account => account.provider === 'APPLE'
        )

        if (existingAppleAccount) {
          // Update existing Apple account tokens
          await prisma.socialAccount.update({
            where: { id: existingAppleAccount.id },
            data: {
              accessToken: access_token ? encryptToken(access_token) : null,
              refreshToken: refresh_token ? encryptToken(refresh_token) : null,
              name: name || existingAppleAccount.name,
            }
          })
        } else {
          // Link new Apple account to existing user
          await prisma.socialAccount.create({
            data: {
              userId: existingUser.id,
              provider: 'APPLE',
              providerId,
              email,
              name,
              accessToken: access_token ? encryptToken(access_token) : null,
              refreshToken: refresh_token ? encryptToken(refresh_token) : null,
            }
          })
        }

        // For existing users, redirect with linking success message
        return NextResponse.redirect(`${getBaseUrl()}/dashboard?linked=apple`)
      }

      // Create new user account
      if (context.isSignUp || context.isTrial) {
        // Generate username from email
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + 
                        Math.random().toString(36).substring(2, 6)

        // Create Supabase user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: emailVerified,
          user_metadata: {
            name,
            provider: 'apple',
          }
        })

        if (authError || !authData.user) {
          console.error('Supabase user creation error:', authError)
          return NextResponse.redirect(`${getBaseUrl()}/login?error=Failed to create user account`)
        }

        // Create user profile
        const newUser = await prisma.user.create({
          data: {
            id: authData.user.id,
            email,
            username,
            country: 'US', // Default, can be updated later
            currency: 'USD', // Default, can be updated later
            displayName: name,
            socialAccounts: {
              create: {
                provider: 'APPLE',
                providerId,
                email,
                name,
                accessToken: access_token ? encryptToken(access_token) : null,
                refreshToken: refresh_token ? encryptToken(refresh_token) : null,
              }
            }
          }
        })

        // Send welcome email if configured
        try {
          await fetch(`${baseUrl}/api/email/confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              displayName: name || username,
              appName: 'Invoice Pro',
            }),
          })
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError)
        }

        return NextResponse.redirect(`${getBaseUrl()}/dashboard?welcome=true&provider=apple`)
      }

      // User doesn't exist and not signing up
      return NextResponse.redirect(`${getBaseUrl()}/signup?prefill=${encodeURIComponent(email)}&provider=apple`)

    } catch (dbError) {
      console.error('Database error during Apple OAuth:', dbError)
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Database error occurred`)
    } finally {
      // Clean up OAuth cookies
      cookieStore.delete('apple_oauth_state')
      cookieStore.delete('apple_signup_context')
    }

  } catch (error) {
    console.error('Apple OAuth callback error:', error)
    return NextResponse.redirect(`${getBaseUrl()}/login?error=Authentication failed`)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle GET requests (redirect to POST handler)
export async function GET(request: NextRequest) {
  return NextResponse.redirect(`${getBaseUrl()}/login?error=Apple Sign In requires POST method`)
}