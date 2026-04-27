'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { KaNote, NoteType } from '../types'

export function useKaNotes(accountId: string) {
  const [notes, setNotes] = useState<KaNote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('ka_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    setNotes((data as KaNote[]) ?? [])
    setLoading(false)
  }, [accountId])

  useEffect(() => { load() }, [load])

  async function addNote(content: string, note_type: NoteType) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('ka_notes')
      .insert({ user_id: user.id, account_id: accountId, content, note_type })
      .select()
      .single()
    if (data) setNotes(prev => [data as KaNote, ...prev])
  }

  async function deleteNote(id: string) {
    const supabase = createClient()
    await supabase.from('ka_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, addNote, deleteNote }
}

export function useKaNotesStats(accountIds: string[]) {
  const [stats, setStats] = useState<Map<string, string>>(new Map())
  const key = accountIds.join(',')

  useEffect(() => {
    if (!accountIds.length) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('ka_notes')
        .select('account_id, created_at')
        .eq('user_id', user.id)
        .in('account_id', accountIds)
        .order('created_at', { ascending: false })
      if (!data) return
      const map = new Map<string, string>()
      for (const row of data as { account_id: string; created_at: string }[]) {
        if (!map.has(row.account_id)) map.set(row.account_id, row.created_at)
      }
      setStats(map)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return stats
}
