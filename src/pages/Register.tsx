import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '@/services/auth'
import { AppHeader, headerBtnPrimary, headerLink } from '@/components/AppHeader'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const result = await signUp(username, password, displayName || username)
      if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (recoveryCode) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader
          right={
            <>
              <Link to="/library" className={headerLink(false)}>
                Library
              </Link>
              <Link to="/guide" className={headerLink(false)}>
                Guide
              </Link>
            </>
          }
        />
        <div className="flex justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Save your recovery code</h1>
            <p className="mt-2 text-sm text-slate-600">
              You’ll need this if you forget your password. It won’t be shown again.
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center font-mono text-lg tracking-wider text-amber-950 break-all">
              {recoveryCode}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(recoveryCode)}
              className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="mt-3 w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        right={
          <>
            <Link to="/library" className={headerLink(false)}>
              Library
            </Link>
            <Link to="/guide" className={headerLink(false)}>
              Guide
            </Link>
            <Link to="/join" className={headerLink(false)}>
              Join
            </Link>
            <Link to="/login" className={headerBtnPrimary(false)}>
              Log in
            </Link>
          </>
        }
      />
      <div className="flex justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Teachers only · no email required</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
                Display name <span className="font-normal text-slate-400">optional</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-teal-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
