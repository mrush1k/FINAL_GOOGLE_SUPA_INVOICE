import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, InvoiceStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingId, event, timestamp } = body

    if (!trackingId || !event) {
      return NextResponse.json({ error: 'Missing trackingId or event' }, { status: 400 })
    }

    // Find invoice by tracking ID
    const invoice = await prisma.invoice.findFirst({
      where: { trackingId }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: any = {}
    const eventTime = timestamp ? new Date(timestamp) : new Date()

    switch (event) {
      case 'delivered':
        updateData.emailDelivered = true
        updateData.deliveryStatus = 'delivered'
        break
      
      case 'opened':
        updateData.emailOpened = true
        updateData.emailOpenedAt = eventTime
        // Update status to read if currently sent
        if (invoice.status === InvoiceStatus.SENT) {
          updateData.status = 'READ' as any
        }
        break
      
      case 'clicked':
        updateData.emailClicked = true
        updateData.emailClickedAt = eventTime
        break
      
      case 'bounced':
        updateData.emailBounced = true
        updateData.emailBouncedAt = eventTime
        updateData.deliveryStatus = 'bounced'
        break
      
      case 'failed':
        updateData.deliveryStatus = 'failed'
        break
      
      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    // Update invoice with tracking data
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: updateData
    })

    // Broadcast update via WebSocket (if available)
    // This would integrate with your WebSocket implementation
    /*
    const wsClient = getWebSocketClient()
    if (wsClient) {
      wsClient.send({
        type: 'email_tracking',
        data: {
          invoiceId: invoice.id,
          event,
          timestamp: eventTime.toISOString()
        }
      })
    }
    */

    return NextResponse.json({ 
      success: true, 
      message: `Email ${event} tracked successfully`,
      invoiceId: invoice.id
    })

  } catch (error) {
    console.error('Email tracking webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve tracking pixel
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('trackingId')

  if (trackingId) {
    // Track email open
    try {
      const invoice = await prisma.invoice.findFirst({
        where: { trackingId }
      })

      if (invoice && !invoice.emailOpened) {
        const updateData: any = {
          emailOpened: true,
          emailOpenedAt: new Date()
        }
        
        // Update status to READ if currently sent
        if (invoice.status === 'SENT') {
          updateData.status = 'READ'
        }
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: updateData
        })
      }
    } catch (error) {
      console.error('Error tracking email open:', error)
    }
  }

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}