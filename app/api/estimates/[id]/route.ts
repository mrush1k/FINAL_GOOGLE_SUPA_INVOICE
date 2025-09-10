import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimate = await prisma.estimate.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        customer: true,
        items: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

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

    return NextResponse.json(formattedEstimate)
  } catch (error) {
    console.error('Error fetching estimate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const updatedEstimate = await prisma.estimate.update({
      where: { id: id },
      data: {
        status: data.status,
        notes: data.notes,
        terms: data.terms,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined
      },
      include: {
        customer: true,
        items: true
      }
    })

    const formattedEstimate = {
      ...updatedEstimate,
      subtotal: Number(updatedEstimate.subtotal),
      taxAmount: Number(updatedEstimate.taxAmount),
      total: Number(updatedEstimate.total),
      items: updatedEstimate.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    }

    return NextResponse.json(formattedEstimate)
  } catch (error) {
    console.error('Error updating estimate:', error)
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimate = await prisma.estimate.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    await prisma.estimate.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Estimate deleted successfully' })
  } catch (error) {
    console.error('Error deleting estimate:', error)
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    )
  }
}