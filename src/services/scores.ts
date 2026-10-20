import { supabase } from '@/lib/supabase'

export interface PlayAttempt {
  id: string
  game_id: string
  session_id: string | null
  player_label: string | null
  score: number
  total_cards: number
  correct_count: number
  duration_seconds: number | null
  created_at: string
}

export async function submitAttempt(input: {
  gameId: string
  sessionId?: string | null
  playerLabel?: string | null
  score: number
  totalCards: number
  correctCount: number
  durationSeconds?: number | null
}): Promise<PlayAttempt | null> {
  const { data, error } = await supabase
    .from('play_attempts')
    .insert({
      game_id: input.gameId,
      session_id: input.sessionId || null,
      player_label: input.playerLabel?.trim() || null,
      score: input.score,
      total_cards: input.totalCards,
      correct_count: input.correctCount,
      duration_seconds: input.durationSeconds ?? null,
    })
    .select()
    .single()

  if (error) {
    // Don't block the student if scoring fails
    console.warn('submitAttempt failed', error.message)
    return null
  }
  return data as PlayAttempt
}

export async function listAttemptsForGame(gameId: string): Promise<PlayAttempt[]> {
  const { data, error } = await supabase
    .from('play_attempts')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)
  return (data || []) as PlayAttempt[]
}

export async function deleteAttempt(id: string): Promise<void> {
  const { error } = await supabase.from('play_attempts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function clearAttemptsForGame(gameId: string): Promise<void> {
  const { error } = await supabase.from('play_attempts').delete().eq('game_id', gameId)
  if (error) throw new Error(error.message)
}
