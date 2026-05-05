import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({ memberId: z.string().uuid(), confirm: z.string() })

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { memberId, confirm } = parsed.data
  const svc = createServiceClient()

  const { data: member } = await svc.from('profiles')
    .select('first_name, last_name, email, avatar_path').eq('id', memberId).single()
  if (!member) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  const expectedConfirm = `${member.first_name} ${member.last_name}`.trim()
  if (confirm.trim() !== expectedConfirm) {
    return NextResponse.json({ error: 'Confirmation incorrecte — tape le nom exact du membre' }, { status: 400 })
  }

  await logAdminAction(adminId, 'delete_member', 'member', memberId, { email: member.email })

  if ((member as unknown as Record<string, unknown>).avatar_path) {
    await svc.storage.from('avatars').remove([(member as unknown as Record<string, string>).avatar_path])
  }

  const { error } = await svc.auth.admin.deleteUser(memberId)
  if (error) {
    console.error('[admin/members/delete] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
