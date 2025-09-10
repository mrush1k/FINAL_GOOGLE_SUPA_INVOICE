import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.OAUTH_ENCRYPTION_KEY || 'invoice-easy-oauth-jwt-secret'
)

export interface OAuthSession {
  userId: string
  email: string
  provider: string
  expiresAt: number
}

export async function createOAuthSession(userId: string, email: string, provider: string) {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  
  const token = await new SignJWT({
    userId,
    email,
    provider,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  // Set secure HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set('oauth_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  return token
}

export async function getOAuthSession(): Promise<OAuthSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('oauth_session')?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const session = payload as unknown as OAuthSession
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await clearOAuthSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to verify OAuth session:', error)
    await clearOAuthSession()
    return null
  }
}

export async function clearOAuthSession() {
  const cookieStore = await cookies()
  cookieStore.delete('oauth_session')
}

export async function refreshOAuthSession(session: OAuthSession) {
  return createOAuthSession(session.userId, session.email, session.provider)
}