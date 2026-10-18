import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { recoverWithCode } from '@/services/auth'

export default function Recover() {
  const [username, setUsername] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!username.trim() || !recoveryCode.trim()) {
      setError('Username and recovery code are required.')
      return
    }
    setLoading(true)
    try {
      const result = await recoverWithCode(username, recoveryCode, newPassword)
      setDone(true)
      if (result.newRecoveryCode) {
        setNewRecoveryCode(result.newRecoveryCode)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recovery failed'
      // Friendlier notes for common 400 cases
      if (msg.toLowerCase().includes('no recovery code')) {
        setError(
          'This account has no recovery code (often if signup used the fallback path). Contact an admin to reset the password, or register a new account.'
        )
      } else if (msg.toLowerCase().includes('invalid')) {
        setError(
          'Username or recovery code is wrong. Use the exact code shown when you registered (no spaces). Username is lowercase.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Password updated</h1>
          <p className="mt-2 text-sm text-slate-600">
            You can now sign in with your username and the new password.
          </p>
          {newRecoveryCode && (
            <>
              <p className="mt-4 text-sm font-medium text-slate-700">
                Your new recovery code (save it now — the old one no longer works):
              </p>
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center font-mono text-lg tracking-wider text-amber-900 break-all">
                {newRecoveryCode}
              </div>
            </>
          )}
          <Link
            to="/login"
            className="mt-6 block w-full rounded-lg bg-teal-600 px-4 py-2.5 text-center font-medium text-white hover:bg-teal-700"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-teal-700">Recover password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use the recovery code shown once when you registered
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
              Recovery code
            </label>
            <input
              id="code"
              type="text"
              required
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Paste the full code"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Updating…' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Lost your recovery code? An admin can reset your password.
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/login" className="font-medium text-teal-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
