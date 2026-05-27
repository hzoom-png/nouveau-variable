import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

    const { data: deallink, error: fetchErr } = await supabase
      .from('deallinks_v2')
      .select('id, user_id, public_slug')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !deallink) {
      return NextResponse.json({ error: 'Deallink not found' }, { status: 404 })
    }

    const { error: updateErr } = await supabase
      .from('deallinks_v2')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('[deallink/[id]/publish]', updateErr)
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nouveauvariable.fr'

    return NextResponse.json({
      success: true,
      public_url: `${baseUrl}/deallink/${deallink.public_slug}`,
    })
  } catch (err) {
    console.error('[deallink/[id]/publish]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
