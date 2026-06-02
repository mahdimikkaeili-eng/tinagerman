import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/homework/[id] - Update homework (status, feedback, teacher-editable fields)
// DELETE /api/homework/[id] - Delete homework (teacher who assigned it or admin only)
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
    const { status, feedback, studentAttachment, title, description, dueDate, attachment } = body

    // Validate status
    const validStatuses = ['assigned', 'submitted', 'reviewed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: assigned, submitted, reviewed' },
        { status: 400 }
      )
    }

    // Determine if user is teacher/admin
    const isTeacherOrAdmin = existingHomework.teacherId === userId || user.role === 'admin'

    // Students can only mark homework as "submitted"
    if (existingHomework.studentId === userId && user.role === 'student') {
      if (status && status !== 'submitted') {
        return NextResponse.json(
          { error: 'Students can only submit homework' },
          { status: 403 }
        )
      }
      // Students cannot edit teacher-only fields
      if (title || description || dueDate !== undefined || attachment !== undefined) {
        return NextResponse.json(
          { error: 'Students cannot edit homework details' },
          { status: 403 }
        )
      }
    }
    // Teachers can update status, add feedback, and edit homework fields
    else if (isTeacherOrAdmin) {
      // Allow all updates including title, description, dueDate, attachment
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
    if (studentAttachment !== undefined) updateData.studentAttachment = studentAttachment
    // Teacher-editable fields
    if (isTeacherOrAdmin) {
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (dueDate !== undefined) updateData.dueDate = dueDate
      if (attachment !== undefined) updateData.attachment = attachment
    }

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

// DELETE /api/homework/[id] - Delete homework (only teacher who assigned it or admin)
export async function DELETE(
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
      include: {
        teacher: {
          select: { id: true, name: true, avatar: true },
        },
        student: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!existingHomework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    // Check that the authenticated user is the teacher who assigned the homework or an admin
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingHomework.teacherId !== userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the teacher who assigned this homework or an admin can delete it' },
        { status: 403 }
      )
    }

    // Delete the homework from the database
    const deletedHomework = await db.homework.delete({
      where: { id },
    })

    return NextResponse.json({
      homework: { ...deletedHomework, teacher: existingHomework.teacher, student: existingHomework.student },
      message: 'Homework deleted successfully',
    })
  } catch (error) {
    console.error('Delete homework error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
