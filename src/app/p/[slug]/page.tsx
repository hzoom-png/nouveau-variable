import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { resolveAvatar } from '@/lib/avatar'
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
    .select('id, first_name, last_name, display_name, avatar_url, avatar_path, tagline, bio, role_title, role_type, rank, cities, sectors, services, links, track_record, missions_count, rating, is_founder, slug, member_number, created_at, profile_visible')
    .eq('slug', slug)
    .single()

  if (!profile || profile.profile_visible === false) notFound()

  const avatarUrl = await resolveAvatar({
    avatar_url: (profile as unknown as Record<string, string | undefined>).avatar_url ?? undefined,
    avatar_path: (profile as unknown as Record<string, string | undefined>).avatar_path ?? undefined,
  })

  // Exclude server-only fields from the client component
  const { avatar_path: _ap, avatar_url: _au, profile_visible: _pv, ...profileForClient } = profile as typeof profile & { avatar_path?: string; avatar_url?: string; profile_visible?: boolean }

  return <PublicProfileClient profile={profileForClient} avatarUrl={avatarUrl} />
}
