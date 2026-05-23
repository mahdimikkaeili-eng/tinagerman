import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, date, time, isTrial } = body

    // Validate required fields
    if (!courseId || !date || !time) {
      return NextResponse.json(
        { error: 'Course ID, date, and time are required' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      )
    }

    // If trial booking, check if user has already used their trial
    if (isTrial) {
      const user = await db.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.isTrialUsed) {
        return NextResponse.json(
          { error: 'You have already used your free trial lesson' },
          { status: 400 }
        )
      }
    }

    // Check for conflicting booking (same date and time)
    const existingBooking = await db.booking.findFirst({
      where: {
        userId,
        date,
        time,
        status: { in: ['pending', 'confirmed'] },
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a booking at this time' },
        { status: 409 }
      )
    }

    // Generate Google Meet link placeholder
    const meetId = `${date}-${time}-${userId.slice(-6)}`.replace(/[^a-zA-Z0-9-]/g, '')
    const meetLink = `https://meet.google.com/placeholder-${meetId}`

    // Create booking
    const booking = await db.booking.create({
      data: {
        userId,
        courseId,
        date,
        time,
        isTrial: isTrial || false,
        meetLink,
        status: isTrial ? 'confirmed' : 'pending',
      },
      include: {
        course: true,
      },
    })

    // If trial, mark user's trial as used
    if (isTrial) {
      await db.user.update({
        where: { id: userId },
        data: { isTrialUsed: true },
      })
    }

    return NextResponse.json(
      { booking, message: 'Booking created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
