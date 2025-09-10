import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'
import { CreateEstimateData } from '@/lib/types'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimates = await prisma.estimate.findMany({
      where: {
        userId: user.id
      },
      include: {
        customer: true,
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedEstimates = estimates.map(estimate => ({
      ...estimate,
      subtotal: Number(estimate.subtotal),
      taxAmount: Number(estimate.taxAmount),
      total: Number(estimate.total),
      items: estimate.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    }))

    return NextResponse.json(formattedEstimates)
  } catch (error) {
    console.error('Error fetching estimates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: CreateEstimateData = await request.json()
    
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const total = subtotal + 0 // No tax for now

    const estimate = await prisma.estimate.create({
      data: {
        userId: user.id,
        customerId: data.customerId,
        number: data.number,
        issueDate: new Date(data.issueDate),
        validUntil: new Date(data.validUntil),
        currency: data.currency,
        subtotal: subtotal,
        taxAmount: 0,
        total: total,
        notes: data.notes,
        terms: data.terms,
        items: {
          create: data.items.map(item => ({
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        customer: true,
        items: true
      }
    })

    const formattedEstimate = {
      ...estimate,
      subtotal: Number(estimate.subtotal),
      taxAmount: Number(estimate.taxAmount),
      total: Number(estimate.total),
      items: estimate.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    }

    return NextResponse.json(formattedEstimate, { status: 201 })
  } catch (error) {
    console.error('Error creating estimate:', error)
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    )
  }
}