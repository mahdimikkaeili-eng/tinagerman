import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
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
        bookings: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
            isTrial: true,
            createdAt: true,
            course: { select: { title: true, level: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedStudents = students.map((student) => {
      const bookings = student.bookings
      const completedLessons = bookings.filter(b => b.status === 'completed')
      const confirmedLessons = bookings.filter(b => b.status === 'confirmed')
      const paidLessons = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed')
      const firstLesson = bookings.length > 0 ? bookings[0].date : null

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        nativeLanguage: student.nativeLanguage,
        germanLevel: student.germanLevel,
        avatar: student.avatar,
        phone: student.phone,
        isTrialUsed: student.isTrialUsed,
        createdAt: student.createdAt,
        bookingCount: bookings.length,
        completedCount: completedLessons.length,
        confirmedCount: confirmedLessons.length,
        paidCount: paidLessons.length,
        firstLessonDate: firstLesson,
        bookings: bookings,
      }
    })

    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.error('Get teacher students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
