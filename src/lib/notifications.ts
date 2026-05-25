/**
 * Shared notification service
 * Handles in-app notifications, Telegram messages, and WhatsApp links
 */

import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

// ── Types ────────────────────────────────────────────────────────────────────

interface BookingWithCourse {
  id: string
  userId: string
  courseId: string
  date: string
  time: string
  status: string
  meetLink: string | null
  notes: string | null
  course: {
    id: string
    title: string
    titleDe: string
    level: string
  } | null
}

interface UserWithTelegram {
  id: string
  name: string
  email: string
  phone: string | null
  telegramChatId: string | null
  nativeLanguage: string | null
}

type NotificationType = 'reminder' | 'booking' | 'info' | 'approval'

// ── Timezone Helpers ─────────────────────────────────────────────────────────

/**
 * Get the timezone offset in milliseconds for a given IANA timezone
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
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

  return localDate.getTime() - date.getTime()
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate minutes until a booking time (HH:mm) from the current local time
 */
export function getMinutesUntilBooking(bookingTime: string, now: Date): number {
  const [hours, minutes] = bookingTime.split(':').map(Number)
  const bookingDate = new Date(now)
  bookingDate.setHours(hours, minutes, 0, 0)

  const diffMs = bookingDate.getTime() - now.getTime()
  return Math.max(1, Math.round(diffMs / (60 * 1000)))
}

/**
 * Get current Vienna local time
 */
export function getViennaNow(): Date {
  const now = new Date()
  const viennaOffset = getTimezoneOffset('Europe/Vienna', now)
  return new Date(now.getTime() + viennaOffset)
}

// ── Notification Functions ───────────────────────────────────────────────────

/**
 * Create an in-app notification in the database
 */
export async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  actionUrl?: string,
  bookingId?: string
) {
  return db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      ...(actionUrl && { actionUrl }),
      ...(bookingId && { bookingId }),
    },
  })
}

/**
 * Generate a WhatsApp reminder link (wa.me) with pre-filled message
 */
export function generateWhatsAppReminderLink(
  user: UserWithTelegram,
  booking: BookingWithCourse
): string {
  const courseTitle = booking.course?.title || 'German lesson'
  const minutesUntil = getMinutesUntilBooking(booking.time, getViennaNow())

  const message = encodeURIComponent(
    `Hi Tina! This is a reminder that my ${courseTitle} starts in ${minutesUntil} minutes. ` +
    `Date: ${booking.date}, Time: ${booking.time}. See you soon!`
  )

  // Use Tina's WhatsApp number (from existing code)
  return `https://wa.me/4367763401913?text=${message}`
}

/**
 * Send a class reminder to a user
 * - Creates an in-app notification
 * - Sends a Telegram message if the user has a telegramChatId
 * - Generates a WhatsApp link as fallback action URL
 */
export async function sendClassReminder(
  booking: BookingWithCourse,
  user: UserWithTelegram
): Promise<{
  inApp: boolean
  telegram: boolean
  whatsappLink: string
  error?: string
}> {
  const courseTitle = booking.course?.title || 'German lesson'
  const courseTitleDe = booking.course?.titleDe || 'Deutschstunde'
  const minutesUntil = getMinutesUntilBooking(booking.time, getViennaNow())

  // Build bilingual message
  const messageEn = `Your ${courseTitle} with Tina starts in ${minutesUntil} minutes`
  const messageDe = `Ihre ${courseTitleDe} mit Tina beginnt in ${minutesUntil} Minuten`

  // Generate WhatsApp link
  const whatsappLink = generateWhatsAppReminderLink(user, booking)

  // Determine action URL: prefer meetLink, fallback to WhatsApp
  const actionUrl = booking.meetLink || whatsappLink

  // Create in-app notification
  let inApp = false
  try {
    await createInAppNotification(
      user.id,
      'Class Reminder',
      `${messageEn} / ${messageDe}`,
      'reminder',
      actionUrl,
      booking.id
    )
    inApp = true
  } catch (error) {
    console.error(`Failed to create in-app notification for user ${user.id}:`, error)
  }

  // Send Telegram message if user has a chat ID
  let telegram = false
  if (user.telegramChatId) {
    try {
      const telegramText =
        `🔔 <b>Class Reminder</b>\n\n` +
        `${messageEn}\n${messageDe}\n\n` +
        `📅 Date: ${booking.date}\n🕐 Time: ${booking.time}\n` +
        `${booking.meetLink ? `🔗 <a href="${booking.meetLink}">Join Google Meet</a>` : ''}`

      const result = await sendTelegramMessage(user.telegramChatId, telegramText)
      telegram = result.ok
    } catch (error) {
      console.error(`Failed to send Telegram message to user ${user.id}:`, error)
    }
  }

  return {
    inApp,
    telegram,
    whatsappLink,
  }
}

/**
 * Find upcoming bookings within the next N minutes for all users
 */
export async function findUpcomingBookings(
  withinMinutes: number = 30
): Promise<BookingWithCourse[]> {
  const localNow = getViennaNow()
  const todayStr = formatDate(localNow)
  const windowEnd = new Date(localNow.getTime() + withinMinutes * 60 * 1000)

  // Find all bookings for today with pending/confirmed status
  const bookings = await db.booking.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
      date: todayStr,
    },
    include: {
      course: true,
    },
  })

  // Filter to only those within the time window
  return bookings.filter((booking) => {
    const [hours, minutes] = booking.time.split(':').map(Number)
    const bookingTime = new Date(localNow)
    bookingTime.setHours(hours, minutes, 0, 0)

    // Booking must be in the future but within the window
    return bookingTime > localNow && bookingTime <= windowEnd
  })
}

/**
 * Check if a reminder notification already exists for a booking + user
 */
export async function reminderExists(
  userId: string,
  bookingId: string
): Promise<boolean> {
  const existing = await db.notification.findFirst({
    where: {
      userId,
      type: 'reminder',
      bookingId,
    },
  })
  return !!existing
}
