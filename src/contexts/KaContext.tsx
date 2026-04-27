'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useKeyaccountDB } from '@/app/dashboard/tools/keyaccount/hooks/useKeyaccountDB'
import { cloneTemplate } from '@/app/dashboard/tools/keyaccount/meddicc'
import type { KaContact } from '@/app/dashboard/tools/keyaccount/types'
import type { KaAction } from '@/app/dashboard/tools/keyaccount/hooks/useKeyaccount'

type KaContextType = ReturnType<typeof useKeyaccountDB> & {
  dispatch: React.Dispatch<KaAction>
}

const KaContext = createContext<KaContextType | null>(null)

export function KaProvider({ children }: { children: ReactNode }) {
  const ka = useKeyaccountDB()

  const dispatch: React.Dispatch<KaAction> = (action: KaAction) => {
    switch (action.type) {
      case 'ADD_ACCOUNT': {
        const { name, sector, val, stage } = action.payload
        const id = crypto.randomUUID()
        void ka.addAccount({ id, name, sector, val, stage, contacts: [] })
        break
      }
      case 'DELETE_ACCOUNT':
        void ka.deleteAccount(action.payload.id)
        break
      case 'ADD_CONTACT': {
        const { accountId, name, role, email, notes, contactType } = action.payload
        const acc = ka.accounts.find(a => a.id === accountId)
        const n = (acc?.contacts.length ?? 0) + 1
        const angle = ((n - 1) / Math.max(n, 3)) * 2 * Math.PI - Math.PI / 2
        const x = 0.5 + 0.32 * Math.cos(angle)
        const y = 0.5 + 0.32 * Math.sin(angle)
        const contact: KaContact = {
          id: crypto.randomUUID(), name, role, email, notes,
          type: contactType, x, y, checks: cloneTemplate(contactType),
        }
        void ka.addContact(accountId, contact)
        break
      }
      case 'MOVE_CONTACT':
        ka.moveContact(action.payload.accountId, action.payload.contactId, action.payload.x, action.payload.y)
        break
      case 'TOGGLE_CHECK':
        void ka.toggleCheck(action.payload.accountId, action.payload.contactId, action.payload.sectionIdx, action.payload.itemIdx)
        break
      case 'SET_ACTIVE_ACCOUNT':
        ka.setActiveAccountIdx(action.payload.idx)
        break
      case 'TOGGLE_VIEW':
        ka.setView(ka.view === 'map' ? 'list' : 'map')
        break
    }
  }

  return (
    <KaContext.Provider value={{ ...ka, dispatch }}>
      {children}
    </KaContext.Provider>
  )
}

export function useKa(): KaContextType {
  const ctx = useContext(KaContext)
  if (!ctx) throw new Error('useKa doit être utilisé dans un KaProvider')
  return ctx
}
