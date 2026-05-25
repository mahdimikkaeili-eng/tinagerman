import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/homework - Get homework for a student
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
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')

    if (!studentId && !teacherId) {
      return NextResponse.json(
        { error: 'studentId or teacherId query parameter is required' },
        { status: 400 }
      )
    }

    // Check if user is authorized to view this homework
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Authorization checks
    if (teacherId) {
      // Only the teacher themselves (or admin) can view homework by teacherId
      if (teacherId !== userId && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to view this homework' },
          { status: 403 }
        )
      }
    } else if (studentId) {
      // Only the student themselves or a teacher can view homework by studentId
      if (studentId !== userId && user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to view this homework' },
          { status: 403 }
        )
      }
    }

    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (teacherId) {
      where.teacherId = teacherId
    } else if (studentId) {
      where.studentId = studentId
    }
    if (status) {
      where.status = status
    }

    const homeworks = await db.homework.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, avatar: true },
        },
        student: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ homeworks })
  } catch (error) {
    console.error('Get homework error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/homework - Assign homework (teacher only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is a teacher
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only teachers can assign homework' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, title, description, dueDate } = body

    // Validate required fields
    if (!studentId || !title || !description) {
      return NextResponse.json(
        { error: 'Student ID, title, and description are required' },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await db.user.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Create homework
    const homework = await db.homework.create({
      data: {
        teacherId: userId,
        studentId,
        title,
        description,
        dueDate: dueDate || null,
        status: 'assigned',
      },
      include: {
        teacher: {
          select: { id: true, name: true, avatar: true },
        },
        student: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(
      { homework, message: 'Homework assigned successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Assign homework error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
