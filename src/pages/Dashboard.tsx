import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth'
import {
  deleteGame,
  groupGamesBySubject,
  listMyGamesWithCovers,
  playUrl,
} from '@/services/games'
import {
  getMyActiveSession,
  sessionDisplayName,
  startSession,
} from '@/services/sessions'
import type { Game, SessionWithGame } from '@/types'

type GameCover = Game & { cover_url: string | null }

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

export default function Dashboard() {
  const { profile, loading, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<GameCover[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [error, setError] = useState('')
  const [startingId, setStartingId] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<SessionWithGame | null>(null)

  const loadGames = useCallback(async () => {
    setGamesLoading(true)
    setError('')
    try {
      const list = await listMyGamesWithCovers()
      setGames(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load games')
    } finally {
      setGamesLoading(false)
    }
  }, [])

  const loadActive = useCallback(async () => {
    if (!profile) return
    try {
      const s = await getMyActiveSession(profile.id)
      setActiveSession(s)
    } catch {
      setActiveSession(null)
    }
  }, [profile])

  useEffect(() => {
    if (!loading && !profileLoading && profile) {
      void loadGames()
      void loadActive()
    }
  }, [loading, profileLoading, profile, loadGames, loadActive])

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Delete "${game.title}"? This cannot be undone.`)) return
    try {
      await deleteGame(game.id)
      setGames((prev) => prev.filter((g) => g.id !== game.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleStartClass(game: Game) {
    if (!profile) return
    if (game.status !== 'published') {
      setError('Publish the game first, then start a class session.')
      return
    }
    if (activeSession) {
      const go = confirm(
        `You already have a live class open (${sessionDisplayName(activeSession)}).\n\nOK = go back to that class\nCancel = stay here`
      )
      if (go) {
        navigate(`/dashboard/session/${activeSession.id}`)
      }
      return
    }
    const defaultName = `${game.title} · ${new Date().toLocaleDateString()}`
    const name = window.prompt('Name this class (optional)', defaultName)
    if (name === null) return

    setStartingId(game.id)
    setError('')
    try {
      const session = await startSession(profile.id, game.id, name.trim() || defaultName)
      navigate(`/dashboard/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session')
    } finally {
      setStartingId(null)
    }
  }

  const subjectGroups = groupGamesBySubject(games)

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-teal-400">VocaProna</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
              My library
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/library" className="text-sm text-slate-400 hover:text-white">
              Shared Library
            </Link>
            <Link to="/dashboard/classes" className="text-sm text-slate-400 hover:text-white">
              My classes
            </Link>
            <Link to="/join" className="hidden text-sm text-slate-400 hover:text-white sm:inline">
              Student join
            </Link>
            <span className="text-sm text-slate-400">
              {profile?.display_name || profile?.username}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeSession && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-amber-100">Live class still open</p>
              <p className="text-xs text-amber-200/90">
                {sessionDisplayName(activeSession)}
                {activeSession.join_code ? ` · code ${activeSession.join_code}` : ''}
              </p>
            </div>
            <Link
              to={`/dashboard/session/${activeSession.id}`}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Resume class
            </Link>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your games</h1>
            <p className="mt-1 text-slate-400">
              Only games you own, grouped by subject. Browse community games in{' '}
              <Link to="/library" className="text-teal-400 hover:underline">
                Shared Library
              </Link>
              .
            </p>
          </div>
          <Link
            to="/dashboard/games/new"
            className="rounded-lg bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-teal-400"
          >
            + New game
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {gamesLoading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-16 text-center">
            <p className="text-xl font-medium text-slate-200">No games in your library yet</p>
            <Link
              to="/dashboard/games/new"
              className="mt-8 inline-block rounded-lg bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-teal-400"
            >
              Create your first game
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Or{' '}
              <Link to="/library" className="text-teal-400 hover:underline">
                copy one from Shared Library
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {subjectGroups.map(({ subject, games: list }) => (
              <section key={subject}>
                <h2 className="mb-4 text-lg font-semibold text-teal-300">{subject}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {list.map((game) => (
                    <article
                      key={game.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl bg-slate-900 shadow-lg ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-teal-400/50"
                    >
                      <Link
                        to={`/dashboard/games/${game.id}`}
                        className="relative block aspect-square overflow-hidden"
                      >
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${coverGradient(game.id)} p-4`}
                          >
                            <span className="text-4xl font-black text-white/90">
                              {game.title.slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow">
                            {game.title}
                          </h2>
                        </div>
                        <span
                          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            game.status === 'published'
                              ? 'bg-teal-500 text-slate-950'
                              : 'bg-black/60 text-slate-200'
                          }`}
                        >
                          {game.status === 'published' ? 'Live' : 'Draft'}
                        </span>
                      </Link>
                      <div className="flex flex-col gap-1.5 border-t border-white/5 p-2">
                        <Link
                          to={`/dashboard/games/${game.id}`}
                          className="rounded-md bg-white/10 py-1.5 text-center text-xs font-medium text-white hover:bg-white/15"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/dashboard/games/${game.id}/scores`}
                          className="rounded-md bg-white/5 py-1.5 text-center text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                          Score history
                        </Link>
                        {game.status === 'published' && (
                          <>
                            <button
                              type="button"
                              disabled={startingId === game.id}
                              onClick={() => void handleStartClass(game)}
                              className="rounded-md bg-teal-500/90 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
                            >
                              {startingId === game.id ? 'Starting…' : 'Start class (live)'}
                            </button>
                            {game.share_slug && (
                              <a
                                href={playUrl(game.share_slug)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md py-1 text-center text-xs text-slate-400 hover:text-teal-300"
                              >
                                Open play link
                              </a>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDelete(game)}
                          className="rounded-md py-1 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {subject === subjectGroups[subjectGroups.length - 1]?.subject && (
                    <Link
                      to="/dashboard/games/new"
                      className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 text-slate-500 transition hover:border-teal-400/50 hover:text-teal-300"
                    >
                      <span className="text-3xl">+</span>
                      <span className="mt-2 text-sm font-medium">New game</span>
                    </Link>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
