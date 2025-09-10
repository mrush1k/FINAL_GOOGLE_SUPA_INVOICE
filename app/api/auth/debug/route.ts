import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/social-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = getBaseUrl()
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  
  return NextResponse.json({
    baseUrl,
    redirectUri,
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'configured' : 'missing',
    environment: process.env.NODE_ENV,
  })
}