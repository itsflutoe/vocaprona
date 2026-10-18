import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGameBySlug } from '@/services/games'
import { ACTIVITY_TYPE_LABELS, type GameWithCards } from '@/types'

/**
 * Public student entry point (no account).
 * Phase 2: shows game + cards preview.
 * Phase 3: full arcade play with speech APIs.
 */
export default function Play() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<GameWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const g = await getGameBySlug(slug)
        if (cancelled) return
        if (!g) {
          setError('This game is not available. It may be unpublished or the link is wrong.')
          setGame(null)
        } else {
          setGame(g)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load game')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-600 to-teal-800">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
        <p className="max-w-md text-center text-slate-700">{error || 'Game not found'}</p>
        <Link to="/" className="mt-6 text-teal-700 hover:underline">
          Go to VocaProna home
        </Link>
      </div>
    )
  }

  const cards = game.activity_cards || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 to-teal-900 text-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-teal-100">
          VocaProna
        </p>
        <h1 className="mt-2 text-center text-3xl font-bold">{game.title}</h1>
        <p className="mt-2 text-center text-teal-100">
          {game.subject}
          {game.description ? ` · ${game.description}` : ''}
        </p>

        <div className="mt-8 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <p className="text-center text-lg font-semibold">
            {cards.length} {cards.length === 1 ? 'activity' : 'activities'}
          </p>
          <ul className="mt-4 space-y-2">
            {cards.map((card, i) => (
              <li
                key={card.id}
                className="rounded-xl bg-white/10 px-4 py-3 text-sm"
              >
                <span className="font-medium text-teal-100">
                  {i + 1}. {ACTIVITY_TYPE_LABELS[card.type]}
                </span>
                <span className="mt-0.5 block text-white">
                  {card.target_text || card.prompt || 'Activity'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-white/20 bg-white/5 p-5 text-center">
          <p className="font-medium">Play mode coming in Phase 3</p>
          <p className="mt-2 text-sm text-teal-100">
            Spelling, speaking, listening, and sentence practice with speech recognition will run
            here. Teachers can already build and share games.
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-teal-200">
          No account needed · Made with VocaProna
        </p>
      </div>
    </div>
  )
}
