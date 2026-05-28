import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashPassword, sanitizeUser, getUserIdFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, phone, nativeLanguage, germanLevel } = body

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        phone: phone || null,
        nativeLanguage: nativeLanguage || null,
        germanLevel: germanLevel || null,
        role: 'student',
      },
    })

    const sanitizedUser = sanitizeUser(user)

    // Set session cookie using Next.js cookies API
    const cookieStore = await cookies()
    cookieStore.set('session_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
    })

    return NextResponse.json(
      { user: sanitizedUser, message: 'Registration successful' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/register - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, nativeLanguage, germanLevel, avatar } = body

    // Validate at least name is provided
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, string | null> = {
      name,
      phone: phone || null,
      nativeLanguage: nativeLanguage || null,
      germanLevel: germanLevel || null,
    }

    // Only update avatar if provided
    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    // Update user
    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    const sanitizedUser = sanitizeUser(user)

    return NextResponse.json(
      { user: sanitizedUser, message: 'Profile updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
