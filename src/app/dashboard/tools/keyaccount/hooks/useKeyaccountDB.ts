'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { KaAccount, KaContact, Stage } from '../types'

export function useKeyaccountDB() {
  const [accounts, setAccounts] = useState<KaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAccountIdx, setActiveAccountIdx] = useState(0)
  const [view, setView] = useState<'map' | 'list'>('map')
  const dragTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        setError('Non authentifié')
        setLoading(false)
        return
      }

      const { data: dbAccounts, error: accErr } = await supabase
        .from('ka_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (accErr) {
        setError(accErr.message)
        setLoading(false)
        return
      }

      if (!dbAccounts?.length) {
        setAccounts([])
        setLoading(false)
        return
      }

      const { data: dbContacts, error: conErr } = await supabase
        .from('ka_contacts')
        .select('*')
        .in('account_id', dbAccounts.map((a: { id: string }) => a.id))
        .eq('user_id', user.id)

      if (conErr) {
        setError(conErr.message)
        setLoading(false)
        return
      }

      const assembled: KaAccount[] = dbAccounts.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        name: a.name as string,
        sector: (a.sector as string) ?? '',
        val: (a.val as string) ?? '',
        stage: a.stage as Stage,
        contacts: ((dbContacts ?? []) as Record<string, unknown>[])
          .filter(c => c.account_id === a.id)
          .map(c => ({
            id: c.id as string,
            name: c.name as string,
            role: (c.role as string) ?? '',
            email: (c.email as string) ?? '',
            notes: (c.notes as string) ?? '',
            type: c.type as KaContact['type'],
            x: (c.pos_x as number) ?? 0.5,
            y: (c.pos_y as number) ?? 0.5,
            checks: Array.isArray(c.checks) ? c.checks : [],
          })),
      }))

      setAccounts(assembled)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addAccount = useCallback(async (account: KaAccount) => {
    // Optimistic update
    setAccounts(prev => {
      const next = [...prev, { ...account, contacts: [] }]
      setActiveAccountIdx(next.length - 1)
      return next
    })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('ka_accounts').insert({
      id: account.id,
      user_id: user.id,
      name: account.name,
      sector: account.sector ?? '',
      val: account.val ?? '',
      stage: account.stage ?? 'Qualification',
    })

    if (error) {
      console.error('addAccount error:', error)
      // Rollback
      setAccounts(prev => prev.filter(a => a.id !== account.id))
    }
  }, [])

  const deleteAccount = useCallback(async (accountId: string) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== accountId)
      setActiveAccountIdx(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })

    const supabase = createClient()
    const { error } = await supabase.from('ka_accounts').delete().eq('id', accountId)
    if (error) console.error('deleteAccount error:', error)
  }, [])

  const addContact = useCallback(async (accountId: string, contact: KaContact) => {
    // Optimistic update
    setAccounts(prev => prev.map(a =>
      a.id === accountId ? { ...a, contacts: [...a.contacts, contact] } : a
    ))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('ka_contacts').insert({
      id: contact.id,
      account_id: accountId,
      user_id: user.id,
      name: contact.name,
      role: contact.role ?? '',
      email: contact.email ?? '',
      notes: contact.notes ?? '',
      type: contact.type,
      pos_x: contact.x ?? 0.5,
      pos_y: contact.y ?? 0.5,
      checks: contact.checks ?? [],
    })

    if (error) {
      console.error('addContact error:', error)
      setAccounts(prev => prev.map(a =>
        a.id === accountId ? { ...a, contacts: a.contacts.filter(c => c.id !== contact.id) } : a
      ))
    }
  }, [])

  const moveContact = useCallback((accountId: string, contactId: string, x: number, y: number) => {
    setAccounts(prev => prev.map(a =>
      a.id !== accountId ? a : {
        ...a,
        contacts: a.contacts.map(c => c.id === contactId ? { ...c, x, y } : c),
      }
    ))

    clearTimeout(dragTimer.current)
    dragTimer.current = setTimeout(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('ka_contacts')
        .update({ pos_x: x, pos_y: y })
        .eq('id', contactId)
      if (error) console.error('moveContact error:', error)
    }, 400)
  }, [])

  const toggleCheck = useCallback(async (
    accountId: string,
    contactId: string,
    sectionIdx: number,
    itemIdx: number
  ) => {
    let updatedChecks: unknown[] = []

    setAccounts(prev => prev.map(a => {
      if (a.id !== accountId) return a
      return {
        ...a,
        contacts: a.contacts.map(c => {
          if (c.id !== contactId) return c
          const newChecks = c.checks.map((s, si) =>
            si !== sectionIdx ? s : {
              ...s,
              items: s.items.map((item, ii) =>
                ii !== itemIdx ? item : { ...item, done: !item.done }
              ),
            }
          )
          updatedChecks = newChecks
          return { ...c, checks: newChecks }
        }),
      }
    }))

    const supabase = createClient()
    const { error } = await supabase
      .from('ka_contacts')
      .update({ checks: updatedChecks })
      .eq('id', contactId)
    if (error) console.error('toggleCheck error:', error)
  }, [])

  const updateAccount = useCallback(async (
    accountId: string,
    fields: Partial<Pick<KaAccount, 'name' | 'sector' | 'val' | 'stage'>>
  ) => {
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, ...fields } : a))

    const supabase = createClient()
    const { error } = await supabase
      .from('ka_accounts')
      .update(fields)
      .eq('id', accountId)
    if (error) console.error('updateAccount error:', error)
  }, [])

  const activeAccount = accounts[activeAccountIdx] ?? null

  return {
    accounts, loading, error,
    activeAccount, activeAccountIdx,
    setActiveAccountIdx,
    view, setView,
    addAccount, deleteAccount,
    addContact, moveContact,
    toggleCheck, updateAccount,
    reload: load,
  }
}
