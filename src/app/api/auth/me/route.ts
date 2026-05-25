import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { sanitizeUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Try cookies API first (more reliable), fallback to header parsing
    let userId: string | null = null

    try {
      const cookieStore = await cookies()
      userId = cookieStore.get('session_user_id')?.value || null
    } catch {
      // Fallback to reading from request headers
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce(
          (acc, c) => {
            const [key, val] = c.trim().split('=')
            acc[key] = val
            return acc
          },
          {} as Record<string, string>
        )
        userId = cookies['session_user_id'] || null
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const sanitizedUser = sanitizeUser(user)

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
