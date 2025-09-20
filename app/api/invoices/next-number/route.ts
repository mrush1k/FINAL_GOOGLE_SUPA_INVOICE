import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the highest invoice number for this user
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId: user.id },
      orderBy: { number: 'desc' },
      select: { number: true }
    })

    let nextNumber = '#0001'
    
    if (lastInvoice && lastInvoice.number) {
      // Extract the number part from "#0001" format
      const match = lastInvoice.number.match(/#(\d+)/)
      if (match) {
        const lastNum = parseInt(match[1], 10)
        const nextNum = lastNum + 1
        nextNumber = `#${nextNum.toString().padStart(4, '0')}`
      }
    }

    return NextResponse.json({ nextNumber })
  } catch (error) {
    console.error('Error generating next invoice number:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice number' },
      { status: 500 }
    )
  }
}