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

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  picture_missing_letters: 'Picture + Missing Letters',
  speech: 'Speech / Pronunciation',
  listening: 'Listening',
  sentence: 'Sentence Reading',
}

export const SUBJECTS = [
  'English',
  'Science',
  'Math',
  'History',
  'Art',
  'Music',
  'Physical Education',
  'Other',
] as const

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
  share_slug: string | null
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

export type GameWithCards = Game & { activity_cards?: ActivityCard[] }

export interface CreateGameInput {
  title: string
  description?: string
  subject: string
  custom_subject?: string
  language?: string
  tracking_mode?: TrackingMode
}

export interface CreateCardInput {
  type: ActivityType
  prompt?: string
  image_url?: string
  image_alt?: string
  target_text?: string
  accepted_answers?: string[]
  missing_letter_indices?: number[]
  hints?: string[]
  config?: Record<string, unknown>
  order_index?: number
}

export type SessionStatus = 'active' | 'ended'

export interface ClassroomSession {
  id: string
  game_id: string
  teacher_id: string
  join_code: string
  status: SessionStatus
  created_at: string
  ended_at: string | null
}

export interface SessionParticipant {
  id: string
  session_id: string
  nickname: string
  joined_at: string
}

export type SessionWithGame = ClassroomSession & {
  games?: Pick<Game, 'id' | 'title' | 'share_slug' | 'thumbnail_url' | 'subject' | 'status'>
}
