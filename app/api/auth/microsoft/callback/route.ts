import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { supabase } from '@/lib/supabase'
import { 
  exchangeMicrosoftCode,
  getMicrosoftUserInfo,
  encryptToken,
  getBaseUrl
} from '@/lib/social-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      const errorMap: Record<string, string> = {
        'access_denied': 'You denied access to your Microsoft account',
        'invalid_request': 'Invalid OAuth request',
        'unauthorized_client': 'Unauthorized OAuth client',
        'unsupported_response_type': 'Unsupported OAuth response type',
        'invalid_scope': 'Invalid OAuth scope requested',
        'server_error': 'Microsoft OAuth server error',
        'temporarily_unavailable': 'Microsoft OAuth temporarily unavailable',
        'invalid_client': 'Invalid Microsoft OAuth client configuration',
        'invalid_grant': 'Invalid or expired authorization grant'
      }
      
      const errorMessage = errorMap[error] || errorDescription || 'Microsoft authentication failed'
      return NextResponse.redirect(`${getBaseUrl()}/login?error=${encodeURIComponent(errorMessage)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Missing authorization code`)
    }

    // Retrieve and validate stored OAuth state
    const cookieStore = await cookies()
    const storedState = cookieStore.get('microsoft_oauth_state')?.value
    const codeVerifier = cookieStore.get('microsoft_code_verifier')?.value
    const contextCookie = cookieStore.get('microsoft_signup_context')?.value

    if (!storedState || !codeVerifier || storedState !== state) {
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

    // Exchange authorization code for tokens
    const baseUrl = getBaseUrl()
    const redirectUri = `${baseUrl}/api/auth/microsoft/callback`
    
    const tokenResponse = await exchangeMicrosoftCode(code, redirectUri, codeVerifier)
    
    if (tokenResponse.error) {
      console.error('Microsoft token exchange error:', tokenResponse.error)
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Failed to exchange authorization code`)
    }

    const { access_token, refresh_token, expires_in } = tokenResponse

    // Get user info from Microsoft Graph
    const userInfo = await getMicrosoftUserInfo(access_token)
    
    if (!userInfo.mail && !userInfo.userPrincipalName) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Unable to retrieve email from Microsoft`)
    }

    // Use mail or userPrincipalName as email
    const email = userInfo.mail || userInfo.userPrincipalName
    const name = userInfo.displayName || `${userInfo.givenName || ''} ${userInfo.surname || ''}`.trim()

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (expires_in * 1000))

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { socialAccounts: true }
      })

      if (existingUser) {
        // Check if Microsoft account is already linked
        const existingMicrosoftAccount = existingUser.socialAccounts.find(
          account => account.provider === 'MICROSOFT'
        )

        if (existingMicrosoftAccount) {
          // Update existing Microsoft account tokens
          await prisma.socialAccount.update({
            where: { id: existingMicrosoftAccount.id },
            data: {
              accessToken: encryptToken(access_token),
              refreshToken: refresh_token ? encryptToken(refresh_token) : null,
              tokenExpiry,
              name,
              // Microsoft Graph doesn't provide avatar URL directly
            }
          })
        } else {
          // Link new Microsoft account to existing user
          await prisma.socialAccount.create({
            data: {
              userId: existingUser.id,
              provider: 'MICROSOFT',
              providerId: userInfo.id,
              email,
              name,
              accessToken: encryptToken(access_token),
              refreshToken: refresh_token ? encryptToken(refresh_token) : null,
              tokenExpiry,
            }
          })
        }

        // For existing users, redirect with linking success message
        return NextResponse.redirect(`${getBaseUrl()}/dashboard?linked=microsoft`)
      }

      // Create new user account
      if (context.isSignUp || context.isTrial) {
        // Generate username from email
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + 
                        Math.random().toString(36).substring(2, 6)

        // Create Supabase user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            name,
            provider: 'microsoft',
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
                provider: 'MICROSOFT',
                providerId: userInfo.id,
                email,
                name,
                accessToken: encryptToken(access_token),
                refreshToken: refresh_token ? encryptToken(refresh_token) : null,
                tokenExpiry,
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

        return NextResponse.redirect(`${getBaseUrl()}/dashboard?welcome=true&provider=microsoft`)
      }

      // User doesn't exist and not signing up
      return NextResponse.redirect(`${getBaseUrl()}/signup?prefill=${encodeURIComponent(email)}&provider=microsoft`)

    } catch (dbError) {
      console.error('Database error during Microsoft OAuth:', dbError)
      return NextResponse.redirect(`${getBaseUrl()}/login?error=Database error occurred`)
    } finally {
      // Clean up OAuth cookies
      cookieStore.delete('microsoft_oauth_state')
      cookieStore.delete('microsoft_code_verifier')
      cookieStore.delete('microsoft_signup_context')
    }

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error)
    return NextResponse.redirect(`${getBaseUrl()}/login?error=Authentication failed`)
  } finally {
    await prisma.$disconnect()
  }
}