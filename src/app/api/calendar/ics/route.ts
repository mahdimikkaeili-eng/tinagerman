import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateIcsContent } from '@/lib/calendar'

// GET /api/calendar/ics?bookingId=xxx - Download .ics file for a booking
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: true,
        user: {
          select: { id: true, name: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify the user is either the student or the teacher
    if (booking.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user || user.role !== 'teacher') {
        return NextResponse.json(
          { error: 'Not authorized' },
          { status: 403 }
        )
      }
    }

    const isTrial = booking.isTrial
    const studentName = booking.user.name
    const courseLevel = booking.course.level

    const icsContent = generateIcsContent({
      title: `${courseLevel} German Lesson - Deutsch mit Tina`,
      description: isTrial
        ? `Free trial German lesson with Tina\nStudent: ${studentName}\nLevel: ${courseLevel}`
        : `German lesson with Tina\nStudent: ${studentName}\nLevel: ${courseLevel}`,
      startDate: booking.date,
      startTime: booking.time,
      durationMinutes: booking.course.duration,
      location: booking.meetLink || undefined,
      uid: booking.id,
      timezone: 'Europe/Vienna',
    })

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="deutsch-mit-tina-${booking.date}.ics"`,
      },
    })
  } catch (error) {
    console.error('ICS generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
