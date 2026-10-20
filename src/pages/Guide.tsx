import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppHeader, headerBtnPrimary, headerLink } from '@/components/AppHeader'

export default function Guide() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        right={
          <>
            <Link to="/library" className={headerLink(false)}>
              Library
            </Link>
            <Link to="/guide" className={headerLink(false, true)}>
              Guide
            </Link>
            <Link to="/join" className={headerLink(false)}>
              Join
            </Link>
            {session ? (
              <Link to="/dashboard" className={headerBtnPrimary(false)}>
                My games
              </Link>
            ) : (
              <Link to="/login" className={headerBtnPrimary(false)}>
                Log in
              </Link>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Teacher guide</h1>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">1. Account</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Sign up with a username and password (no email).</li>
            <li>Save the recovery code when it appears.</li>
          </ol>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">2. Create a game</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Open <strong>My games</strong> → <strong>New game</strong>.</li>
            <li>Add a title, subject, and optional cover image URL.</li>
            <li>Add cards (word + optional picture and hint).</li>
            <li>Publish the game.</li>
          </ol>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">3. Students play</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Share the play link, or</li>
            <li>
              Tap <strong>Start class</strong>, show the code, students open{' '}
              <Link to="/join" className="text-teal-700 hover:underline">
                Join
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">4. Scores</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Live scores appear on the class host screen.</li>
            <li>History is under each game’s <strong>Scores</strong> and under <strong>Classes</strong>.</li>
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">5. Share with other teachers</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Publish the game.</li>
            <li>Turn on <strong>List in teacher Library</strong> and save.</li>
            <li>Others find it under Library and can copy it.</li>
          </ol>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Tips</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Microphone works best in Chrome or Edge; students can type instead.</li>
            <li>Square images work best for covers and cards.</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={session ? '/dashboard' : '/register'}
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {session ? 'My games' : 'Create account'}
          </Link>
          <Link
            to="/library"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse library
          </Link>
        </div>
      </main>
    </div>
  )
}
