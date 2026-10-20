import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGame } from '@/services/games'
import { clearAttemptsForGame, deleteAttempt, listAttemptsForGame, type PlayAttempt } from '@/services/scores'
import type { Game } from '@/types'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [attempts, setAttempts] = useState<PlayAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const g = await getGame(id)
      if (!g) {
        setError('Game not found')
        return
      }
      setGame(g)
      const list = await listAttemptsForGame(id)
      setAttempts(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleClear() {
    if (!id || !confirm('Delete all scores for this game?')) return
    try {
      await clearAttemptsForGame(id)
      setAttempts([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed')
    }
  }

  async function handleDelete(attemptId: string) {
    try {
      await deleteAttempt(attemptId)
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
            ← Library
          </Link>
          {game && (
            <Link
              to={`/dashboard/games/${game.id}`}
              className="text-sm text-slate-500 hover:text-teal-700"
            >
              Edit game
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Scores</h1>
        <p className="mt-1 text-slate-500">
          {game?.title}
          {game && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              tracking: {game.tracking_mode}
            </span>
          )}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {game?.tracking_mode === 'none' && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Tracking is off for this game. Set tracking to <strong>Anonymous</strong> or{' '}
            <strong>Class</strong> in the game editor to collect scores.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">{attempts.length} attempt(s)</p>
          {attempts.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClear()}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {attempts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No scores yet. When students finish a game with tracking on, results appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {a.player_label || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {a.correct_count}/{a.total_cards}
                      <span className="ml-1 text-xs text-slate-400">({a.score} pts)</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(a.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
