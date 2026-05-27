import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    const { data, error } = await supabase
      .from('deallinks_v2')
      .select('id, prospect_name, company_name, deal_type, deal_context, deal_value, config, html_rendered, css_rendered, status, public_slug, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Deallink not found' }, { status: 404 })
    }

    if (data.status === 'archived') {
      return NextResponse.json(
        { error: 'This deallink has been archived' },
        { status: 410 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[deallink/[id]]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
