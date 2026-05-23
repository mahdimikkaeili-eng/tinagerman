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
        await db.$executeRawUnsafe('DELETE FROM Homework')
        await db.$executeRawUnsafe('DELETE FROM Message')
        await db.$executeRawUnsafe('DELETE FROM Booking')
        await db.$executeRawUnsafe('DELETE FROM Course')
        await db.$executeRawUnsafe('DELETE FROM User')
      } catch {
        // Ignore cleanup errors, try to insert anyway
      }
    }

    // Create Tina as teacher using upsert
    const tinaPassword = hashPassword('Tina2024!')
    const tina = await db.user.upsert({
      where: { email: 'tina@tinagerman.com' },
      update: {},
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
      {
        title: 'German C1 – Advanced / Exam Prep',
        titleDe: 'Deutsch C1 – Fortgeschritten / Prüfungsvorbereitung',
        description: 'Master German at an advanced level. Perfect for exam preparation (Goethe, Telc, ÖSD), professional communication, and understanding implicit meaning in complex texts.',
        descriptionDe: 'Meistern Sie Deutsch auf fortgeschrittenem Niveau. Perfekt für Prüfungsvorbereitung (Goethe, Telc, ÖSD), professionelle Kommunikation und das Verstehen impliziter Bedeutungen in komplexen Texten.',
        level: 'C1',
        duration: 60,
        priceNote: 'Price discussed in first session',
        language: 'de',
        category: 'exam-prep',
        isActive: true,
      },
    ]

    const courses = []
    for (const data of courseData) {
      const existing = await db.course.findFirst({ where: { level: data.level } })
      if (!existing) {
        const course = await db.course.create({ data })
        courses.push(course)
      } else {
        courses.push(existing)
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        teacher: { id: tina.id, name: tina.name, email: tina.email },
        courses: courses.map((c) => ({ id: c.id, level: c.level, title: c.title })),
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
