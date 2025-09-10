import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

    // Update user to mark onboarding as completed
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true }
    })

    return NextResponse.json({ message: 'Onboarding marked as complete' })
  } catch (error) {
    console.error('Error marking onboarding complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}