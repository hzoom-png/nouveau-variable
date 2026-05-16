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
  console.log('[DELETE USER]', { step: 'start', userId: memberId, status: 'ok' })

  const svc = createServiceClient()

  // ── Fetch + confirmation ──────────────────────────────────────────────────
  const { data: member, error: fetchError } = await svc.from('profiles')
    .select('first_name, last_name, email, avatar_path').eq('id', memberId).single()

  if (fetchError || !member) {
    console.log('[DELETE USER]', { step: 'fetch_profile', userId: memberId, status: 'not_found' })
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }

  const expectedConfirm = `${(member.first_name as string ?? '').trim()} ${(member.last_name as string ?? '').trim()}`.trim()
  if (confirm.trim() !== expectedConfirm) {
    console.log('[DELETE USER]', { step: 'confirm', userId: memberId, status: 'wrong_confirm' })
    return NextResponse.json({ error: `Confirmation incorrecte — tape exactement : ${expectedConfirm}` }, { status: 400 })
  }

  await logAdminAction(adminId, 'delete_member', 'member', memberId, { email: member.email })

  // ── Helper de log par étape ───────────────────────────────────────────────
  function logStep(label: string, error: { message: string } | null) {
    if (error) console.error('[DELETE USER]', { step: label, userId: memberId, status: 'error', error: error.message })
    else       console.log('[DELETE USER]',   { step: label, userId: memberId, status: 'ok' })
  }

  // ── Étape 0 — Storage avatar ──────────────────────────────────────────────
  if ((member as unknown as Record<string, unknown>).avatar_path) {
    await svc.storage.from('avatars').remove([(member as unknown as Record<string, string>).avatar_path])
    console.log('[DELETE USER]', { step: 'avatar_storage', userId: memberId, status: 'ok' })
  }

  // ── Étape 1 — Key Account (du plus profond au plus haut) ─────────────────
  logStep('ka_notes',    (await svc.from('ka_notes').delete().eq('user_id', memberId)).error)
  logStep('ka_contacts', (await svc.from('ka_contacts').delete().eq('user_id', memberId)).error)
  logStep('ka_accounts', (await svc.from('ka_accounts').delete().eq('user_id', memberId)).error)

  // ── Étape 2 — Projects et leurs enfants ──────────────────────────────────
  const { data: ownedProjects } = await svc.from('projects').select('id').eq('user_id', memberId)
  const ownedProjectIds = (ownedProjects ?? []).map((p: Record<string, unknown>) => p.id as string)

  if (ownedProjectIds.length > 0) {
    logStep('project_contacts',              (await svc.from('project_contacts').delete().in('project_id', ownedProjectIds)).error)
    logStep('project_collaborators_owned',   (await svc.from('project_collaborators').delete().in('project_id', ownedProjectIds)).error)
  }
  // Collaborations du membre sur les projets d'autres
  logStep('project_collaborators_member', (await svc.from('project_collaborators').delete().eq('user_id', memberId)).error)
  logStep('project_saves',                (await svc.from('project_saves').delete().eq('user_id', memberId)).error)
  logStep('projects',                     (await svc.from('projects').delete().eq('user_id', memberId)).error)

  // ── Étape 3 — Meetings et disponibilités ─────────────────────────────────
  logStep('meeting_requests_req',      (await svc.from('meeting_requests').delete().eq('requester_id', memberId)).error)
  logStep('meeting_requests_rec',      (await svc.from('meeting_requests').delete().eq('recipient_id', memberId)).error)
  logStep('public_meeting_requests',   (await svc.from('public_meeting_requests').delete().eq('recipient_id', memberId)).error)
  logStep('availability_slots',        (await svc.from('availability_slots').delete().eq('user_id', memberId)).error)

  // ── Étape 4 — Transactions financières ───────────────────────────────────
  // points_transactions utilise profile_id (pas user_id)
  logStep('points_transactions',       (await svc.from('points_transactions').delete().eq('profile_id', memberId)).error)
  logStep('tokens_transactions',       (await svc.from('tokens_transactions').delete().eq('user_id', memberId)).error)
  logStep('invoices',                  (await svc.from('invoices').delete().eq('user_id', memberId)).error)
  logStep('commissions',               (await svc.from('commissions').delete().eq('affiliate_id', memberId)).error)
  logStep('affiliate_commissions',     (await svc.from('affiliate_commissions').delete().eq('beneficiary_id', memberId)).error)

  // ── Étape 5 — Réseau et contenu ──────────────────────────────────────────
  logStep('referrals_referrer',        (await svc.from('referrals').delete().eq('referrer_id', memberId)).error)
  logStep('referrals_referee',         (await svc.from('referrals').delete().eq('referee_id', memberId)).error)
  logStep('affiliation_pipe',          (await svc.from('affiliation_pipe').delete().eq('user_id', memberId)).error)
  logStep('deallinks',                 (await svc.from('deallinks').delete().eq('owner_id', memberId)).error)
  logStep('sidehustle_projects',       (await svc.from('sidehustle_projects').delete().eq('user_id', memberId)).error)
  logStep('replique_scripts',          (await svc.from('replique_scripts').delete().eq('user_id', memberId)).error)

  // ── Étape 6 — Profil (bloquant : on stoppe si ça échoue) ────────────────
  const { error: profileErr } = await svc.from('profiles').delete().eq('id', memberId)
  if (profileErr) {
    console.error('[DELETE USER]', { step: 'profiles', userId: memberId, status: 'error', error: profileErr.message })
    return NextResponse.json({
      error: 'Échec suppression profil — FK non nettoyée',
      step: 'profiles',
      detail: profileErr.message,
    }, { status: 500 })
  }
  console.log('[DELETE USER]', { step: 'profiles', userId: memberId, status: 'ok' })

  // ── Étape 7 — Nullifier FK directes vers auth.users (events, broadcasts, audit_log) ─
  // Ces tables ont REFERENCES auth.users sans ON DELETE CASCADE → bloquent deleteUser
  logStep('events_created_by',        (await svc.from('events').update({ created_by: null }).eq('created_by', memberId)).error)
  logStep('broadcasts_sent_by',       (await svc.from('broadcasts').update({ sent_by: null }).eq('sent_by', memberId)).error)
  logStep('admin_audit_log_admin_id', (await svc.from('admin_audit_log').update({ admin_id: null }).eq('admin_id', memberId)).error)

  // ── Étape 8 — Compte auth (en tout dernier) ───────────────────────────────
  const { error: deleteError } = await svc.auth.admin.deleteUser(memberId)
  console.log('[DELETE USER]', { step: 'auth_delete_user', userId: memberId, status: deleteError ? 'error' : 'ok', error: deleteError?.message ?? null })

  if (deleteError) {
    return NextResponse.json({
      error: 'Échec suppression compte auth',
      step: 'auth_delete_user',
      detail: deleteError.message,
    }, { status: 500 })
  }

  console.log('[DELETE USER]', { step: 'complete', userId: memberId, status: 'ok' })
  return NextResponse.json({ success: true })
}
