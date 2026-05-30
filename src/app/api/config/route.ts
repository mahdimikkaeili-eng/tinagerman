import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/config - Get site configuration
export async function GET(request: NextRequest) {
  try {
    const configs = await db.siteConfig.findMany()

    const configMap: Record<string, string> = {}
    for (const config of configs) {
      configMap[config.key] = config.value
    }

    return NextResponse.json({ config: configMap })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/config - Save a site configuration value (teacher only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify the user is a teacher
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can update configuration' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const config = await db.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Save config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
