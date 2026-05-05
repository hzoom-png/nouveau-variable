export type MeetingType = 'dinner' | 'lunch' | 'afterwork' | 'coffee' | 'work' | 'event'

export interface ServiceItem {
  title: string
  description: string
}

export interface LinkItem {
  label: string
  url: string
}

export interface TrackRecord {
  title: string
  value: string
  year?: string
}

export interface AvailabilitySlot {
  id?: string
  day_of_week: number
  time_label: string
}

export interface MemberProfile {
  id: string
  first_name: string
  last_name: string
  role_title?: string
  rank: Rank
  cities: string[]
  sectors: string[]
  meeting_types: string[]
  missions_count: number
  rating: number
  avatar_url?: string
  tagline?: string
  bio?: string
  slug?: string
  profile_visible?: boolean
  member_number?: number
}
export type MeetingStatus = 'pending' | 'accepted' | 'confirmed' | 'declined' | 'cancelled' | 'completed'
export type Rank = 'explorateur' | 'connecteur' | 'amplificateur'

export interface Profile {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  bio?: string
  role_title?: string
  cities: string[]
  sectors: string[]
  commercial_type?: 'btob' | 'btoc' | 'both'
  meeting_types: string[]
  available_days: string[]
  max_meetings_per_week: number
  points_balance: number
  referral_code?: string
  referred_by?: string
  affiliate_n2_rate: number
  is_active: boolean
  is_founder: boolean
  rank: Rank
  missions_count: number
  rating: number
  notif_meeting_request: boolean
  notif_new_referral: boolean
  notif_commission: boolean
  notif_newsletter: boolean
  tokens_balance?: number
  tokens_total_used?: number
  commercial_context?: CommercialContext
  slug?: string
  display_name?: string
  avatar_url?: string
  tagline?: string
  role_type?: 'salarie' | 'freelance' | 'entrepreneur' | 'dirigeant'
  services?: ServiceItem[]
  links?: LinkItem[]
  track_record?: TrackRecord[]
  profile_visible?: boolean
  onboarding_completed?: boolean
  member_number?: number
}

export interface CommercialContext {
  product?: string
  icp?: string
  value_prop?: string
  typical_objections?: string
  sector?: string
  location?: string
  tone?: string
}

export interface MeetingSlot {
  date: string
  time: string
  label: string
}

export interface MeetingRequest {
  id: string
  created_at: string
  requester_id: string
  recipient_id: string
  meeting_type: MeetingType
  proposed_slots: MeetingSlot[]
  chosen_slot?: MeetingSlot
  location_name?: string
  location_city?: string
  message?: string
  status: MeetingStatus
  points_cost: number
  points_earned: number
  requester?: Profile
  recipient?: Profile
}
