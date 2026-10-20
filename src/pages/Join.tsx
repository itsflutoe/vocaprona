import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveSessionByCode, joinSession } from '@/services/sessions'
import { savePlaySessionContext } from '@/services/scores'

export default function Join() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(params.get('code') || '')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const c = params.get('code')
    if (c) setCode(c.toUpperCase())
  }, [params])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await getActiveSessionByCode(code)
      if (!session) {
        setError('No active class with that code.')
        return
      }
      const game = session.games
      if (!game?.share_slug) {
        setError('This class is not ready to play.')
        return
      }
      const name = nickname.trim() || 'Student'
      await joinSession(session.id, name)
      savePlaySessionContext({ sessionId: session.id, playerLabel: name })
      navigate(`/play/${game.share_slug}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-600 to-teal-900">
      <div className="px-4 pt-6 text-center">
        <Link to="/" className="text-sm font-semibold text-teal-100 hover:text-white">
          VocaProna
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-center text-2xl font-bold text-slate-900">Join class</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Class code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] uppercase focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="ABCD"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Your name</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Mia"
                maxLength={40}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-3.5 text-lg font-bold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
