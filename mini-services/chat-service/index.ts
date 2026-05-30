import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Store connected users
const connectedUsers = new Map<string, { userId: string; socketId: string }>()

// Store messages in memory
const messageStore = new Map<string, Array<{
  id: string
  senderId: string
  receiverId: string
  content: string
  attachment?: string
  attachmentType?: string
  attachmentName?: string
  createdAt: string
  isRead: boolean
}>>()

const generateId = () => Math.random().toString(36).substr(2, 9)

// Generate room ID from two user IDs (sorted for consistency)
const getRoomId = (userId1: string, userId2: string) => {
  return `chat_${[userId1, userId2].sort().join('_')}`
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // User joins with their ID
  socket.on('join', (data: { userId: string }) => {
    const { userId } = data
    connectedUsers.set(userId, { userId, socketId: socket.id })
    socket.data.userId = userId
    console.log(`User ${userId} joined, total connected: ${connectedUsers.size}`)
  })

  // Join a specific chat room
  socket.on('joinRoom', (data: { otherUserId: string }) => {
    const userId = socket.data.userId
    if (!userId) return

    const roomId = getRoomId(userId, data.otherUserId)
    socket.join(roomId)
    console.log(`User ${userId} joined room ${roomId}`)
  })

  // Send a message
  socket.on('sendMessage', (data: { receiverId: string; content: string; attachment?: string; attachmentType?: string; attachmentName?: string }) => {
    const senderId = socket.data.userId
    if (!senderId) return

    const { receiverId, content, attachment, attachmentType, attachmentName } = data
    const roomId = getRoomId(senderId, receiverId)
    const messageId = generateId()

    const message = {
      id: messageId,
      senderId,
      receiverId,
      content,
      ...(attachment && { attachment }),
      ...(attachmentType && { attachmentType }),
      ...(attachmentName && { attachmentName }),
      createdAt: new Date().toISOString(),
      isRead: false
    }

    // Store message
    if (!messageStore.has(roomId)) {
      messageStore.set(roomId, [])
    }
    messageStore.get(roomId)!.push(message)

    // Broadcast to room
    io.to(roomId).emit('newMessage', message)
    console.log(`Message from ${senderId} to ${receiverId}: ${content.substring(0, 50)}${attachment ? ` [attachment: ${attachmentType}]` : ''}`)
  })

  // Typing indicator
  socket.on('typing', (data: { receiverId: string }) => {
    const senderId = socket.data.userId
    if (!senderId) return

    const roomId = getRoomId(senderId, data.receiverId)
    socket.to(roomId).emit('userTyping', { userId: senderId })
  })

  // Mark messages as read
  socket.on('markRead', (data: { otherUserId: string }) => {
    const userId = socket.data.userId
    if (!userId) return

    const roomId = getRoomId(userId, data.otherUserId)
    const messages = messageStore.get(roomId)
    if (messages) {
      messages.forEach(msg => {
        if (msg.receiverId === userId && !msg.isRead) {
          msg.isRead = true
        }
      })
    }

    const otherRoomId = roomId // Same room
    io.to(otherRoomId).emit('messagesRead', { userId })
    console.log(`User ${userId} marked messages from ${data.otherUserId} as read`)
  })

  // Get message history for a room
  socket.on('getHistory', (data: { otherUserId: string }, callback: (messages: any[]) => void) => {
    const userId = socket.data.userId
    if (!userId) return

    const roomId = getRoomId(userId, data.otherUserId)
    const messages = messageStore.get(roomId) || []
    callback(messages)
  })

  // Disconnect
  socket.on('disconnect', () => {
    const userId = socket.data.userId
    if (userId) {
      connectedUsers.delete(userId)
      console.log(`User ${userId} disconnected, total connected: ${connectedUsers.size}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Chat WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down chat server...')
  httpServer.close(() => {
    console.log('Chat server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down chat server...')
  httpServer.close(() => {
    console.log('Chat server closed')
    process.exit(0)
  })
})
