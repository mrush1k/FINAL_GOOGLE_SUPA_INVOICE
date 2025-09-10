import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
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