import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
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