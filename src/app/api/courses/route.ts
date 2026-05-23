import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'de'
    const level = searchParams.get('level')

    const where: Record<string, unknown> = { isActive: true }
    if (level) {
      where.level = level.toUpperCase()
    }

    const courses = await db.course.findMany({
      where,
      orderBy: { level: 'asc' },
    })

    // Transform courses based on language preference
    const transformedCourses = courses.map((course) => ({
      id: course.id,
      title: lang === 'en' ? course.title : course.titleDe,
      titleDe: course.titleDe,
      titleEn: course.title,
      description: lang === 'en' ? course.description : course.descriptionDe,
      descriptionDe: course.descriptionDe,
      descriptionEn: course.description,
      level: course.level,
      duration: course.duration,
      priceNote: course.priceNote,
      language: course.language,
      category: course.category,
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }))

    return NextResponse.json({ courses: transformedCourses })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
