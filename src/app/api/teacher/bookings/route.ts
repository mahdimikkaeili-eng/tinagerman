import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/teacher/bookings - Get ALL bookings (teacher view)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

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
