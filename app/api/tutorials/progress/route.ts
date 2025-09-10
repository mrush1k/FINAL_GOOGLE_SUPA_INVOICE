import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

// GET /api/tutorials/progress?userId=...&tutorialId=...
export async function GET(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const tutorialId = searchParams.get('tutorialId')

    if (!userId || !tutorialId) {
      return NextResponse.json({ error: 'Missing userId or tutorialId' }, { status: 400 })
    }

    // Users can only access their own tutorial progress
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userTutorial = await prisma.userTutorial.findUnique({
      where: {
        userId_tutorialId: {
          userId,
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
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!userId || !tutorialId || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Users can only create tutorial progress for themselves
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userTutorial = await prisma.userTutorial.create({
      data: {
        userId,
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
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!userId || !tutorialId || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Users can only update their own tutorial progress
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userTutorial = await prisma.userTutorial.upsert({
      where: {
        userId_tutorialId: {
          userId,
          tutorialId
        }
      },
      update: {
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null
      },
      create: {
        userId,
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