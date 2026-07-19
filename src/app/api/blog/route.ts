import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/blog - List posts. Public sees published only; teacher sees all with ?all=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const lang = searchParams.get('lang')

    let isTeacher = false
    if (all) {
      const userId = await getUserIdFromRequest(request)
      if (userId) {
        const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
        isTeacher = user?.role === 'teacher'
      }
    }

    const where: Record<string, unknown> = {}
    if (!(all && isTeacher)) {
      where.status = 'published'
    }
    if (lang) {
      where.language = lang
    }

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        language: true,
        tags: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Get blog posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/blog - Create a post (teacher only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, excerpt, content, slug, coverImage, language, tags, status } = body

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'title, excerpt and content are required' }, { status: 400 })
    }

    // Auto-generate slug from title if not provided
    const finalSlug = (slug || title)
      .toLowerCase()
      .replace(/\u00e4/g, 'ae')
      .replace(/\u00f6/g, 'oe')
      .replace(/\u00fc/g, 'ue')
      .replace(/\u00df/g, 'ss')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)

    const existing = await db.blogPost.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 })
    }

    const publish = status === 'published'
    const post = await db.blogPost.create({
      data: {
        slug: finalSlug,
        title,
        excerpt,
        content,
        coverImage: coverImage || null,
        language: language || 'en',
        tags: tags || null,
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? new Date() : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Create blog post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
