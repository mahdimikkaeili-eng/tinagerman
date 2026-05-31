import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/bookings/[id] - Update booking status, reschedule, or cancel
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

    const body = await request.json()
    const { status, notes, date, time } = body

    // Check if booking exists
    const existingBooking = await db.booking.findUnique({
      where: { id },
      include: { course: true, user: true },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user owns this booking or is a teacher
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingBooking.userId !== userId && user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to update this booking' },
        { status: 403 }
      )
    }

    // Handle reschedule: student provides new date/time
    if (date || time) {
      // Validate date format (YYYY-MM-DD)
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }

      // Validate time format (HH:mm)
      if (time && !/^\d{2}:\d{2}$/.test(time)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:mm' },
          { status: 400 }
        )
      }

      // Validate the new date/time is in the future
      const newDate = date || existingBooking.date
      const newTime = time || existingBooking.time
      const newDateTime = new Date(`${newDate}T${newTime}:00`)
      if (newDateTime <= new Date()) {
        return NextResponse.json(
          { error: 'Cannot reschedule to a date/time in the past' },
          { status: 400 }
        )
      }

      // Only allow reschedule for pending or confirmed bookings
      if (existingBooking.status !== 'pending' && existingBooking.status !== 'confirmed') {
        return NextResponse.json(
          { error: 'Can only reschedule pending or confirmed bookings' },
          { status: 400 }
        )
      }

      const updateData: Record<string, unknown> = {
        date: newDate,
        time: newTime,
        status: 'pending', // Reset to pending so teacher knows it was rescheduled
      }
      if (notes !== undefined) updateData.notes = notes

      const booking = await db.booking.update({
        where: { id },
        data: updateData,
        include: {
          course: true,
        },
      })

      // Create notification for the teacher
      try {
        const teacher = await db.user.findFirst({
          where: { role: 'teacher' },
        })
        if (teacher) {
          await db.notification.create({
            data: {
              userId: teacher.id,
              title: 'Booking Rescheduled / Buchung verschoben',
              message: `${existingBooking.user.name} rescheduled their ${existingBooking.course.title} lesson to ${newDate} at ${newTime} / ${existingBooking.user.name} hat die ${existingBooking.course.titleDe}-Stunde auf den ${newDate} um ${newTime} verschoben`,
              type: 'booking',
              bookingId: booking.id,
            },
          })
        }
      } catch {
        // Notification creation failure shouldn't block reschedule
      }

      return NextResponse.json({ booking, message: 'Booking rescheduled successfully' })
    }

    // Handle status update (cancel, confirm, complete, etc.)
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        course: true,
      },
    })

    // Create notification for cancellation by student
    if (status === 'cancelled' && existingBooking.userId === userId && user.role !== 'teacher') {
      try {
        const teacher = await db.user.findFirst({
          where: { role: 'teacher' },
        })
        if (teacher) {
          await db.notification.create({
            data: {
              userId: teacher.id,
              title: 'Booking Cancelled / Buchung storniert',
              message: `${existingBooking.user.name} cancelled their ${existingBooking.course.title} lesson on ${existingBooking.date} at ${existingBooking.time} / ${existingBooking.user.name} hat die ${existingBooking.course.titleDe}-Stunde am ${existingBooking.date} um ${existingBooking.time} storniert`,
              type: 'booking',
              bookingId: booking.id,
            },
          })
        }
      } catch {
        // Notification creation failure shouldn't block cancellation
      }
    }

    return NextResponse.json({ booking, message: 'Booking updated successfully' })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
