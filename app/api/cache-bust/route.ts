import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  const timestamp = new Date().toISOString()
  const randomId = Math.random().toString(36).substring(7)
  
  return NextResponse.json({
    message: 'Cache busted successfully',
    timestamp,
    randomId,
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    serverInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': timestamp,
      'X-Cache-Bust': randomId
    }
  })
}

export async function POST() {
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  return NextResponse.json({
    message: 'Server cache cleared',
    timestamp: new Date().toISOString()
  })
}