import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('deallinks_v2')
      .select('id, prospect_name, company_name, deal_type, deal_value, status, public_slug, created_at, updated_at')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[deallink]', error)
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
    }

    return NextResponse.json({ deallinks: data || [] })
  } catch (err) {
    console.error('[deallink]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
