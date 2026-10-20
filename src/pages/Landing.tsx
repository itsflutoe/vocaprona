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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Speech games for every classroom
        </h1>
        <p className="mt-6 text-base text-slate-600 sm:text-lg">
          Teachers create interactive spelling, speaking, listening, and reading games.
          Students play free — no accounts required.
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

        <div className="mt-16 grid gap-4 text-left sm:mt-20 sm:grid-cols-2">
          {[
            {
              title: 'See · speak · check',
              desc: 'Students see a picture, speak the word, and get instant feedback.',
            },
            {
              title: 'Class join codes',
              desc: 'Start a live session and share a short code with the whole class.',
            },
            {
              title: 'Scores for teachers',
              desc: 'Optional tracking so you can see who finished and how they did.',
            },
            {
              title: 'No student accounts',
              desc: 'Kids play from a link or join code — nothing to remember.',
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
        VocaProna — free educational speech games
      </footer>
    </div>
  )
}
