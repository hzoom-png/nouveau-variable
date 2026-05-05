import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/admin-auth'
import { AdminSidebar } from './_components/AdminSidebar'

export const metadata = { title: 'NV Admin', robots: 'noindex' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let authenticated = false
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value
    if (token) {
      await verifyAdminSession(token)
      authenticated = true
    }
  } catch { /* pas authentifié */ }

  if (!authenticated) {
    return (
      <div style={{ background: '#0F1C17', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#0F1C17', fontFamily: 'Inter, sans-serif', color: '#F7FAF8',
    }}>
      <AdminSidebar />
      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
