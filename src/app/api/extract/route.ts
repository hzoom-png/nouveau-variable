import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 10 Mo)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''

  try {
    if (file.type === 'application/pdf') {
      // pdfjs-dist (used by pdf-parse) expects browser globals in Node.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any
      if (typeof g.DOMMatrix === 'undefined') g.DOMMatrix = class DOMMatrix {}
      if (typeof g.DOMPoint  === 'undefined') g.DOMPoint  = class DOMPoint  {}
      if (typeof g.DOMRect   === 'undefined') g.DOMRect   = class DOMRect   {}
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse') as { PDFParse: new () => { parse: (b: Buffer) => Promise<{ text: string }> } }
      const parser = new PDFParse()
      const result = await parser.parse(buffer)
      text = result.text
    } else if (
      file.name.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (
      file.name.endsWith('.pptx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      text = (
        buffer.toString('utf-8')
          .match(/<a:t[^>]*>([^<]+)<\/a:t>/g)
          ?.map(t => t.replace(/<[^>]+>/g, ''))
          .join(' ') ?? ''
      )
    } else {
      text = buffer.toString('utf-8')
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Impossible d\'extraire du texte de ce fichier' }, { status: 422 })
    }

    const truncated = text.slice(0, 15000)
    return NextResponse.json({ text: truncated, chars: truncated.length, truncated: text.length > 15000 })
  } catch (err) {
    console.error('[extract] Erreur:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
