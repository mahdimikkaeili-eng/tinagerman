import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/homework/[id] - Update homework (status, feedback)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if homework exists
    const existingHomework = await db.homework.findUnique({
      where: { id },
    })

    if (!existingHomework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, feedback } = body

    // Validate status
    const validStatuses = ['assigned', 'submitted', 'reviewed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: assigned, submitted, reviewed' },
        { status: 400 }
      )
    }

    // Students can only mark homework as "submitted"
    if (existingHomework.studentId === userId && user.role === 'student') {
      if (status && status !== 'submitted') {
        return NextResponse.json(
          { error: 'Students can only submit homework' },
          { status: 403 }
        )
      }
    }
    // Teachers can update status and add feedback
    else if (existingHomework.teacherId === userId || user.role === 'admin') {
      // Allow all updates
    } else {
      return NextResponse.json(
        { error: 'Not authorized to update this homework' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (feedback !== undefined) updateData.feedback = feedback

    const homework = await db.homework.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: { id: true, name: true, avatar: true },
        },
        student: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ homework, message: 'Homework updated successfully' })
  } catch (error) {
    console.error('Update homework error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
