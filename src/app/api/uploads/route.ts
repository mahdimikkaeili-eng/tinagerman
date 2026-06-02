import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

// GET /api/uploads?file=filename.ext - Serve uploaded files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')

    if (!file) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 })
    }

    // Security: prevent directory traversal
    const sanitizedFile = file.replace(/[^a-zA-Z0-9._-]/g, '')
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadsDir, sanitizedFile)

    // Check file exists
    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const buffer = await readFile(filePath)

    // Determine content type
    const ext = sanitizedFile.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
    }

    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    // For PDFs, show inline. For others, force download
    const isPdf = ext === 'pdf'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': isPdf 
          ? `inline; filename="${sanitizedFile}"` 
          : `attachment; filename="${sanitizedFile}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
