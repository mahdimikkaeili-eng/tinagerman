import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/notifications/[id] - Mark notification as read
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

    // Check if notification exists
    const existingNotification = await db.notification.findUnique({
      where: { id },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Check if user owns this notification
    if (existingNotification.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this notification' },
        { status: 403 }
      )
    }

    // Mark as read
    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ notification, message: 'Notification marked as read' })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete a notification
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

    // Check if notification exists
    const existingNotification = await db.notification.findUnique({
      where: { id },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Only the notification owner can delete
    if (existingNotification.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this notification' },
        { status: 403 }
      )
    }

    await db.notification.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
