import { createHash, randomBytes } from 'crypto'

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
 * Generate a simple session token
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Omit password from user object
 */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user
  return rest
}

/**
 * Get user ID from request cookies (simple session)
 */
export function getUserIdFromRequest(request: Request): string | null {
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

/**
 * Set session cookie in response headers
 */
export function setSessionCookie(userId: string): string {
  return `session_user_id=${userId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return 'session_user_id=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
}
