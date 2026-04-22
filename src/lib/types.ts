export type MeetingType = 'dinner' | 'lunch' | 'afterwork' | 'coffee' | 'work' | 'event'
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
