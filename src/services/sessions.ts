import { supabase } from '@/lib/supabase'
import type { ClassroomSession, SessionParticipant, SessionWithGame } from '@/types'

function randomJoinCode(len = 4): string {
  // Easy to read aloud (no 0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export async function startSession(
  teacherId: string,
  gameId: string
): Promise<ClassroomSession> {
  // End any other active sessions for this teacher (one live class at a time)
  await supabase
    .from('classroom_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  let lastError = 'Could not create session'
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomJoinCode(4)
    const { data, error } = await supabase
      .from('classroom_sessions')
      .insert({
        game_id: gameId,
        teacher_id: teacherId,
        join_code: code,
        status: 'active',
      })
      .select()
      .single()

    if (!error && data) return data as ClassroomSession
    lastError = error?.message || lastError
  }
  throw new Error(lastError)
}

export async function endSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('classroom_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function getSession(sessionId: string): Promise<SessionWithGame | null> {
  const { data, error } = await supabase
    .from('classroom_sessions')
    .select('*, games(id, title, share_slug, thumbnail_url, subject, status)')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as SessionWithGame | null
}

export async function getActiveSessionByCode(code: string): Promise<SessionWithGame | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const { data, error } = await supabase
    .from('classroom_sessions')
    .select('*, games(id, title, share_slug, thumbnail_url, subject, status)')
    .eq('status', 'active')
    .ilike('join_code', normalized)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as SessionWithGame | null
}

export async function listParticipants(sessionId: string): Promise<SessionParticipant[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as SessionParticipant[]
}

export async function joinSession(
  sessionId: string,
  nickname: string
): Promise<SessionParticipant> {
  const name = nickname.trim().slice(0, 40)
  if (!name) throw new Error('Enter a nickname')

  const { data, error } = await supabase
    .from('session_participants')
    .insert({ session_id: sessionId, nickname: name })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SessionParticipant
}

export async function getMyActiveSession(teacherId: string): Promise<SessionWithGame | null> {
  const { data, error } = await supabase
    .from('classroom_sessions')
    .select('*, games(id, title, share_slug, thumbnail_url, subject, status)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as SessionWithGame | null
}

export function joinUrl(code: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/join?code=${encodeURIComponent(code)}`
  }
  return `/join?code=${encodeURIComponent(code)}`
}
