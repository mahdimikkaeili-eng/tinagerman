import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

async function isTeacher(request: NextRequest): Promise<boolean> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  return user?.role === 'teacher'
}

// GET /api/blog/[slug] - Get a single post (drafts visible to teacher only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const post = await db.blogPost.findUnique({ where: { slug } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.status !== 'published' && !(await isTeacher(request))) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Get blog post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/blog/[slug] - Update a post (teacher only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!(await isTeacher(request))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, excerpt, content, coverImage, language, tags, status } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (excerpt !== undefined) data.excerpt = excerpt
    if (content !== undefined) data.content = content
    if (coverImage !== undefined) data.coverImage = coverImage || null
    if (language !== undefined) data.language = language
    if (tags !== undefined) data.tags = tags || null
    if (status !== undefined) {
      data.status = status
      if (status === 'published' && !existing.publishedAt) {
        data.publishedAt = new Date()
      }
    }

    const post = await db.blogPost.update({ where: { slug }, data })
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Update blog post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/blog/[slug] - Delete a post (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!(await isTeacher(request))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    await db.blogPost.delete({ where: { slug } }).catch(() => null)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete blog post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
