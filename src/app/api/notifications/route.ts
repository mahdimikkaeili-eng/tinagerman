import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/notifications - Get notifications for the authenticated user
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 100' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get unread count
    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, title, message, type, actionUrl, bookingId } = body

    // Validate required fields
    if (!targetUserId || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, title, and message are required' },
        { status: 400 }
      )
    }

    // Validate type if provided
    const validTypes = ['info', 'reminder', 'booking', 'approval']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: info, reminder, booking, approval' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // If bookingId provided, verify booking exists
    if (bookingId) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
      })
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
    }

    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        title,
        message,
        type: type || 'info',
        actionUrl: actionUrl || null,
        bookingId: bookingId || null,
      },
    })

    return NextResponse.json(
      { notification, message: 'Notification created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
