import { supabase } from '@/lib/supabase'
import type {
  ActivityCard,
  CreateCardInput,
  CreateGameInput,
  Game,
  GameWithCards,
} from '@/types'

function randomSlug(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export async function listMyGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as Game[]
}

/** Games with a cover image: thumbnail or first activity card image */
export async function listMyGamesWithCovers(): Promise<(Game & { cover_url: string | null })[]> {
  const games = await listMyGames()
  if (games.length === 0) return []

  const ids = games.map((g) => g.id)
  const { data: cards } = await supabase
    .from('activity_cards')
    .select('game_id, image_url, order_index')
    .in('game_id', ids)
    .not('image_url', 'is', null)
    .order('order_index', { ascending: true })

  const firstImage = new Map<string, string>()
  for (const c of cards || []) {
    if (c.image_url && !firstImage.has(c.game_id)) {
      firstImage.set(c.game_id, c.image_url as string)
    }
  }

  return games.map((g) => ({
    ...g,
    cover_url: g.thumbnail_url || firstImage.get(g.id) || null,
  }))
}

export async function getGame(id: string): Promise<GameWithCards | null> {
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!game) return null

  const { data: cards, error: cardsError } = await supabase
    .from('activity_cards')
    .select('*')
    .eq('game_id', id)
    .order('order_index', { ascending: true })

  if (cardsError) throw new Error(cardsError.message)

  return { ...(game as Game), activity_cards: (cards || []) as ActivityCard[] }
}

export async function getGameBySlug(slug: string): Promise<GameWithCards | null> {
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('share_slug', slug)
    .eq('status', 'published')
    .eq('share_enabled', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!game) return null

  const { data: cards, error: cardsError } = await supabase
    .from('activity_cards')
    .select('*')
    .eq('game_id', game.id)
    .order('order_index', { ascending: true })

  if (cardsError) throw new Error(cardsError.message)

  return { ...(game as Game), activity_cards: (cards || []) as ActivityCard[] }
}

export async function createGame(ownerId: string, input: CreateGameInput): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert({
      owner_id: ownerId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      subject: input.subject,
      custom_subject: input.subject === 'Other' ? input.custom_subject?.trim() || null : null,
      language: input.language || 'en',
      // Default to class so scores work out of the box
      tracking_mode: input.tracking_mode || 'class',
      status: 'draft',
      share_enabled: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Game
}

export async function updateGame(
  id: string,
  patch: Partial<
    Pick<
      Game,
      | 'title'
      | 'description'
      | 'subject'
      | 'custom_subject'
      | 'language'
      | 'status'
      | 'share_enabled'
      | 'share_slug'
      | 'tracking_mode'
      | 'retention_days'
      | 'thumbnail_url'
    >
  >
): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Game
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function publishGame(id: string): Promise<Game> {
  const game = await getGame(id)
  if (!game) throw new Error('Game not found')
  if (!game.activity_cards?.length) {
    throw new Error('Add at least one activity card before publishing.')
  }

  let slug = game.share_slug
  if (!slug) {
    for (let i = 0; i < 5; i++) {
      slug = randomSlug()
      const { data: existing } = await supabase
        .from('games')
        .select('id')
        .eq('share_slug', slug)
        .maybeSingle()
      if (!existing) break
      slug = null
    }
    if (!slug) throw new Error('Could not generate a unique share link. Try again.')
  }

  const cover =
    game.thumbnail_url ||
    game.activity_cards.find((c) => c.image_url)?.image_url ||
    null

  return updateGame(id, {
    status: 'published',
    share_enabled: true,
    share_slug: slug,
    thumbnail_url: cover,
  })
}

export async function unpublishGame(id: string): Promise<Game> {
  return updateGame(id, {
    status: 'draft',
    share_enabled: false,
  })
}

export async function addCard(gameId: string, input: CreateCardInput): Promise<ActivityCard> {
  const { data: existing } = await supabase
    .from('activity_cards')
    .select('order_index')
    .eq('game_id', gameId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex =
    input.order_index ??
    (existing && existing.length > 0 ? (existing[0].order_index as number) + 1 : 0)

  const { data, error } = await supabase
    .from('activity_cards')
    .insert({
      game_id: gameId,
      order_index: nextIndex,
      type: input.type,
      prompt: input.prompt?.trim() || null,
      image_url: input.image_url?.trim() || null,
      image_alt: input.image_alt?.trim() || null,
      target_text: input.target_text?.trim() || null,
      accepted_answers: input.accepted_answers || [],
      missing_letter_indices: input.missing_letter_indices || null,
      hints: input.hints || [],
      config: input.config || {},
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ActivityCard
}

export async function updateCard(
  id: string,
  patch: Partial<
    Pick<
      ActivityCard,
      | 'type'
      | 'prompt'
      | 'image_url'
      | 'image_alt'
      | 'target_text'
      | 'accepted_answers'
      | 'missing_letter_indices'
      | 'hints'
      | 'config'
      | 'order_index'
    >
  >
): Promise<ActivityCard> {
  const { data, error } = await supabase
    .from('activity_cards')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ActivityCard
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('activity_cards').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function playUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/play/${slug}`
  }
  return `/play/${slug}`
}
