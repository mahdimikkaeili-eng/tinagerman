import { NextRequest, NextResponse } from 'next/server'
import { setTelegramWebhook, getTelegramBotInfo, deleteTelegramWebhook } from '@/lib/telegram'

/**
 * POST /api/telegram/setup
 *
 * Sets up the Telegram webhook URL.
 * Called once during initial setup or when the webhook URL changes.
 *
 * Body:
 * {
 *   "webhookUrl": "https://yourdomain.com/api/telegram/webhook",
 *   "secret": "YOUR_SETUP_SECRET" (optional, uses CRON_SECRET if not provided)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl, secret } = body

    // ── Verify secret ───────────────────────────────────────────────────────
    const expectedSecret = process.env.CRON_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid or missing secret' },
        { status: 401 }
      )
    }

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
        { status: 400 }
      )
    }

    // ── Verify bot token works ──────────────────────────────────────────────
    const botInfo = await getTelegramBotInfo()
    if (!botInfo.ok) {
      return NextResponse.json(
        {
          error: 'Failed to verify Telegram bot token',
          details: botInfo.error,
        },
        { status: 400 }
      )
    }

    // ── Set the webhook ─────────────────────────────────────────────────────
    const result = await setTelegramWebhook(webhookUrl)

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to set Telegram webhook',
          details: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Webhook set successfully for @${botInfo.username}`,
      botUsername: botInfo.username,
      webhookUrl,
      description: result.description,
    })
  } catch (error) {
    console.error('Telegram setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telegram/setup
 *
 * Check the current Telegram bot setup status.
 * Protected by CRON_SECRET query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid or missing secret' },
        { status: 401 }
      )
    }

    // Get bot info
    const botInfo = await getTelegramBotInfo()

    return NextResponse.json({
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      botInfo: botInfo.ok
        ? { username: botInfo.username }
        : { error: botInfo.error },
      cronSecretConfigured: !!process.env.CRON_SECRET,
    })
  } catch (error) {
    console.error('Telegram setup status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/telegram/setup
 *
 * Remove the Telegram webhook (switch to polling mode).
 * Protected by CRON_SECRET query parameter.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid or missing secret' },
        { status: 401 }
      )
    }

    const result = await deleteTelegramWebhook()

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to delete Telegram webhook',
          details: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram webhook deleted successfully',
    })
  } catch (error) {
    console.error('Telegram webhook deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
