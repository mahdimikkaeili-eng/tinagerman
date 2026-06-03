import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain', // .txt
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 400 }
      )
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Write file
    const filePath = join(uploadsDir, uniqueName)
    await writeFile(filePath, buffer)

    // Return the URL path
    const url = `/uploads/${uniqueName}`

    return NextResponse.json({ url, name: file.name })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
