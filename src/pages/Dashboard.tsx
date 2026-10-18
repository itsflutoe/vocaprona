import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth'
import { deleteGame, listMyGames, playUrl } from '@/services/games'
import type { Game } from '@/types'

export default function Dashboard() {
  const { profile, loading, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGames = useCallback(async () => {
    setGamesLoading(true)
    setError('')
    try {
      const list = await listMyGames()
      setGames(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load games')
    } finally {
      setGamesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !profileLoading && profile) {
      void loadGames()
    }
  }, [loading, profileLoading, profile, loadGames])

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

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-teal-700">VocaProna</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
              Teacher
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {profile?.display_name || profile?.username || 'Teacher'}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-500">
              Create and manage educational speech games for your students.
            </p>
          </div>
          <Link
            to="/dashboard/games/new"
            className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700"
          >
            Create New Game
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {gamesLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-700">No games yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first game, add activity cards, then publish a share link for students.
            </p>
            <Link
              to="/dashboard/games/new"
              className="mt-6 inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700"
            >
              Create New Game
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {games.map((game) => (
              <li
                key={game.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-slate-900">{game.title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        game.status === 'published'
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {game.subject}
                    {game.custom_subject ? ` · ${game.custom_subject}` : ''}
                    {' · '}
                    {new Date(game.updated_at).toLocaleDateString()}
                  </p>
                  {game.status === 'published' && game.share_slug && (
                    <p className="mt-1 truncate text-xs text-teal-700">
                      {playUrl(game.share_slug)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/dashboard/games/${game.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  {game.status === 'published' && game.share_slug && (
                    <a
                      href={playUrl(game.share_slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
                    >
                      Open play
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(game)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-800">Account</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-medium text-slate-800">{profile?.username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-800">{profile?.role}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  )
}
