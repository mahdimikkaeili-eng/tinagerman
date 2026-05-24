import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/teacher/students - Get all students with booking counts
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

    const students = await db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        nativeLanguage: true,
        germanLevel: true,
        avatar: true,
        phone: true,
        isTrialUsed: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      nativeLanguage: student.nativeLanguage,
      germanLevel: student.germanLevel,
      avatar: student.avatar,
      phone: student.phone,
      isTrialUsed: student.isTrialUsed,
      createdAt: student.createdAt,
      bookingCount: student._count.bookings,
    }))

    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.error('Get teacher students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
