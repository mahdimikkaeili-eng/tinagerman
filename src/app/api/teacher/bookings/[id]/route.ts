import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/teacher/bookings/[id] - Update booking status (teacher only)
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

    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, cancelled, completed' },
        { status: 400 }
      )
    }

    // Check if booking exists
    const existingBooking = await db.booking.findUnique({
      where: { id },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking
    const booking = await db.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Create notification for the student about status change
    try {
      let notifTitle = ''
      let notifMessage = ''
      let notifType = 'booking'

      if (status === 'confirmed') {
        notifTitle = 'Booking Confirmed / Buchung bestätigt'
        notifMessage = `Your ${booking.course?.title || 'lesson'} on ${existingBooking.date} at ${existingBooking.time} has been confirmed / Ihre ${booking.course?.titleDe || 'Unterrichtsstunde'} am ${existingBooking.date} um ${existingBooking.time} wurde bestätigt`
        notifType = 'booking'
      } else if (status === 'cancelled') {
        notifTitle = 'Booking Cancelled / Buchung storniert'
        notifMessage = `Your ${booking.course?.title || 'lesson'} on ${existingBooking.date} at ${existingBooking.time} has been cancelled / Ihre ${booking.course?.titleDe || 'Unterrichtsstunde'} am ${existingBooking.date} um ${existingBooking.time} wurde storniert`
        notifType = 'booking'
      } else if (status === 'completed') {
        notifTitle = 'Lesson Completed / Unterrichtsstunde abgeschlossen'
        notifMessage = `Your ${booking.course?.title || 'lesson'} on ${existingBooking.date} has been marked as completed / Ihre ${booking.course?.titleDe || 'Unterrichtsstunde'} am ${existingBooking.date} wurde als abgeschlossen markiert`
        notifType = 'info'
      }

      if (notifTitle) {
        await db.notification.create({
          data: {
            userId: booking.user.id,
            title: notifTitle,
            message: notifMessage,
            type: notifType,
            actionUrl: existingBooking.meetLink || null,
            bookingId: existingBooking.id,
          },
        })
      }
    } catch {
      // Notification creation failure shouldn't block booking update
    }

    return NextResponse.json({ booking, message: 'Booking status updated successfully' })
  } catch (error) {
    console.error('Update teacher booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
