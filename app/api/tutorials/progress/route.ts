import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

// GET /api/tutorials/progress?tutorialId=...
export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tutorialId = searchParams.get('tutorialId')

    if (!tutorialId) {
      return NextResponse.json({ error: 'Missing tutorialId' }, { status: 400 })
    }

    const userTutorial = await prisma.userTutorial.findUnique({
      where: {
        userId_tutorialId: {
          userId: user.id,
          tutorialId
        }
      }
    })

    if (!userTutorial) {
      return NextResponse.json({ error: 'Tutorial progress not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: userTutorial.id,
      userId: userTutorial.userId,
      tutorialId: userTutorial.tutorialId,
      completed: userTutorial.completed,
      currentStep: userTutorial.currentStep,
      completedAt: userTutorial.completedAt,
      createdAt: userTutorial.createdAt
    })

  } catch (error) {
    console.error('Error fetching tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tutorials/progress
export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!tutorialId || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userTutorial = await prisma.userTutorial.upsert({
      where: {
        userId_tutorialId: {
          userId: user.id,
          tutorialId
        }
      },
      update: {
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null
      },
      create: {
        userId: user.id,
        tutorialId,
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null
      }
    })

    return NextResponse.json({
      id: userTutorial.id,
      userId: userTutorial.userId,
      tutorialId: userTutorial.tutorialId,
      completed: userTutorial.completed,
      currentStep: userTutorial.currentStep,
      completedAt: userTutorial.completedAt,
      createdAt: userTutorial.createdAt
    })

  } catch (error) {
    console.error('Error creating tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tutorials/progress
export async function PUT(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!tutorialId || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userTutorial = await prisma.userTutorial.upsert({
      where: {
        userId_tutorialId: {
          userId: user.id,
          tutorialId
        }
      },
      update: {
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null
      },
      create: {
        userId: user.id,
        tutorialId,
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null
      }
    })

    return NextResponse.json({
      id: userTutorial.id,
      userId: userTutorial.userId,
      tutorialId: userTutorial.tutorialId,
      completed: userTutorial.completed,
      currentStep: userTutorial.currentStep,
      completedAt: userTutorial.completedAt,
      createdAt: userTutorial.createdAt
    })

  } catch (error) {
    console.error('Error updating tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}