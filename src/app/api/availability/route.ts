import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/availability - Get available time slots
// All times are stored in Vienna timezone. Accepts an optional `timezone` query parameter
// to convert the displayed slots to the requested timezone.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const targetTimezone = searchParams.get('timezone') || 'Europe/Vienna'

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
    // 30-min intervals from 09:00 to 20:30 (covers 11AM-10PM Iran time)
    const viennaTimeSlots = [
      '09:00', '09:30',
      '10:00', '10:30',
      '11:00', '11:30',
      '12:00', '12:30',
      '13:00', '13:30',
      '14:00', '14:30',
      '15:00', '15:30',
      '16:00', '16:30',
      '17:00', '17:30',
      '18:00', '18:30',
      '19:00', '19:30',
      '20:00', '20:30',
    ]

    // Convert Vienna times to target timezone if needed
    const convertTime = (viennaTime: string, tz: string): string => {
      if (tz === 'Europe/Vienna') return viennaTime
      try {
        const now = new Date()
        const viennaDateStr = now.toLocaleDateString('en-US', { timeZone: 'Europe/Vienna' })
        const [month, day, year] = viennaDateStr.split('/')
        const [hours, minutes] = viennaTime.split(':').map(Number)
        const viennaDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hours,
          minutes,
          0,
          0
        )
        return viennaDate.toLocaleTimeString('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      } catch {
        return viennaTime
      }
    }

    const availableSlots = viennaTimeSlots.map((time) => ({
      time: convertTime(time, targetTimezone),
      viennaTime: time,
      available: !bookedTimes.has(time),
    }))

    return NextResponse.json({
      date,
      timezone: targetTimezone,
      viennaTimezone: 'Europe/Vienna',
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
