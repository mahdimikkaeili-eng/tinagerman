/**
 * Timezone utility functions
 * All stored times are in Vienna timezone (teacher's timezone).
 * The UI should convert display to the user's local timezone.
 */

const TEACHER_TIMEZONE = 'Europe/Vienna'

/**
 * Get the user's local timezone using the Intl API
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || TEACHER_TIMEZONE
  } catch {
    return TEACHER_TIMEZONE
  }
}

/**
 * Convert a Vienna time slot (HH:mm) to the user's local timezone
 * Returns the converted time in HH:mm format
 */
export function convertViennaTimeToLocal(viennaTime: string, targetTimezone: string): string {
  if (targetTimezone === TEACHER_TIMEZONE) return viennaTime

  try {
    // Create a date object for today with the Vienna time
    const now = new Date()
    const viennaDateStr = now.toLocaleDateString('en-US', { timeZone: 'Europe/Vienna' })
    const [month, day, year] = viennaDateStr.split('/')
    const [hours, minutes] = viennaTime.split(':').map(Number)

    // Create a date in Vienna timezone
    const viennaDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours,
      minutes,
      0,
      0
    )

    // Format in target timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }

    return viennaDate.toLocaleTimeString('en-GB', options)
  } catch {
    return viennaTime
  }
}

/**
 * Convert a Vienna time to a target timezone and return a formatted display string
 * e.g., "14:00" -> "15:30" (with timezone label)
 */
export function formatTimeInTimezone(
  viennaTime: string,
  targetTimezone: string,
  language: 'en' | 'de' = 'en'
): { display: string; label: string } {
  const localTime = convertViennaTimeToLocal(viennaTime, targetTimezone)
  const isVienna = targetTimezone === TEACHER_TIMEZONE

  // Get short timezone name
  let tzLabel = ''
  try {
    const now = new Date()
    tzLabel = now.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
      timeZone: targetTimezone,
      timeZoneName: 'short',
    }).split(' ').pop() || targetTimezone
  } catch {
    tzLabel = targetTimezone.split('/').pop() || targetTimezone
  }

  return {
    display: localTime,
    label: isVienna
      ? (language === 'de' ? 'Wiener Zeit' : 'Vienna Time')
      : tzLabel,
  }
}

/**
 * Get a human-readable timezone name
 */
export function getTimezoneLabel(timezone: string, language: 'en' | 'de' = 'en'): string {
  if (timezone === TEACHER_TIMEZONE) {
    return language === 'de' ? 'Wiener Zeit (MEZ)' : 'Vienna Time (CET)'
  }
  try {
    const now = new Date()
    const formatted = now.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
      timeZone: timezone,
      timeZoneName: 'long',
    })
    const parts = formatted.split(' ')
    return parts.length > 1 ? parts.slice(1).join(' ') : timezone
  } catch {
    return timezone
  }
}
