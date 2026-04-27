import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import PublicProfileClient from './PublicProfileClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name, tagline, bio, display_name')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Profil · Nouveau Variable' }

  const name = data.display_name || `${data.first_name} ${data.last_name}`
  return {
    title: `${name} · Nouveau Variable`,
    description: data.tagline || data.bio?.slice(0, 160) || `Profil de ${name} sur Nouveau Variable`,
    openGraph: { title: `${name} · Nouveau Variable`, description: data.tagline ?? '' },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, avatar_url, tagline, bio, role_title, role_type, rank, cities, sectors, services, links, track_record, missions_count, rating, is_founder, slug, referral_code')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  return <PublicProfileClient profile={profile} />
}
