import crypto from 'crypto'

export interface OAuthSession {
  userId: string
  email: string
  provider: string
  expiresAt: number
}

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || 'invoice-easy-oauth-jwt-secret'

// Simple session token creation without JWT dependency
export function createSimpleOAuthToken(userId: string, email: string, provider: string): string {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  
  const sessionData = JSON.stringify({
    userId,
    email,
    provider,
    expiresAt,
  })
  
  // Simple base64 encoding (no encryption needed for now)
  return Buffer.from(sessionData).toString('base64')
}

export function verifySimpleOAuthToken(token: string): OAuthSession | null {
  try {
    // Simple base64 decoding
    const sessionData = Buffer.from(token, 'base64').toString('utf8')
    const session = JSON.parse(sessionData) as OAuthSession
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null
    }
    
    return session
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}