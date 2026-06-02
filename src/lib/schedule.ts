import { db } from '@/lib/db'

// Default time slots for weekdays (50-min lessons, Vienna time)
const defaultSlots = [
  "09:00", "09:50", "10:40", "11:30", "12:20", "13:10",
  "14:00", "14:50", "15:40", "16:30", "17:20", "18:10",
  "19:00", "19:50",
]

// Sunday slots (shorter day, until 16:00)
const sundaySlots = [
  "09:00", "09:50", "10:40", "11:30", "12:20", "13:10",
  "14:00", "14:50", "15:40",
]

export type DaySchedule = { enabled: boolean; slots: string[] }
export type WeekSchedule = Record<number, DaySchedule>

// Default schedule: Sun-Thu open, Fri-Sat closed, Sunday until 16:00
export const defaultSchedule: WeekSchedule = {
  0: { enabled: true, slots: sundaySlots },    // Sunday
  1: { enabled: true, slots: defaultSlots },    // Monday
  2: { enabled: true, slots: defaultSlots },    // Tuesday
  3: { enabled: true, slots: defaultSlots },    // Wednesday
  4: { enabled: true, slots: defaultSlots },    // Thursday
  5: { enabled: false, slots: [] },             // Friday
  6: { enabled: false, slots: [] },             // Saturday
}

/**
 * Get the teaching schedule from SiteConfig, or return the default.
 * Returns a Record where keys are day-of-week numbers (0=Sunday, 6=Saturday).
 */
export async function getSchedule(): Promise<WeekSchedule> {
  try {
    const config = await db.siteConfig.findUnique({ where: { key: 'teachingSchedule' } })
    if (config?.value) {
      const parsed = JSON.parse(config.value) as WeekSchedule
      // Validate that the parsed object has the expected structure
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    }
  } catch {
    // Return default if anything goes wrong
  }
  return defaultSchedule
}

/**
 * Get available time slots for a specific date based on the day of the week.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Array of time slot strings in HH:mm format (Vienna time)
 */
export async function getSlotsForDate(dateStr: string): Promise<string[]> {
  const schedule = await getSchedule()
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay() // 0=Sunday, 6=Saturday
  const dayConfig = schedule[dayOfWeek]
  if (!dayConfig || !dayConfig.enabled) return []
  return dayConfig.slots
}
