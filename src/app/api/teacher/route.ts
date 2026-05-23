import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teacher - Get teacher profile (Tina)
export async function GET() {
  try {
    const teacher = await db.user.findFirst({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        timezone: true,
        nativeLanguage: true,
        germanLevel: true,
        createdAt: true,
      },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found. Please seed the database first.' },
        { status: 404 }
      )
    }

    // Get teacher stats
    const totalBookings = await db.booking.count({
      where: { status: { in: ['completed', 'confirmed'] } },
    })

    const completedBookings = await db.booking.count({
      where: { status: 'completed' },
    })

    return NextResponse.json({
      teacher,
      stats: {
        totalSessions: completedBookings,
        activeBookings: totalBookings - completedBookings,
      },
    })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
