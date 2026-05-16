import KeyaccountClient from './KeyaccountClient'
import MobilePcWarning from '@/components/MobilePcWarning'

export default function KeyAccountPage() {
  return (
    <>
      <MobilePcWarning tool="Key Account" />
      <KeyaccountClient />
    </>
  )
}
