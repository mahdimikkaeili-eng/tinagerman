import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'

/**
 * Hash a password using SHA-256 with a salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const computedHash = createHash('sha256')
    .update(salt + password)
    .digest('hex')
  return computedHash === hash
}

/**
 * Omit password from user object
 */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user
  return rest
}

/**
 * Get user ID from request cookies (supports both Next.js cookies API and header parsing)
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // Try Next.js cookies API first (more reliable in App Router)
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('session_user_id')?.value
    if (userId) return userId
  } catch {
    // cookies() might not work in all contexts
  }

  // Fallback to parsing cookie header
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, c) => {
      const [key, val] = c.trim().split('=')
      acc[key] = val
      return acc
    },
    {} as Record<string, string>
  )

  return cookies['session_user_id'] || null
}
