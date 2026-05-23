import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date query parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Get existing bookings for the date
    const existingBookings = await db.booking.findMany({
      where: {
        date,
        status: { in: ['pending', 'confirmed'] },
      },
      select: { time: true },
    })

    const bookedTimes = new Set(existingBookings.map((b) => b.time))

    // Define available time slots (Vienna timezone, typical teaching hours)
    const timeSlots = [
      '09:00', '09:30',
      '10:00', '10:30',
      '11:00', '11:30',
      '12:00', '12:30',
      '14:00', '14:30',
      '15:00', '15:30',
      '16:00', '16:30',
      '17:00', '17:30',
      '18:00', '18:30',
      '19:00', '19:30',
    ]

    const availableSlots = timeSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }))

    return NextResponse.json({
      date,
      slots: availableSlots,
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
