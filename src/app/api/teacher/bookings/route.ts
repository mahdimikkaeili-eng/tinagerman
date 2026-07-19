import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/teacher/bookings - Get ALL bookings (teacher view)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify the user is a teacher
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nativeLanguage: true,
            germanLevel: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            titleDe: true,
            level: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Compute stats
    const totalBookings = await db.booking.count()
    const pendingCount = await db.booking.count({ where: { status: 'pending' } })
    const confirmedCount = await db.booking.count({ where: { status: 'confirmed' } })
    const completedCount = await db.booking.count({ where: { status: 'completed' } })
    const totalStudents = await db.user.count({ where: { role: 'student' } })

    // Upcoming confirmed/pending bookings
    const today = new Date().toISOString().split('T')[0]
    const upcomingCount = await db.booking.count({
      where: {
        status: { in: ['confirmed', 'pending'] },
        date: { gte: today },
      },
    })

    return NextResponse.json({
      bookings,
      stats: {
        totalStudents,
        upcomingLessons: upcomingCount,
        pendingBookings: pendingCount,
        completedLessons: completedCount,
        totalBookings,
        confirmedBookings: confirmedCount,
      },
    })
  } catch (error) {
    console.error('Get teacher bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/teacher/bookings - Teacher creates a lesson for a student (any date, past or future)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify the user is a teacher
    const teacher = await db.user.findUnique({
      where: { id: userId },
    })

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, courseId, date, time, notes, isTrial } = body

    // Validate required fields
    if (!studentId || !courseId || !date || !time) {
      return NextResponse.json(
        { error: 'studentId, courseId, date and time are required' },
        { status: 400 }
      )
    }

    // Validate date (YYYY-MM-DD) and time (HH:mm) formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      )
    }

    // Verify student and course exist
    const student = await db.user.findUnique({ where: { id: studentId } })
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Past lessons are recorded as completed, future ones as confirmed
    const today = new Date().toISOString().split('T')[0]
    const status = date < today ? 'completed' : 'confirmed'

    // Default meet link from site config
    const meetConfig = await db.siteConfig.findFirst({
      where: { key: 'defaultMeetLink' },
    })

    const booking = await db.booking.create({
      data: {
        userId: studentId,
        courseId,
        date,
        time,
        status,
        isTrial: Boolean(isTrial),
        meetLink: meetConfig?.value || null,
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nativeLanguage: true,
            germanLevel: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            titleDe: true,
            level: true,
          },
        },
      },
    })

    // Notify the student (only for future lessons)
    if (status === 'confirmed') {
      try {
        await db.notification.create({
          data: {
            userId: studentId,
            type: 'booking',
            title: 'New lesson scheduled',
            message: `Tina scheduled a ${course.level} lesson for you on ${date} at ${time} (Vienna time).`,
            bookingId: booking.id,
          },
        })
      } catch (e) {
        console.error('Notification create failed:', e)
      }
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Create teacher booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
