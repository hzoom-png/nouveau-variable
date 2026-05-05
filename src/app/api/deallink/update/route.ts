import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SectionSchema = z.object({
  id:    z.string().max(64),
  type:  z.enum(['hero', 'context', 'value_prop', 'proof', 'cta']),
  title: z.string().max(300),
  body:  z.string().max(2000),
})

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const UpdateSchema = z.object({
  slug:     z.string().min(3).max(120).regex(/^[a-z0-9-]+$/),
  tagline:  z.string().max(300).optional(),
  sections: z.array(SectionSchema).max(10).optional(),
  brand: z.object({
    primaryColor:     HexColor.optional(),
    backgroundColor:  HexColor.optional(),
    caseStudyUrl:     z.string().max(500).optional(),
    logoUrl:          z.string().max(500).optional(),
    prospectLogoUrl:  z.string().max(500).optional(),
    calendlyUrl:      z.string().max(500).optional(),
    calendlyCtaLabel: z.string().max(50).optional(),
    quoteUrl:         z.string().max(500).optional(),
    quoteCtaLabel:    z.string().max(50).optional(),
  }).optional(),
})

const rl = new Map<string, { count: number; ts: number }>()
function checkRL(uid: string): boolean {
  const now = Date.now(); const max = 10; const window = 60_000
  const cur = rl.get(uid)
  if (!cur || now - cur.ts > window) { rl.set(uid, { count: 1, ts: now }); return true }
  if (cur.count >= max) return false
  cur.count++; return true
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!checkRL(user.id)) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { slug, tagline, sections, brand } = parsed.data

  const { data: dl } = await supabase
    .from('deallinks')
    .select('id, owner_id, full_result, brand_assets')
    .eq('slug', slug)
    .single()

  if (!dl) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (dl.owner_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const updatedResult = {
    ...(dl.full_result as Record<string, unknown>),
    ...(tagline  !== undefined && { tagline }),
    ...(sections !== undefined && { sections }),
  }

  const updatedBrand = {
    ...(dl.brand_assets as Record<string, unknown>),
    ...(brand || {}),
  }

  const { error: upErr } = await supabase
    .from('deallinks')
    .update({
      full_result: updatedResult,
      brand_assets: updatedBrand,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dl.id)

  if (upErr) return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
  return NextResponse.json({ success: true })
}
