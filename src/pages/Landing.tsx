import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Landing() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-xl font-bold text-teal-700">VocaProna</span>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            to="/join"
            className="rounded-lg border border-teal-600 bg-white px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
          >
            Join class
          </Link>
          {session ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Library
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Free · No student accounts</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Speech games for every classroom
        </h1>
        <p className="mt-6 text-base text-slate-600 sm:text-lg">
          Teachers build picture-and-speak activities. Students say the word (or type it).
          Run a live class with a short join code and see scores as they finish.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to={session ? '/dashboard' : '/register'}
            className="rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            {session ? 'Open my library' : 'Start as a teacher'}
          </Link>
          <Link
            to="/join"
            className="rounded-xl border-2 border-teal-600 px-6 py-3.5 text-base font-semibold text-teal-700 hover:bg-teal-50"
          >
            I have a class code
          </Link>
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick start for teachers</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Sign up with a username (save your recovery code).</li>
            <li>Create a game, add cards with a word + optional picture and hint.</li>
            <li>Publish — share the play link, or tap <strong>Start class</strong> for a join code.</li>
            <li>Watch live scores on the class host screen, or open <strong>Scores</strong> later.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-400">
            Mic works best in Chrome or Edge. Students can always use “Type instead.”
          </p>
        </div>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          {[
            {
              title: 'See · speak · check',
              desc: 'Picture on screen, student speaks, instant feedback.',
            },
            {
              title: 'Class join codes',
              desc: 'One code on the board; whole class plays the same game.',
            },
            {
              title: 'Live class scores',
              desc: 'Host screen shows who finished and their results.',
            },
            {
              title: 'No student logins',
              desc: 'Kids only need a link or a short code.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-slate-800">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        VocaProna — free educational speech games · MVP ready for classroom trials
      </footer>
    </div>
  )
}
