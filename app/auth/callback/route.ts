import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // After successful OAuth, ensure user exists in Prisma database
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Check if user already exists in Prisma
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id }
          })
          
          if (!existingUser) {
            // Create user record for OAuth user
            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email || '',
                username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                country: 'US', // Default values
                currency: 'USD',
                displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                firstName: user.user_metadata?.given_name || '',
                lastName: user.user_metadata?.family_name || '',
              }
            })
            console.log('Created user record during OAuth callback:', user.id)
          }
        }
      } catch (dbError) {
        console.error('Error creating user in database during OAuth callback:', dbError)
        // Don't fail the login flow, just log the error
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}