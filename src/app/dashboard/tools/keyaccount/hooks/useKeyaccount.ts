'use client'

import { useReducer } from 'react'
import type { KaAccount, KaContact, ContactType, Stage } from '../types'
import { cloneTemplate, getScore } from '../meddicc'

// ── State ──
export interface KaState {
  accounts: KaAccount[]
  activeIdx: number
  view: 'map' | 'list'
  nextId: number
}

const initialState: KaState = {
  accounts: [],
  activeIdx: 0,
  view: 'map',
  nextId: 1,
}

// ── Actions ──
export type KaAction =
  | { type: 'ADD_ACCOUNT';    payload: { name: string; sector: string; val: string; stage: Stage } }
  | { type: 'DELETE_ACCOUNT'; payload: { id: string } }
  | { type: 'ADD_CONTACT';    payload: { accountId: string; name: string; role: string; email: string; notes: string; contactType: ContactType } }
  | { type: 'MOVE_CONTACT';   payload: { accountId: string; contactId: string; x: number; y: number } }
  | { type: 'TOGGLE_CHECK';   payload: { accountId: string; contactId: string; sectionIdx: number; itemIdx: number } }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: { idx: number } }
  | { type: 'TOGGLE_VIEW' }

function reducer(state: KaState, action: KaAction): KaState {
  switch (action.type) {

    case 'ADD_ACCOUNT': {
      if (state.accounts.length >= 20) return state
      const { name, sector, val, stage } = action.payload
      const newAcc: KaAccount = {
        id: 'acc' + state.nextId,
        name, sector, val, stage,
        contacts: [],
      }
      const accounts = [...state.accounts, newAcc]
      return { ...state, accounts, activeIdx: accounts.length - 1, nextId: state.nextId + 1 }
    }

    case 'DELETE_ACCOUNT': {
      const accounts = state.accounts.filter(a => a.id !== action.payload.id)
      const activeIdx = Math.min(state.activeIdx, Math.max(0, accounts.length - 1))
      return { ...state, accounts, activeIdx }
    }

    case 'ADD_CONTACT': {
      const { accountId, name, role, email, notes, contactType } = action.payload
      const accounts = state.accounts.map(acc => {
        if (acc.id !== accountId) return acc
        const n = acc.contacts.length + 1
        const angle = ((n - 1) / Math.max(n, 3)) * 2 * Math.PI - Math.PI / 2
        const x = 0.5 + 0.32 * Math.cos(angle)
        const y = 0.5 + 0.32 * Math.sin(angle)
        const contact: KaContact = {
          id: 'kac' + state.nextId,
          name, role, email, notes,
          type: contactType,
          x, y,
          checks: cloneTemplate(contactType),
        }
        return { ...acc, contacts: [...acc.contacts, contact] }
      })
      return { ...state, accounts, nextId: state.nextId + 1 }
    }

    case 'MOVE_CONTACT': {
      const { accountId, contactId, x, y } = action.payload
      const accounts = state.accounts.map(acc => {
        if (acc.id !== accountId) return acc
        return { ...acc, contacts: acc.contacts.map(c => c.id === contactId ? { ...c, x, y } : c) }
      })
      return { ...state, accounts }
    }

    case 'TOGGLE_CHECK': {
      const { accountId, contactId, sectionIdx, itemIdx } = action.payload
      const accounts = state.accounts.map(acc => {
        if (acc.id !== accountId) return acc
        return {
          ...acc,
          contacts: acc.contacts.map(c => {
            if (c.id !== contactId) return c
            const checks = c.checks.map((s, si) => {
              if (si !== sectionIdx) return s
              return { ...s, items: s.items.map((it, ii) => ii === itemIdx ? { ...it, done: !it.done } : it) }
            })
            return { ...c, checks }
          }),
        }
      })
      return { ...state, accounts }
    }

    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeIdx: action.payload.idx }

    case 'TOGGLE_VIEW':
      return { ...state, view: state.view === 'map' ? 'list' : 'map' }

    default:
      return state
  }
}

export function useKeyaccount() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const activeAccount = state.accounts[state.activeIdx] ?? null
  const score = activeAccount ? getScore(activeAccount.contacts) : 0

  return { state, dispatch, activeAccount, score }
}
