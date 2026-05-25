import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// POST /api/seed - Seed the database with initial data
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const force = url.searchParams.get('force')

    // Check if already seeded
    const existingTeacher = await db.user.findFirst({ where: { role: 'teacher' } })
    
    if (existingTeacher && !force) {
      return NextResponse.json(
        { error: 'Database already contains data. Use ?force=true to re-seed.' },
        { status: 400 }
      )
    }

    // If force, try to clean up (ignore errors)
    if (force) {
      try {
        await db.$executeRawUnsafe('DELETE FROM SiteConfig')
        await db.$executeRawUnsafe('DELETE FROM Testimonial')
        await db.$executeRawUnsafe('DELETE FROM Homework')
        await db.$executeRawUnsafe('DELETE FROM Message')
        await db.$executeRawUnsafe('DELETE FROM Booking')
        await db.$executeRawUnsafe('DELETE FROM Course')
        await db.$executeRawUnsafe('DELETE FROM User')
      } catch {
        // Ignore cleanup errors, try to insert anyway
      }
    }

    // Create Tina as teacher using upsert - always update password on force
    const tinaPassword = hashPassword('Tina2024!')
    const tina = await db.user.upsert({
      where: { email: 'tina@tinagerman.com' },
      update: force ? { password: tinaPassword } : {},
      create: {
        email: 'tina@tinagerman.com',
        name: 'Tina',
        password: tinaPassword,
        role: 'teacher',
        bio: "Hi! I'm Tina, a certified German teacher from Vienna, Austria. I've been teaching German for over 8 years and love helping students discover the beauty of the German language. Whether you're a complete beginner or preparing for a Goethe exam, I'm here to guide you!",
        nativeLanguage: 'de',
        germanLevel: 'C2',
        timezone: 'Europe/Vienna',
      },
    })

    // Create courses
    const courseData = [
      {
        title: 'German A1 – Complete Beginner',
        titleDe: 'Deutsch A1 – Anfänger',
        description: 'Start your German journey from scratch! Learn basic vocabulary, simple sentences, and essential communication for everyday situations like greetings, shopping, and introductions.',
        descriptionDe: 'Beginnen Sie Ihre Deutschreise von null an! Lernen Sie Grundwortschatz, einfache Sätze und die wichtigste Kommunikation für Alltagssituationen wie Begrüßung, Einkaufen und Vorstellung.',
        level: 'A1',
        duration: 60,
        priceNote: 'Free trial available • Price discussed in first session',
        language: 'de',
        category: 'grammar',
        isActive: true,
      },
      {
        title: 'German A2 – Elementary',
        titleDe: 'Deutsch A2 – Grundstufe',
        description: 'Build on your A1 foundation with more complex grammar, expanded vocabulary, and the ability to handle common daily interactions like doctor visits, banking, and social conversations.',
        descriptionDe: 'Bauen Sie auf Ihren A1-Grundlagen auf mit komplexerer Grammatik, erweitertem Wortschatz und der Fähigkeit, alltägliche Interaktionen wie Arztbesuche, Bankgeschäfte und Gespräche zu bewältigen.',
        level: 'A2',
        duration: 60,
        priceNote: 'Free trial available • Price discussed in first session',
        language: 'de',
        category: 'grammar',
        isActive: true,
      },
      {
        title: 'German B1 – Intermediate',
        titleDe: 'Deutsch B1 – Mittelstufe',
        description: 'Achieve conversational fluency! Master complex sentences, express opinions, discuss current events, and understand the main points of clear standard German about familiar topics.',
        descriptionDe: 'Erreichen Sie Konversationsflüssigkeit! Beherrschen Sie komplexe Sätze, drücken Sie Meinungen aus, diskutieren Sie aktuelle Ereignisse und verstehen Sie die Hauptpunkte von klarem Standarddeutsch über vertraute Themen.',
        level: 'B1',
        duration: 60,
        priceNote: 'Price discussed in first session',
        language: 'de',
        category: 'conversation',
        isActive: true,
      },
      {
        title: 'German B2 – Upper Intermediate',
        titleDe: 'Deutsch B2 – Fortgeschrittene Mittelstufe',
        description: 'Communicate with fluency and spontaneity. Engage in detailed discussions, understand complex texts, and express yourself clearly on a wide range of subjects without much obvious searching for expressions.',
        descriptionDe: 'Kommunizieren Sie fließend und spontan. Führen Sie detaillierte Diskussionen, verstehen Sie komplexe Texte und drücken Sie sich klar zu einer Vielzahl von Themen aus.',
        level: 'B2',
        duration: 60,
        priceNote: 'Price discussed in first session',
        language: 'de',
        category: 'conversation',
        isActive: true,
      },

    ]

    const courses: { id: string; level: string; title: string; titleDe: string; description: string; descriptionDe: string; duration: number; priceNote: string; language: string; category: string | null; isActive: boolean; createdAt: Date; updatedAt: Date }[] = []
    for (const data of courseData) {
      const existing = await db.course.findFirst({ where: { level: data.level } })
      if (!existing) {
        const course = await db.course.create({ data })
        courses.push(course)
      } else {
        courses.push(existing)
      }
    }

    // Create sample student users for testimonials
    const studentData = [
      {
        email: 'sarah.johnson@email.com',
        name: 'Sarah Johnson',
        password: hashPassword('Student2024!'),
        role: 'student',
        nativeLanguage: 'en',
        germanLevel: 'B1',
        bio: 'Expat living in Berlin, learning German to better connect with my community.',
        timezone: 'Europe/Berlin',
      },
      {
        email: 'marcos.rivera@email.com',
        name: 'Marcos Rivera',
        password: hashPassword('Student2024!'),
        role: 'student',
        nativeLanguage: 'es',
        germanLevel: 'A2',
        bio: 'Software engineer from Spain, preparing for a job relocation to Munich.',
        timezone: 'Europe/Madrid',
      },
      {
        email: 'emily.chen@email.com',
        name: 'Emily Chen',
        password: hashPassword('Student2024!'),
        role: 'student',
        nativeLanguage: 'en',
        germanLevel: 'A1',
        bio: 'University student planning to study abroad in Vienna.',
        timezone: 'America/New_York',
      },
      {
        email: 'yuki.tanaka@email.com',
        name: 'Yuki Tanaka',
        password: hashPassword('Student2024!'),
        role: 'student',
        nativeLanguage: 'ja',
        germanLevel: 'B2',
        bio: 'Translator and language enthusiast, improving German for professional certification.',
        timezone: 'Asia/Tokyo',
      },
    ]

    const students: { id: string; name: string; email: string }[] = []
    for (const data of studentData) {
      const existing = await db.user.findFirst({ where: { email: data.email } })
      if (!existing) {
        const student = await db.user.create({ data })
        students.push({ id: student.id, name: student.name, email: student.email })
      } else {
        students.push({ id: existing.id, name: existing.name, email: existing.email })
      }
    }

    // Create sample approved testimonials
    const testimonialData = [
      {
        userId: students[0].id,
        rating: 5,
        comment: "Tina is an incredible German teacher! After just three months of lessons, I went from barely being able to introduce myself to having full conversations with my neighbors in Berlin. Her lessons are well-structured, fun, and she always adapts to my pace. I couldn't recommend her more highly!",
        isApproved: true,
      },
      {
        userId: students[1].id,
        rating: 5,
        comment: "I needed to reach A2 level quickly for my job relocation to Munich, and Tina made it happen. She combines grammar drills with real-life scenarios, so you're not just memorizing — you're actually learning to communicate. The flexible scheduling was a huge plus for me as well.",
        isApproved: true,
      },
      {
        userId: students[2].id,
        rating: 4,
        comment: "As a complete beginner, I was really nervous about learning German. Tina made the process so approachable and enjoyable. She uses great materials and always encourages you to speak from day one. I'm already planning my next course with her!",
        isApproved: true,
      },
      {
        userId: students[3].id,
        rating: 5,
        comment: "I've tried several German tutors before finding Tina, and she is by far the best. Her deep understanding of the language and her ability to explain subtle nuances have been invaluable for my B2 preparation. Every lesson feels tailored to my specific goals. Vielen Dank, Tina!",
        isApproved: true,
      },
    ]

    const testimonials: { id: string; rating: number }[] = []
    for (const data of testimonialData) {
      const existing = await db.testimonial.findFirst({
        where: { userId: data.userId, comment: data.comment },
      })
      if (!existing) {
        const testimonial = await db.testimonial.create({ data })
        testimonials.push({ id: testimonial.id, rating: testimonial.rating })
      } else {
        testimonials.push({ id: existing.id, rating: existing.rating })
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        teacher: { id: tina.id, name: tina.name, email: tina.email },
        courses: courses.map((c) => ({ id: c.id, level: c.level, title: c.title })),
        students: students.map((s) => ({ id: s.id, name: s.name })),
        testimonials: testimonials.map((t) => ({ id: t.id, rating: t.rating })),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error during seeding' },
      { status: 500 }
    )
  }
}
