import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// PATCH /api/testimonials/[id] - Approve/reject testimonial (teacher only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only teachers can approve reviews' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { isApproved } = body

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'isApproved boolean is required' },
        { status: 400 }
      )
    }

    const testimonial = await db.testimonial.update({
      where: { id },
      data: { isApproved },
      include: {
        user: {
          select: { id: true, name: true, germanLevel: true },
        },
      },
    })

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Update testimonial error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/testimonials/[id] - Delete testimonial (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only teachers can delete reviews' },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.testimonial.delete({ where: { id } })

    return NextResponse.json({ message: 'Review deleted' })
  } catch (error) {
    console.error('Delete testimonial error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
