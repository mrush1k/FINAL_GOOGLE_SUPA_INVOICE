import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  const buildTime = Date.now()
  const version = 'oauth-fix-v2.0'
  
  return NextResponse.json({
    status: 'healthy',
    version,
    buildTime,
    timestamp: new Date().toISOString(),
    oauth: {
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      baseUrl: process.env.NEXTAUTH_URL || 'not-configured',
      environment: process.env.NODE_ENV || 'unknown'
    },
    server: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage()
    }
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Version': version,
      'X-Build-Time': buildTime.toString()
    }
  })
}