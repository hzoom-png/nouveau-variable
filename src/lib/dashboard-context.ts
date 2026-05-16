'use client'

import { createContext, useContext } from 'react'

interface DashboardContextValue {
  isInactive: boolean
  userEmail: string
}

export const DashboardContext = createContext<DashboardContextValue>({
  isInactive: false,
  userEmail: '',
})

export function useDashboard() {
  return useContext(DashboardContext)
}
