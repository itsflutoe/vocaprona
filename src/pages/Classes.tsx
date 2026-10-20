import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  clearAllMySessions,
  deleteSession,
  listMySessions,
  sessionDisplayName,
} from '@/services/sessions'
import type { SessionWithGame } from '@/types'

export default function Classes() {
  const { profile, loading, profileLoading } = useAuth()
  const [sessions, setSessions] = useState<SessionWithGame[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!profile) return
    setBusy(true)
    setError('')
    try {
      const list = await listMySessions(profile.id)
      setSessions(list)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load classes')
    } finally {
      setBusy(false)
    }
  }, [profile])

  useEffect(() => {
    if (!loading && !profileLoading && profile) void load()
  }, [loading, profileLoading, profile, load])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === sessions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sessions.map((s) => s.id)))
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return
    if (
      !confirm(
        `Delete ${selected.size} class(es)? Roster is removed. Game score history is kept but unlinked from the class.`
      )
    ) {
      return
    }
    setWorking(true)
    setError('')
    try {
      for (const id of selected) {
        await deleteSession(id)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setWorking(false)
    }
  }

  async function handleClearAll() {
    if (!profile || sessions.length === 0) return
    if (
      !confirm(
        'Clear ALL class history? This cannot be undone. Game score history stays under each game.'
      )
    ) {
      return
    }
    setWorking(true)
    setError('')
    try {
      await clearAllMySessions(profile.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed')
    } finally {
      setWorking(false)
    }
  }

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
          Open a class for roster & scores. Delete ones you no longer need.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {sessions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              {selected.size === sessions.length ? 'Deselect all' : 'Select all'}
            </button>
            <button
              type="button"
              disabled={working || selected.size === 0}
              onClick={() => void handleDeleteSelected()}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              Delete selected ({selected.size})
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => void handleClearAll()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Clear all history
            </button>
          </div>
        )}

        {sessions.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No classes yet. From the library, open a published game and tap{' '}
            <strong>Start class (live)</strong>.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-stretch gap-2 rounded-xl border border-slate-200 bg-white"
              >
                <label className="flex items-center px-3">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600"
                  />
                </label>
                <Link
                  to={`/dashboard/session/${s.id}`}
                  className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 py-4 pr-4 hover:bg-teal-50/40"
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
