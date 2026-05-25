import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

/**
 * POST /api/telegram/webhook
 *
 * Handles incoming Telegram webhook updates.
 *
 * Supported commands:
 * - /start        → Welcome message with instructions
 * - /connect email@example.com → Link Telegram account to website account
 * - /help         → Show available commands
 * - /status       → Show connection status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate Telegram update structure
    if (!body || !body.message) {
      return NextResponse.json({ ok: true })
    }

    const { message } = body
    const chatId = message?.chat?.id?.toString()
    const text = message?.text?.trim()
    const fromUser = message?.from

    if (!chatId || !text) {
      return NextResponse.json({ ok: true })
    }

    // ── /start command ──────────────────────────────────────────────────────
    if (text === '/start') {
      const welcomeText =
        `👋 Welcome to <b>Deutsch mit Tina</b>!\n\n` +
        `I can send you class reminders right here on Telegram.\n\n` +
        `To connect your account, send:\n` +
        `<code>/connect your@email.com</code>\n\n` +
        `For example: <code>/connect student@example.com</code>\n\n` +
        `Type /help to see all commands.`

      await sendTelegramMessage(chatId, welcomeText)
      return NextResponse.json({ ok: true })
    }

    // ── /help command ───────────────────────────────────────────────────────
    if (text === '/help') {
      const helpText =
        `📚 <b>Available Commands</b>\n\n` +
        `/start - Welcome message\n` +
        `/connect email@example.com - Link your Telegram to your account\n` +
        `/status - Check your connection status\n` +
        `/help - Show this help message\n\n` +
        `Once connected, you'll automatically receive class reminders 30 minutes before your lesson!`

      await sendTelegramMessage(chatId, helpText)
      return NextResponse.json({ ok: true })
    }

    // ── /connect command ────────────────────────────────────────────────────
    if (text.startsWith('/connect')) {
      const email = text.replace('/connect', '').trim().toLowerCase()

      if (!email || !email.includes('@')) {
        await sendTelegramMessage(
          chatId,
          `❌ Please provide a valid email address.\n\n` +
          `Usage: <code>/connect your@email.com</code>`
        )
        return NextResponse.json({ ok: true })
      }

      // Find user by email
      const user = await db.user.findUnique({
        where: { email },
      })

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `❌ No account found with email <code>${email}</code>.\n\n` +
          `Please make sure you're using the same email you registered with on our website.`
        )
        return NextResponse.json({ ok: true })
      }

      // Check if this chatId is already linked to another user
      const existingLinked = await db.user.findFirst({
        where: {
          telegramChatId: chatId,
          id: { not: user.id },
        },
      })

      if (existingLinked) {
        // Unlink the previous user
        await db.user.update({
          where: { id: existingLinked.id },
          data: { telegramChatId: null },
        })
      }

      // Update user with telegram chat ID
      await db.user.update({
        where: { id: user.id },
        data: { telegramChatId: chatId },
      })

      const connectText =
        `✅ <b>Account Connected!</b>\n\n` +
        `Your Telegram is now linked to:\n` +
        `👤 ${user.name}\n📧 ${user.email}\n\n` +
        `You'll receive class reminders here 30 minutes before each lesson! 🎓`

      await sendTelegramMessage(chatId, connectText)
      return NextResponse.json({ ok: true })
    }

    // ── /status command ─────────────────────────────────────────────────────
    if (text === '/status') {
      // Find user linked to this chat ID
      const user = await db.user.findFirst({
        where: { telegramChatId: chatId },
      })

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `🔗 <b>Not Connected</b>\n\n` +
          `Your Telegram is not linked to any account.\n\n` +
          `Use <code>/connect your@email.com</code> to connect.`
        )
      } else {
        // Count upcoming bookings
        const now = new Date()
        const viennaOffset = getTimezoneOffsetSimple('Europe/Vienna', now)
        const localNow = new Date(now.getTime() + viennaOffset)
        const todayStr = formatDateSimple(localNow)

        const upcomingBookings = await db.booking.count({
          where: {
            userId: user.id,
            status: { in: ['pending', 'confirmed'] },
            date: { gte: todayStr },
          },
        })

        await sendTelegramMessage(
          chatId,
          `🔗 <b>Connected</b>\n\n` +
          `👤 ${user.name}\n📧 ${user.email}\n` +
          `📅 Upcoming lessons: ${upcomingBookings}\n\n` +
          `You will receive reminders 30 minutes before each class.`
        )
      }

      return NextResponse.json({ ok: true })
    }

    // ── Unknown command / message ───────────────────────────────────────────
    await sendTelegramMessage(
      chatId,
      `I didn't understand that. Type /help to see available commands.`
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

// ── Helper functions (simple versions for webhook use) ───────────────────────

function getTimezoneOffsetSimple(timezone: string, date: Date): number {
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

function formatDateSimple(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
