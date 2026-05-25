/**
 * Telegram Bot API helper functions
 * Uses the TELEGRAM_BOT_TOKEN environment variable
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not set, skipping Telegram message')
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data.description)
      return { ok: false, error: data.description }
    }

    return { ok: true }
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return { ok: false, error: String(error) }
  }
}

/**
 * Set the Telegram webhook URL
 */
export async function setTelegramWebhook(
  webhookUrl: string
): Promise<{ ok: boolean; error?: string; description?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not set, cannot set webhook')
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram setWebhook error:', data.description)
      return { ok: false, error: data.description }
    }

    return { ok: true, description: data.description }
  } catch (error) {
    console.error('Failed to set Telegram webhook:', error)
    return { ok: false, error: String(error) }
  }
}

/**
 * Get the bot info (useful for verifying the token works)
 */
export async function getTelegramBotInfo(): Promise<{
  ok: boolean
  username?: string
  error?: string
}> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/getMe`)
    const data = await response.json()

    if (!data.ok) {
      return { ok: false, error: data.description }
    }

    return { ok: true, username: data.result?.username }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

/**
 * Delete the current webhook (useful for switching to polling mode)
 */
export async function deleteTelegramWebhook(): Promise<{
  ok: boolean
  error?: string
}> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    })

    const data = await response.json()

    if (!data.ok) {
      return { ok: false, error: data.description }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}
