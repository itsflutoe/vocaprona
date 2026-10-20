import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { groupGamesBySubject, listLibraryGames } from '@/services/games'
import { AppHeader, headerBtnPrimary, headerLink } from '@/components/AppHeader'
import type { LibraryGame } from '@/types'

const COVER_COLORS = [
  'from-teal-700 to-teal-900',
  'from-indigo-700 to-indigo-950',
  'from-rose-700 to-rose-950',
  'from-amber-600 to-amber-900',
  'from-emerald-700 to-emerald-950',
  'from-violet-700 to-violet-950',
]

function coverGradient(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % COVER_COLORS.length
  return COVER_COLORS[h]
}

export default function SharedLibrary() {
  const { session } = useAuth()
  const [games, setGames] = useState<LibraryGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setGames(await listLibraryGames())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const subjects = ['All', ...new Set(games.map((g) => g.subject))]
  const filtered = filter === 'All' ? games : games.filter((g) => g.subject === filter)
  const groups = groupGamesBySubject(filtered)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppHeader
        variant="dark"
        right={
          <>
            {session && (
              <Link to="/dashboard" className={headerLink(true)}>
                My games
              </Link>
            )}
            <Link to="/library" className={headerLink(true, true)}>
              Library
            </Link>
            {!session && (
              <Link to="/login" className={headerBtnPrimary(true)}>
                Log in
              </Link>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-slate-400">Games shared by teachers · copy to use with your class</p>

        {subjects.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  filter === s
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-slate-500">No shared games yet.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {groups.map(({ subject, games: list }) => (
              <section key={subject}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {subject}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {list.map((game) => (
                    <Link
                      key={game.id}
                      to={`/library/${game.id}`}
                      className="group overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10 transition hover:ring-teal-400/40"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`flex h-full items-center justify-center bg-gradient-to-br ${coverGradient(game.id)}`}
                          >
                            <span className="text-3xl font-black text-white/90">
                              {game.title.slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <h3 className="line-clamp-2 text-sm font-bold text-white">{game.title}</h3>
                          <p className="mt-0.5 text-xs text-white/60">
                            {game.author_name}
                            {game.card_count != null ? ` · ${game.card_count}` : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
