import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
