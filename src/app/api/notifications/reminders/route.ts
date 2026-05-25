import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// POST /api/notifications/reminders - Check for upcoming bookings and create reminder notifications
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current date/time in Vienna timezone
    const now = new Date()
    const viennaOffset = getTimezoneOffset('Europe/Vienna', now)
    const localNow = new Date(now.getTime() + viennaOffset)

    // Calculate the 30-minute window
    const thirtyMinutesFromNow = new Date(localNow.getTime() + 30 * 60 * 1000)
    const fiveMinutesFromNow = new Date(localNow.getTime() + 5 * 60 * 1000)

    // Format dates for comparison
    const todayStr = formatDate(localNow)

    // Find bookings that are within the next 30 minutes
    // Bookings have date (YYYY-MM-DD) and time (HH:mm) fields
    const upcomingBookings = await db.booking.findMany({
      where: {
        userId,
        status: { in: ['pending', 'confirmed'] },
        date: todayStr,
      },
      include: {
        course: true,
      },
    })

    // Filter to only those within the 30-minute window
    const bookingsInWindow = upcomingBookings.filter((booking) => {
      const [hours, minutes] = booking.time.split(':').map(Number)
      const bookingTime = new Date(localNow)
      bookingTime.setHours(hours, minutes, 0, 0)

      return bookingTime > localNow && bookingTime <= thirtyMinutesFromNow
    })

    if (bookingsInWindow.length === 0) {
      return NextResponse.json({
        message: 'No upcoming bookings within the reminder window',
        remindersCreated: 0,
      })
    }

    // Check for existing reminder notifications for these bookings
    const bookingIds = bookingsInWindow.map((b) => b.id)
    const existingReminders = await db.notification.findMany({
      where: {
        userId,
        type: 'reminder',
        bookingId: { in: bookingIds },
      },
    })
    const existingReminderBookingIds = new Set(existingReminders.map((r) => r.bookingId))

    // Create reminder notifications for bookings that don't already have one
    let remindersCreated = 0

    for (const booking of bookingsInWindow) {
      // Skip if a reminder already exists for this booking
      if (existingReminderBookingIds.has(booking.id)) {
        continue
      }

      // Determine action URL: prefer meetLink, fallback to WhatsApp
      const actionUrl = booking.meetLink || 'https://wa.me/4367763401913?text=Hi%20Tina!%20I%27m%20ready%20for%20my%20lesson.'

      // Build message with course info
      const courseTitle = booking.course?.title || 'German lesson'
      const courseTitleDe = booking.course?.titleDe || 'Deutschstunde'
      const minutesUntil = getMinutesUntilBooking(booking.time, localNow)

      const message = `Your ${courseTitle} with Tina starts in ${minutesUntil} minutes`
      const messageDe = `Ihre ${courseTitleDe} mit Tina beginnt in ${minutesUntil} Minuten`

      await db.notification.create({
        data: {
          userId,
          title: 'Class Reminder',
          message: `${message} / ${messageDe}`,
          type: 'reminder',
          actionUrl,
          bookingId: booking.id,
        },
      })

      remindersCreated++
    }

    return NextResponse.json({
      message: remindersCreated > 0
        ? `${remindersCreated} reminder(s) created`
        : 'Reminders already exist for all upcoming bookings',
      remindersCreated,
    })
  } catch (error) {
    console.error('Create reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get the timezone offset in milliseconds for a given IANA timezone
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  // Create a formatter for the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Parse the formatted parts to get local time
  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0'

  const localDate = new Date(
    parseInt(getPart('year')),
    parseInt(getPart('month')) - 1,
    parseInt(getPart('day')),
    parseInt(getPart('hour')),
    parseInt(getPart('minute')),
    parseInt(getPart('second'))
  )

  // Return the offset between UTC and the local timezone
  return localDate.getTime() - date.getTime()
}

/**
 * Format a Date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate minutes until a booking time (HH:mm) from the current local time
 */
function getMinutesUntilBooking(bookingTime: string, now: Date): number {
  const [hours, minutes] = bookingTime.split(':').map(Number)
  const bookingDate = new Date(now)
  bookingDate.setHours(hours, minutes, 0, 0)

  const diffMs = bookingDate.getTime() - now.getTime()
  return Math.max(1, Math.round(diffMs / (60 * 1000)))
}
