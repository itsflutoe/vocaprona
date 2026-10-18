export type UserRole = 'TEACHER' | 'ADMIN'

export interface Profile {
  id: string
  username: string
  display_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type GameStatus = 'draft' | 'published'
export type TrackingMode = 'none' | 'anonymous' | 'class'
export type ActivityType =
  | 'picture_missing_letters'
  | 'speech'
  | 'listening'
  | 'sentence'

export interface Game {
  id: string
  owner_id: string
  title: string
  description: string | null
  subject: string
  custom_subject: string | null
  language: string
  status: GameStatus
  share_enabled: boolean
  thumbnail_url: string | null
  tracking_mode: TrackingMode
  retention_days: number | null
  created_at: string
  updated_at: string
}

export interface ActivityCard {
  id: string
  game_id: string
  order_index: number
  type: ActivityType
  prompt: string | null
  image_url: string | null
  image_alt: string | null
  target_text: string | null
  accepted_answers: string[]
  missing_letter_indices: number[] | null
  hints: string[]
  config: Record<string, unknown>
  created_at: string
}
