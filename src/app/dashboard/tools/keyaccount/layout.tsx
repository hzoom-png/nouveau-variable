import { KaProvider } from '@/contexts/KaContext'

export default function KeyaccountLayout({ children }: { children: React.ReactNode }) {
  return <KaProvider>{children}</KaProvider>
}
