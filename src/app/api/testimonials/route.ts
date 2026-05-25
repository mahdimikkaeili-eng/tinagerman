import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/testimonials - Get approved testimonials (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approvedOnly = searchParams.get('approvedOnly') !== 'false'

    const where: Record<string, unknown> = {}
    if (approvedOnly) {
      where.isApproved = true
    }

    const testimonials = await db.testimonial.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, germanLevel: true, nativeLanguage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ testimonials })
  } catch (error) {
    console.error('Get testimonials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/testimonials - Submit a testimonial (logged-in users only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating, comment } = body

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please write at least 10 characters' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user already submitted a testimonial
    const existing = await db.testimonial.findFirst({
      where: { userId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a review' },
        { status: 400 }
      )
    }

    const testimonial = await db.testimonial.create({
      data: {
        userId,
        rating,
        comment: comment.trim(),
        isApproved: false,
      },
      include: {
        user: {
          select: { id: true, name: true, germanLevel: true },
        },
      },
    })

    return NextResponse.json(
      { testimonial, message: 'Review submitted! It will appear after approval.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Submit testimonial error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
