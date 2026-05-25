import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// GET /api/messages/conversations - List all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get all unique conversation partners
    const sentMessages = await db.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    })

    const receivedMessages = await db.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    })

    const partnerIds = new Set([
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ])

    // Get last message and unread count for each conversation
    const conversations = await Promise.all(
      Array.from(partnerIds).map(async (partnerId) => {
        const partner = await db.user.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, avatar: true, role: true },
        })

        const lastMessage = await db.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })

        const unreadCount = await db.message.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            isRead: false,
          },
        })

        return {
          partner,
          lastMessage,
          unreadCount,
        }
      })
    )

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
