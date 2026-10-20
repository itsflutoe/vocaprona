import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  endSession,
  getSession,
  joinUrl,
  listParticipants,
} from '@/services/sessions'
import { playUrl } from '@/services/games'
import { listAttemptsForSession, type PlayAttempt } from '@/services/scores'
import type { SessionParticipant, SessionWithGame } from '@/types'

export default function SessionHost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithGame | null>(null)
  const [participants, setParticipants] = useState<SessionParticipant[]>([])
  const [attempts, setAttempts] = useState<PlayAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) return
    try {
      const s = await getSession(id)
      if (!s) {
        setError('Session not found')
        setSession(null)
        return
      }
      setSession(s)
      const [list, scores] = await Promise.all([
        listParticipants(id),
        listAttemptsForSession(id).catch(() => [] as PlayAttempt[]),
      ])
      setParticipants(list)
      setAttempts(scores)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 4000)
    return () => clearInterval(t)
  }, [refresh])

  async function handleEnd() {
    if (
      !id ||
      !confirm('End this class session? Students will no longer be able to join with this code.')
    ) {
      return
    }
    setEnding(true)
    try {
      await endSession(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not end session')
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <p>{error || 'Session not found'}</p>
        <Link to="/dashboard" className="mt-4 text-teal-400 hover:underline">
          Back to library
        </Link>
      </div>
    )
  }

  const game = session.games
  const isActive = session.status === 'active'

  // Latest attempt per player label
  const latestByPlayer = new Map<string, PlayAttempt>()
  for (const a of [...attempts].reverse()) {
    const key = (a.player_label || 'Anonymous').toLowerCase()
    latestByPlayer.set(key, a)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-sm text-teal-400 hover:underline">
            ← Library
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
              isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {isActive ? 'Live class' : 'Ended'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-center text-sm text-slate-400">Students join with this code</p>
        <div className="mt-4 rounded-3xl bg-white px-6 py-10 text-center text-slate-900 shadow-2xl">
          <p className="text-sm font-medium text-slate-500">{game?.title || 'Game'}</p>
          <p className="mt-4 font-mono text-6xl font-black tracking-[0.25em] text-teal-700 sm:text-7xl">
            {session.join_code}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Go to <strong className="text-slate-800">vocaprona.vercel.app/join</strong>
          </p>
          {isActive && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(joinUrl(session.join_code))}
              className="mt-4 text-sm text-teal-600 hover:underline"
            >
              Copy join link
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Class roster</h2>
            <p className="text-xs text-slate-500">Updates every few seconds</p>
          </div>

          {participants.length === 0 && attempts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Waiting for students…</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {participants.map((p) => {
                const score = latestByPlayer.get(p.nickname.toLowerCase())
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium">{p.nickname}</span>
                    {score ? (
                      <span className="rounded-full bg-teal-500/20 px-3 py-1 text-sm font-semibold text-teal-300">
                        {score.correct_count}/{score.total_cards} done
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Playing…</span>
                    )}
                  </li>
                )
              })}
              {/* Scores from players not in participant list (edge cases) */}
              {[...latestByPlayer.entries()]
                .filter(
                  ([key]) =>
                    !participants.some((p) => p.nickname.toLowerCase() === key)
                )
                .map(([key, score]) => (
                  <li
                    key={score.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium">{score.player_label || key}</span>
                    <span className="rounded-full bg-teal-500/20 px-3 py-1 text-sm font-semibold text-teal-300">
                      {score.correct_count}/{score.total_cards} done
                    </span>
                  </li>
                ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Finished: {latestByPlayer.size} · Joined: {participants.length}
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          {game?.share_slug && (
            <a
              href={playUrl(game.share_slug)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-teal-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-teal-400"
            >
              Open game (demo)
            </a>
          )}
          {isActive ? (
            <button
              type="button"
              disabled={ending}
              onClick={() => void handleEnd()}
              className="rounded-lg border border-white/20 px-5 py-2.5 font-medium text-slate-200 hover:bg-white/5 disabled:opacity-60"
            >
              {ending ? 'Ending…' : 'End class'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-white/20 px-5 py-2.5 font-medium text-slate-200 hover:bg-white/5"
            >
              Back to library
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
