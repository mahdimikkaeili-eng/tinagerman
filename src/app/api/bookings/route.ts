import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, date, time, isTrial } = body

    // Validate required fields
    if (!courseId || !date || !time) {
      return NextResponse.json(
        { error: 'Course ID, date, and time are required' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      )
    }

    // If trial booking, check if user has already used their trial
    if (isTrial) {
      const user = await db.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.isTrialUsed) {
        return NextResponse.json(
          { error: 'You have already used your free trial lesson' },
          { status: 400 }
        )
      }
    }

    // Check for conflicting booking (same date and time)
    const existingBooking = await db.booking.findFirst({
      where: {
        userId,
        date,
        time,
        status: { in: ['pending', 'confirmed'] },
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a booking at this time' },
        { status: 409 }
      )
    }

    // Try to get default meet link from site config
    let meetLink = ''
    try {
      const config = await db.siteConfig.findUnique({ where: { key: 'defaultMeetLink' } })
      meetLink = config?.value || ''
    } catch {}

    // Create booking
    const booking = await db.booking.create({
      data: {
        userId,
        courseId,
        date,
        time,
        isTrial: isTrial || false,
        meetLink,
        status: isTrial ? 'confirmed' : 'pending',
      },
      include: {
        course: true,
      },
    })

    // If trial, mark user's trial as used
    if (isTrial) {
      await db.user.update({
        where: { id: userId },
        data: { isTrialUsed: true },
      })
    }

    // Create notification for the student
    try {
      const courseTitle = booking.course?.title || 'German lesson'
      const courseTitleDe = booking.course?.titleDe || 'Deutschstunde'
      const isTrialLabel = isTrial ? ' (Free Trial / Kostenlose Probestunde)' : ''
      await db.notification.create({
        data: {
          userId,
          title: isTrial ? 'Trial Lesson Booked / Probestunde gebucht' : 'Lesson Booked / Unterrichtsstunde gebucht',
          message: `Your ${courseTitle}${isTrialLabel} has been booked for ${date} at ${time} / Ihre ${courseTitleDe}${isTrialLabel} wurde für den ${date} um ${time} gebucht`,
          type: 'booking',
          actionUrl: meetLink || `https://wa.me/4367763401913?text=${encodeURIComponent(`Hi Tina! I booked a lesson for ${date} at ${time}.`)}`,
          bookingId: booking.id,
        },
      })
    } catch {
      // Notification creation failure shouldn't block booking
    }

    // Send Telegram notification to student if they have telegramChatId
    try {
      const studentUser = await db.user.findUnique({
        where: { id: userId },
        select: { telegramChatId: true, name: true, nativeLanguage: true },
      })
      if (studentUser?.telegramChatId) {
        const { sendTelegramMessage } = await import('@/lib/telegram')
        const courseTitle = booking.course?.title || 'German lesson'
        const courseTitleDe = booking.course?.titleDe || 'Deutschstunde'
        const statusText = isTrial ? '✅ Free trial booked!' : '📅 Lesson booked!'
        await sendTelegramMessage(
          studentUser.telegramChatId,
          `${statusText}\n\n` +
          `📚 ${courseTitle} / ${courseTitleDe}\n` +
          `📅 Date: ${date}\n🕐 Time: ${time}\n` +
          `📊 Level: ${booking.course?.level || 'N/A'}\n` +
          `${booking.meetLink ? `🔗 <a href="${booking.meetLink}">Join Google Meet</a>` : ''}`
        )
      }
    } catch (error) {
      console.error('Failed to send Telegram booking notification:', error)
    }

    return NextResponse.json(
      { booking, message: 'Booking created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
