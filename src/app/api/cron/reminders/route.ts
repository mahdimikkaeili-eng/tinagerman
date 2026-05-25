import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  findUpcomingBookings,
  reminderExists,
  sendClassReminder,
  getViennaNow,
  getMinutesUntilBooking,
} from '@/lib/notifications'

/**
 * GET /api/cron/reminders?secret=YOUR_SECRET
 *
 * Server-side cron endpoint for automatic class reminders.
 * Called by an external cron service (e.g. cron-job.org, GitHub Actions, or a simple curl).
 * Protected by CRON_SECRET query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    // ── Verify CRON_SECRET ─────────────────────────────────────────────────
    const { searchParams } = new URL(request.url)
    const providedSecret = searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      console.error('CRON_SECRET is not configured in environment variables')
      return NextResponse.json(
        { error: 'Cron service not configured' },
        { status: 500 }
      )
    }

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid or missing secret' },
        { status: 401 }
      )
    }

    // ── Find upcoming bookings ──────────────────────────────────────────────
    const upcomingBookings = await findUpcomingBookings(30)

    if (upcomingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming bookings within the reminder window',
        processed: 0,
        remindersSent: 0,
        skipped: 0,
        errors: 0,
        viennaTime: getViennaNow().toISOString(),
      })
    }

    // ── Process each booking ────────────────────────────────────────────────
    let remindersSent = 0
    let skipped = 0
    let errors = 0
    const details: Array<{
      bookingId: string
      userId: string
      status: 'sent' | 'skipped' | 'error'
      minutesUntil: number
      telegram: boolean
      whatsappLink?: string
    }> = []

    for (const booking of upcomingBookings) {
      try {
        // Check if a reminder already exists for this booking
        const exists = await reminderExists(booking.userId, booking.id)
        if (exists) {
          skipped++
          details.push({
            bookingId: booking.id,
            userId: booking.userId,
            status: 'skipped',
            minutesUntil: getMinutesUntilBooking(booking.time, getViennaNow()),
            telegram: false,
          })
          continue
        }

        // Get user info
        const user = await db.user.findUnique({
          where: { id: booking.userId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            telegramChatId: true,
            nativeLanguage: true,
          },
        })

        if (!user) {
          skipped++
          details.push({
            bookingId: booking.id,
            userId: booking.userId,
            status: 'skipped',
            minutesUntil: getMinutesUntilBooking(booking.time, getViennaNow()),
            telegram: false,
          })
          continue
        }

        // Send reminder (in-app notification + Telegram)
        const result = await sendClassReminder(booking, user)

        remindersSent++
        details.push({
          bookingId: booking.id,
          userId: booking.userId,
          status: 'sent',
          minutesUntil: getMinutesUntilBooking(booking.time, getViennaNow()),
          telegram: result.telegram,
          whatsappLink: result.whatsappLink,
        })
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error)
        errors++
        details.push({
          bookingId: booking.id,
          userId: booking.userId,
          status: 'error',
          minutesUntil: getMinutesUntilBooking(booking.time, getViennaNow()),
          telegram: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${upcomingBookings.length} booking(s): ${remindersSent} reminders sent, ${skipped} skipped, ${errors} errors`,
      processed: upcomingBookings.length,
      remindersSent,
      skipped,
      errors,
      details,
      viennaTime: getViennaNow().toISOString(),
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
