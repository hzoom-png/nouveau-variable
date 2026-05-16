import RepliqueClient from './RepliqueClient'
import MobilePcWarning from '@/components/MobilePcWarning'

export default function RepliquePage() {
  return (
    <>
      <MobilePcWarning tool="Réplique" />
      <RepliqueClient />
    </>
  )
}
