import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard() {
  const { profile, loading, profileLoading } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
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
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Create and manage educational speech games for your students.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-700">No games yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Phase 1 foundation is ready. Game creation (Phase 2) comes next.
          </p>
          <button
            type="button"
            disabled
            className="mt-6 rounded-lg bg-teal-600/50 px-5 py-2.5 font-medium text-white cursor-not-allowed"
            title="Coming in Phase 2"
          >
            Create New Game
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-800">Account</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Username</dt>
                <dd className="font-medium text-slate-800">{profile?.username}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-800">{profile?.role}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-800">What's next</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
              <li>Game creation wizard</li>
              <li>Four activity types</li>
              <li>Publish & share links</li>
              <li>Classroom sessions</li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </p>
      </main>
    </div>
  )
}
