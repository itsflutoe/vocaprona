import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppHeader, headerBtnGhost, headerBtnPrimary, headerLink } from '@/components/AppHeader'

export default function Landing() {
  const { session } = useAuth()

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
            {session ? (
              <Link to="/dashboard" className={headerBtnPrimary(false)}>
                My games
              </Link>
            ) : (
              <>
                <Link to="/login" className={headerBtnGhost(false)}>
                  Log in
                </Link>
                <Link to="/register" className={headerBtnPrimary(false)}>
                  Sign up
                </Link>
              </>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:pt-20">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Speech practice for the classroom
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Teachers create picture-and-speak games. Students play free — no accounts.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to={session ? '/dashboard' : '/register'}
            className="rounded-xl bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            {session ? 'My games' : 'Get started'}
          </Link>
          <Link
            to="/join"
            className="rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 hover:bg-slate-50"
          >
            Join a class
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {[
            { title: 'Create', desc: 'Build short speaking games with images and words.' },
            { title: 'Play', desc: 'Students speak or type. Instant feedback.' },
            { title: 'Class', desc: 'Share a code, track scores live.' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Teacher guide</h2>
            <Link to="/guide" className="text-sm font-medium text-teal-700 hover:underline">
              Full guide →
            </Link>
          </div>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Sign up and save your recovery code.</li>
            <li>Create a game, add cards, publish.</li>
            <li>Share the play link or start a class with a join code.</li>
            <li>Optional: list the game in Library for other teachers.</li>
          </ol>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        VocaProna
      </footer>
    </div>
  )
}
