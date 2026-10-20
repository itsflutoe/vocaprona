import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listMySessions, sessionDisplayName } from '@/services/sessions'
import type { SessionWithGame } from '@/types'

export default function Classes() {
  const { profile, loading, profileLoading } = useAuth()
  const [sessions, setSessions] = useState<SessionWithGame[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!profile) return
    setBusy(true)
    setError('')
    try {
      const list = await listMySessions(profile.id)
      setSessions(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load classes')
    } finally {
      setBusy(false)
    }
  }, [profile])

  useEffect(() => {
    if (!loading && !profileLoading && profile) void load()
  }, [loading, profileLoading, profile, load])

  if (loading || profileLoading || busy) {
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">My classes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Open any class to see the roster, scores, or end a live session you left early.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {sessions.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No classes yet. From the library, open a published game and tap{' '}
            <strong>Start class (live)</strong>.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/dashboard/session/${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{sessionDisplayName(s)}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {s.games?.title || 'Game'}
                      {s.status === 'active' && s.join_code ? ` · code ${s.join_code}` : ''}
                      {' · '}
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      s.status === 'active'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.status === 'active' ? 'Live — resume' : 'Ended'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
