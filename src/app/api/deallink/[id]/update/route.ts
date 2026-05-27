import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCssFromConfig } from '@/lib/deallink'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await req.json()) as Record<string, any>
    const { colors, sections, images } = body

    const { data: deallink, error: fetchErr } = await supabase
      .from('deallinks_v2')
      .select('id, user_id, config, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !deallink) {
      return NextResponse.json({ error: 'Deallink not found' }, { status: 404 })
    }

    if (deallink.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot edit published deallink' },
        { status: 403 }
      )
    }

    // Merge changes into config
    const updatedConfig = {
      ...deallink.config,
      colors: colors || deallink.config.colors,
      sections: sections || deallink.config.sections,
      images: images || deallink.config.images,
    }

    // Regenerate CSS if colors changed
    const updatedCss = generateCssFromConfig(updatedConfig)

    const { error: updateErr } = await supabase
      .from('deallinks_v2')
      .update({
        config: updatedConfig,
        css_rendered: updatedCss,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('[deallink/[id]/update]', updateErr)
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[deallink/[id]/update]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
