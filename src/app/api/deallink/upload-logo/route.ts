import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_MIME = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45) return 'image/webp'
  const text = buf.slice(0, 300).toString('utf8')
  if (text.includes('<svg') || text.includes('<?xml')) return 'image/svg+xml'
  return null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('file')     as File | null
  const slug     = formData.get('slug')     as string | null
  const logoType = formData.get('logoType') as string | null

  if (!file || !slug || !['seller', 'prospect'].includes(logoType ?? ''))
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'Fichier trop lourd (max 2 Mo)' }, { status: 400 })

  const buf  = Buffer.from(await file.arrayBuffer())
  const mime = detectMime(buf)
  if (!mime || !ALLOWED_MIME.includes(mime))
    return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })

  const { data: dl } = await supabase
    .from('deallinks').select('id, owner_id').eq('slug', slug).single()
  if (!dl || dl.owner_id !== user.id)
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const ext  = mime.split('/')[1].replace('svg+xml', 'svg')
  const path = `deallinks/${dl.id}/${logoType}-logo-${Date.now()}.${ext}`

  const supabaseAdmin = createServiceClient()
  const { error: upErr } = await supabaseAdmin.storage
    .from('assets')
    .upload(path, buf, { contentType: mime, upsert: true, cacheControl: '3600' })

  if (upErr) return NextResponse.json({ error: 'Erreur stockage' }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
