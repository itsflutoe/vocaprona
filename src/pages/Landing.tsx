import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Landing() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-xl font-bold text-teal-700">VocaProna</span>
        <div className="flex gap-3">
          {session ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Dashboard
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

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Speech games for every classroom
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Teachers create interactive spelling, speaking, listening, and reading games.
          Students play free — no accounts required.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={session ? '/dashboard' : '/register'}
            className="rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            {session ? 'Go to dashboard' : 'Start as a teacher'}
          </Link>
        </div>

        <div className="mt-20 grid gap-6 text-left sm:grid-cols-2">
          {[
            {
              title: 'Picture & missing letters',
              desc: 'Complete words with images and smart letter blanks.',
            },
            {
              title: 'Speech recognition',
              desc: 'Students speak the answer; text fallback when mic is unavailable.',
            },
            {
              title: 'Listening & pronunciation',
              desc: 'Hear prompts with browser TTS, then repeat.',
            },
            {
              title: 'Sentence reading aloud',
              desc: 'Read or listen-and-repeat full sentences.',
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
        VocaProna — free educational speech games · Phase 1 foundation
      </footer>
    </div>
  )
}
