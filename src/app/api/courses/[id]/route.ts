import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'de'

    const course = await db.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const { _count, ...courseData } = course

    const transformedCourse = {
      ...courseData,
      title: lang === 'en' ? courseData.title : courseData.titleDe,
      titleDe: courseData.titleDe,
      titleEn: courseData.title,
      description: lang === 'en' ? courseData.description : courseData.descriptionDe,
      descriptionDe: courseData.descriptionDe,
      descriptionEn: courseData.description,
      bookingCount: _count.bookings,
    }

    return NextResponse.json({ course: transformedCourse })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
