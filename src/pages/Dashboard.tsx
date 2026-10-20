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
import { AppHeader, headerBtnGhost, headerLink } from '@/components/AppHeader'
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
      setGames(await listMyGamesWithCovers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load games')
    } finally {
      setGamesLoading(false)
    }
  }, [])

  const loadActive = useCallback(async () => {
    if (!profile) return
    try {
      setActiveSession(await getMyActiveSession(profile.id))
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
    if (!confirm(`Delete "${game.title}"?`)) return
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
      setError('Publish the game first.')
      return
    }
    if (activeSession) {
      if (confirm('A class is already live. Open it?')) {
        navigate(`/dashboard/session/${activeSession.id}`)
      }
      return
    }
    const defaultName = `${game.title} · ${new Date().toLocaleDateString()}`
    const name = window.prompt('Class name', defaultName)
    if (name === null) return

    setStartingId(game.id)
    setError('')
    try {
      const session = await startSession(profile.id, game.id, name.trim() || defaultName)
      navigate(`/dashboard/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start class')
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
      <AppHeader
        variant="dark"
        right={
          <>
            <Link to="/dashboard" className={headerLink(true, true)}>
              My games
            </Link>
            <Link to="/library" className={headerLink(true)}>
              Library
            </Link>
            <Link to="/dashboard/classes" className={headerLink(true)}>
              Classes
            </Link>
            <Link to="/guide" className={headerLink(true)}>
              Guide
            </Link>
            <button type="button" onClick={() => void handleLogout()} className={headerBtnGhost(true)}>
              Log out
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeSession && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-amber-100">Class in progress</p>
              <p className="text-xs text-amber-200/80">
                {sessionDisplayName(activeSession)}
                {activeSession.join_code ? ` · ${activeSession.join_code}` : ''}
              </p>
            </div>
            <Link
              to={`/dashboard/session/${activeSession.id}`}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Resume
            </Link>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">My games</h1>
          <Link
            to="/dashboard/games/new"
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400"
          >
            New game
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
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-200">No games yet</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/games/new"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400"
              >
                Create a game
              </Link>
              <Link
                to="/library"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Browse library
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {subjectGroups.map(({ subject, games: list }) => (
              <section key={subject}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {subject}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {list.map((game) => (
                    <article
                      key={game.id}
                      className="group flex flex-col overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10 transition hover:ring-teal-400/40"
                    >
                      <Link
                        to={`/dashboard/games/${game.id}`}
                        className="relative block aspect-square overflow-hidden"
                      >
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <h3 className="line-clamp-2 text-sm font-bold text-white">{game.title}</h3>
                        </div>
                        <span
                          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            game.status === 'published'
                              ? 'bg-teal-500 text-slate-950'
                              : 'bg-black/50 text-slate-200'
                          }`}
                        >
                          {game.status === 'published' ? 'Live' : 'Draft'}
                        </span>
                      </Link>
                      <div className="flex flex-col gap-1 border-t border-white/5 p-2">
                        <Link
                          to={`/dashboard/games/${game.id}`}
                          className="rounded-md bg-white/10 py-1.5 text-center text-xs font-medium hover:bg-white/15"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/dashboard/games/${game.id}/scores`}
                          className="rounded-md py-1 text-center text-xs text-slate-400 hover:text-white"
                        >
                          Scores
                        </Link>
                        {game.status === 'published' && (
                          <>
                            <button
                              type="button"
                              disabled={startingId === game.id}
                              onClick={() => void handleStartClass(game)}
                              className="rounded-md bg-teal-500/90 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
                            >
                              {startingId === game.id ? '…' : 'Start class'}
                            </button>
                            {game.share_slug && (
                              <a
                                href={playUrl(game.share_slug)}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1 text-center text-xs text-slate-500 hover:text-teal-300"
                              >
                                Play link
                              </a>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDelete(game)}
                          className="py-1 text-xs text-red-400/70 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
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
