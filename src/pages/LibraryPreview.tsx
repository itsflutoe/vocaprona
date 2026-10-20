import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getGame, remixGameToMyLibrary } from '@/services/games'
import { AppHeader, headerLink } from '@/components/AppHeader'
import { ACTIVITY_TYPE_LABELS, type GameWithCards } from '@/types'

export default function LibraryPreview() {
  const { id } = useParams<{ id: string }>()
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [game, setGame] = useState<GameWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copying, setCopying] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const g = await getGame(id)
      if (!g || g.status !== 'published' || !g.listed_in_library) {
        setError('This game is not in the library.')
        setGame(null)
        return
      }
      setGame(g)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCopy() {
    if (!profile || !game) {
      navigate('/login')
      return
    }
    setCopying(true)
    setError('')
    try {
      const copy = await remixGameToMyLibrary(game.id, profile.id)
      navigate(`/dashboard/games/${copy.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed')
    } finally {
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <p>{error || 'Not found'}</p>
        <Link to="/library" className="mt-4 text-teal-400 hover:underline">
          Back to library
        </Link>
      </div>
    )
  }

  const cards = game.activity_cards || []
  const isOwn = profile && game.owner_id === profile.id

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppHeader
        variant="dark"
        right={
          <>
            <Link to="/library" className={headerLink(true, true)}>
              Library
            </Link>
            {session && (
              <Link to="/dashboard" className={headerLink(true)}>
                My games
              </Link>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-2xl bg-slate-800">
            {game.thumbnail_url || cards[0]?.image_url ? (
              <img
                src={game.thumbnail_url || cards[0]?.image_url || ''}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl text-slate-600">🎤</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-teal-400">{game.subject}</p>
            <h1 className="mt-1 text-3xl font-bold">{game.title}</h1>
            {game.description && <p className="mt-2 text-slate-400">{game.description}</p>}
            <p className="mt-3 text-sm text-slate-500">{cards.length} cards</p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            )}

            <div className="mt-6">
              {isOwn ? (
                <Link
                  to={`/dashboard/games/${game.id}`}
                  className="inline-block rounded-lg bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-teal-400"
                >
                  Open in my games
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={copying}
                  onClick={() => void handleCopy()}
                  className="rounded-lg bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
                >
                  {copying ? 'Copying…' : session ? 'Copy to my games' : 'Log in to copy'}
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">Cards</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {cards.map((c, i) => (
              <li key={c.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="aspect-square bg-slate-800">
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-slate-600">🎤</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs uppercase tracking-wide text-teal-400">
                    {i + 1}. {ACTIVITY_TYPE_LABELS[c.type]}
                  </p>
                  <p className="mt-1 font-medium">{c.target_text || c.prompt || 'Card'}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
