import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']

function detectImageMime(buf: Uint8Array): string | null {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp'
  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 5 Mo)' }, { status: 400 })
  }

  // Reject SVG and non-image MIME types declared by client
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Format invalide — PNG, JPEG ou WebP uniquement' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()

  // Magic bytes validation — ignore client-declared MIME, trust file signature
  const uint8 = new Uint8Array(bytes)
  const actualMime = detectImageMime(uint8)
  if (!actualMime) {
    return NextResponse.json({ error: 'Format invalide — signature de fichier non reconnue' }, { status: 400 })
  }

  const extMap: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
  const ext = extMap[actualMime]
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: actualMime, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  await supabase.from('profiles').update({ avatar_url: publicUrl, avatar_path: path }).eq('id', user.id)

  return NextResponse.json({ url: publicUrl })
}
