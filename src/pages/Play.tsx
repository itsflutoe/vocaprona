import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGameBySlug } from '@/services/games'
import {
  clearPlaySessionContext,
  loadPlaySessionContext,
  submitAttempt,
} from '@/services/scores'
import {
  checkSpokenAnswer,
  formatMaskedWord,
  getSpeechRecognitionCtor,
  isSpeechSupported,
  requestMicPermission,
  speakText,
  type SpeechRecognitionLike,
} from '@/lib/speech'
import { playComplete, playCorrect, playWrong } from '@/lib/sounds'
import { AdaptiveImage } from '@/components/AdaptiveImage'
import type { ActivityCard, GameWithCards } from '@/types'

export default function Play() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<GameWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [screen, setScreen] = useState<'home' | 'game' | 'complete'>('home')
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [feedbackOk, setFeedbackOk] = useState<boolean | null>(null)
  const [heard, setHeard] = useState('—')
  const [listening, setListening] = useState(false)
  const [micOk, setMicOk] = useState(false)
  const [speechOk] = useState(() => isSpeechSupported())
  const [correctCount, setCorrectCount] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [scoreSaved, setScoreSaved] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showType, setShowType] = useState(false)
  const [typed, setTyped] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const advancingRef = useRef(false)
  const startedAtRef = useRef<number>(0)
  const correctRef = useRef(0)

  const cards = game?.activity_cards || []
  const card: ActivityCard | undefined = cards[index]
  const tracking = game?.tracking_mode || 'none'

  useEffect(() => {
    const ctx = loadPlaySessionContext()
    if (ctx) {
      setSessionId(ctx.sessionId)
      if (ctx.playerLabel) setPlayerName(ctx.playerLabel)
    }
  }, [])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const g = await getGameBySlug(slug)
        if (cancelled) return
        if (!g) {
          setError('This game is not available. It may be unpublished or the link is wrong.')
        } else if (!g.activity_cards?.length) {
          setError('This game has no activity cards yet.')
        } else {
          setGame(g)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load game')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const acceptedFor = useCallback((c: ActivityCard): string[] => {
    const list = [...(c.accepted_answers || [])]
    if (c.target_text) list.push(c.target_text)
    return [...new Set(list.map((s) => s.trim()).filter(Boolean))]
  }, [])

  const cardHint = useCallback((c: ActivityCard | undefined): string | null => {
    if (!c) return null
    if (c.prompt?.trim()) return c.prompt.trim()
    if (c.hints?.length) return c.hints.filter(Boolean).join(' · ')
    return null
  }, [])

  const setupRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return null
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 5
    return rec
  }, [])

  const resetCardUi = useCallback(() => {
    setFeedback('')
    setFeedbackOk(null)
    setHeard('—')
    setShowHint(false)
    setShowType(false)
    setTyped('')
  }, [])

  const saveScore = useCallback(
    async (finalCorrect: number) => {
      if (!game || tracking === 'none' || scoreSaved) return
      const duration = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : null
      const label =
        tracking === 'class'
          ? playerName.trim() || 'Student'
          : playerName.trim() || 'Anonymous'
      await submitAttempt({
        gameId: game.id,
        sessionId,
        playerLabel: label,
        score: finalCorrect * 2,
        totalCards: cards.length,
        correctCount: finalCorrect,
        durationSeconds: duration,
      })
      setScoreSaved(true)
      if (sessionId) clearPlaySessionContext()
    },
    [game, tracking, scoreSaved, playerName, cards.length, sessionId]
  )

  const onCorrect = useCallback(() => {
    if (advancingRef.current) return
    advancingRef.current = true
    correctRef.current += 1
    setCorrectCount(correctRef.current)
    setFeedback('✅ Correct!')
    setFeedbackOk(true)
    setShowType(false)
    playCorrect()
    setTimeout(() => {
      setIndex((i) => {
        const next = i + 1
        if (next >= cards.length) {
          void saveScore(correctRef.current)
          playComplete()
          setScreen('complete')
          return i
        }
        resetCardUi()
        advancingRef.current = false
        return next
      })
      setTimeout(() => {
        advancingRef.current = false
      }, 100)
    }, 900)
  }, [cards.length, saveScore, resetCardUi])

  const handleTranscripts = useCallback(
    (alts: string[]) => {
      if (!card || advancingRef.current) return
      const top = alts[0] || ''
      setHeard(top || '—')
      const { matched, bestHeard } = checkSpokenAnswer(alts, acceptedFor(card))
      if (bestHeard) setHeard(bestHeard)
      if (matched) {
        onCorrect()
      } else {
        setFeedback('❌ Try again — speak clearly')
        setFeedbackOk(false)
        playWrong()
        setTimeout(() => {
          setHeard('—')
          setFeedback('')
          setFeedbackOk(null)
        }, 1400)
      }
    },
    [card, acceptedFor, onCorrect]
  )

  function handleTypeCheck() {
    if (!card || advancingRef.current) return
    const val = typed.trim()
    if (!val) {
      setFeedback('Type an answer first')
      setFeedbackOk(false)
      return
    }
    setHeard(val)
    const { matched } = checkSpokenAnswer([val], acceptedFor(card))
    if (matched) {
      onCorrect()
    } else {
      setFeedback('❌ Not quite — try again')
      setFeedbackOk(false)
      playWrong()
    }
  }

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  const startListening = useCallback(async () => {
    if (!speechOk) {
      setFeedback('Speech needs Chrome or Edge. You can type instead.')
      setFeedbackOk(false)
      setShowType(true)
      return
    }
    if (listening) {
      stopListening()
      return
    }
    if (advancingRef.current) return

    const ok = micOk || (await requestMicPermission())
    if (!ok) {
      setFeedback('❌ Mic blocked — type your answer below')
      setFeedbackOk(false)
      setShowType(true)
      return
    }
    setMicOk(true)
    setHeard('—')
    setFeedback('')
    setFeedbackOk(null)

    let rec = recognitionRef.current
    if (!rec) {
      rec = setupRecognition()
      recognitionRef.current = rec
    }
    if (!rec) return

    rec.onstart = () => {
      setListening(true)
      setFeedback('Listening…')
      setFeedbackOk(null)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (event) => {
      setListening(false)
      const err = event.error || ''
      if (err === 'not-allowed') {
        setFeedback('❌ Mic blocked — type your answer')
        setFeedbackOk(false)
        setShowType(true)
      } else if (err === 'no-speech') {
        setFeedback("❌ Didn't catch that. Try mic again or type.")
        setFeedbackOk(false)
      } else if (err !== 'aborted') {
        setFeedback('❌ Try again or type your answer')
        setFeedbackOk(false)
      }
    }
    rec.onresult = (event) => {
      const alts: string[] = []
      const result = event.results[0]
      if (result) {
        for (let i = 0; i < result.length; i++) {
          const t = result[i]?.transcript?.trim()
          if (t) alts.push(t)
        }
      }
      handleTranscripts(alts)
    }

    try {
      rec.start()
    } catch {
      const fresh = setupRecognition()
      recognitionRef.current = fresh
      if (fresh) {
        fresh.onstart = rec.onstart
        fresh.onend = rec.onend
        fresh.onerror = rec.onerror
        fresh.onresult = rec.onresult
        try {
          fresh.start()
        } catch {
          setFeedback('❌ Mic failed — type your answer')
          setFeedbackOk(false)
          setShowType(true)
        }
      }
    }
  }, [speechOk, listening, micOk, stopListening, setupRecognition, handleTranscripts])

  useEffect(() => {
    if (screen !== 'game') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !showType) {
        e.preventDefault()
        void startListening()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [screen, startListening, showType])

  async function handleStart() {
    if (tracking === 'class' && !playerName.trim()) {
      setError('Enter your name so your teacher can see your score.')
      return
    }
    setError('')
    const ok = await requestMicPermission()
    setMicOk(ok)
    setIndex(0)
    resetCardUi()
    correctRef.current = 0
    setCorrectCount(0)
    setScoreSaved(false)
    startedAtRef.current = Date.now()
    advancingRef.current = false
    setScreen('game')
  }

  function handleRestart() {
    setIndex(0)
    resetCardUi()
    correctRef.current = 0
    setCorrectCount(0)
    setScoreSaved(false)
    advancingRef.current = false
    setScreen('home')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-600 to-teal-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if ((error && !game) || !game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
        <p className="max-w-md text-center text-slate-700">{error || 'Game not found'}</p>
        <Link to="/" className="mt-6 text-teal-700 hover:underline">
          Go to VocaProna home
        </Link>
      </div>
    )
  }

  const progressPct = cards.length ? (index / cards.length) * 100 : 0
  const instruction =
    card?.type === 'listening'
      ? 'Listen, then say or type what you heard'
      : card?.type === 'sentence'
        ? 'Read the sentence out loud'
        : 'Say the word!'

  const hintText = cardHint(card)
  const masked =
    card && (card.type === 'picture_missing_letters' || card.type === 'speech')
      ? formatMaskedWord(card.target_text || '', card.missing_letter_indices)
      : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 to-teal-900 text-white">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pt-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-500"
            style={{ width: `${screen === 'complete' ? 100 : progressPct}%` }}
          />
        </div>
        <span className="text-sm font-medium text-teal-100">
          {screen === 'complete' ? cards.length : index} / {cards.length}
        </span>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 pb-10">
        {screen === 'home' && (
          <div className="rounded-3xl bg-white p-6 text-center text-slate-900 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600">VocaProna</p>
            <h1 className="mt-2 text-2xl font-bold">{game.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {game.subject}
              {game.description ? ` · ${game.description}` : ''}
            </p>
            <p className="mt-4 text-slate-600">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} · Speak or type!
            </p>
            {sessionId && (
              <p className="mt-2 text-xs font-medium text-teal-700">
                Joined via class code — score goes to your teacher
              </p>
            )}
            {!speechOk && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Mic needs <strong>Chrome</strong> or <strong>Edge</strong>. You can still type answers.
              </p>
            )}
            {(tracking === 'class' || tracking === 'anonymous' || sessionId) && (
              <div className="mt-6 text-left">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {tracking === 'class' || sessionId
                    ? 'Your name (required for score)'
                    : 'Your name (optional)'}
                </label>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Mia"
                  maxLength={40}
                />
              </div>
            )}
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleStart()}
              className="mt-8 w-full rounded-2xl bg-teal-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-teal-700"
            >
              START
            </button>
          </div>
        )}

        {screen === 'game' && card && (
          <div className="rounded-3xl bg-white p-5 text-center text-slate-900 shadow-xl sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800">{instruction}</h2>

            <div className="mt-5">
              <AdaptiveImage
                src={card.image_url}
                alt={card.image_alt || card.target_text || 'Card'}
                fallback={
                  card.type === 'listening' ? '🔊' : card.type === 'sentence' ? '📖' : '🎤'
                }
              />
            </div>

            {masked && (
              <p className="mt-4 font-mono text-2xl font-bold tracking-widest text-teal-800">
                {feedbackOk ? card.target_text : masked}
              </p>
            )}
            {card.type === 'sentence' && card.target_text && (
              <p className="mt-4 text-xl font-semibold text-slate-800">{card.target_text}</p>
            )}

            {card.type === 'listening' && (
              <button
                type="button"
                onClick={() => speakText(card.target_text || '')}
                className="mt-4 rounded-xl border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                🔊 Play sound
              </button>
            )}

            {hintText && (
              <div className="mt-4">
                {!showHint ? (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
                  >
                    💡 Hint
                  </button>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{hintText}</p>
                )}
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={() => void startListening()}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-lg transition ${
                  listening
                    ? 'animate-pulse bg-red-500 text-white ring-4 ring-red-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
                aria-label={listening ? 'Stop listening' : 'Speak answer'}
              >
                {listening ? '⏹' : '🎤'}
              </button>
              <p className="mt-3 text-sm text-slate-500">
                Tap mic
                {!showType && (
                  <>
                    {' '}or <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">Space</kbd>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowType((v) => !v)
                  setFeedback('')
                }}
                className="mt-2 text-sm font-medium text-teal-700 hover:underline"
              >
                {showType ? 'Hide keyboard' : 'Type instead'}
              </button>
            </div>

            {showType && (
              <div className="mt-4 flex gap-2">
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTypeCheck()
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Type the word"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleTypeCheck}
                  className="rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
                >
                  Check
                </button>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                I heard / you typed
              </span>
              <p className="mt-0.5 text-lg font-medium text-slate-800">{heard}</p>
            </div>

            <div
              className={`mt-4 min-h-[1.75rem] text-lg font-bold ${
                feedbackOk === true
                  ? 'text-teal-600'
                  : feedbackOk === false
                    ? 'text-red-600'
                    : 'text-slate-500'
              }`}
            >
              {feedback}
            </div>
          </div>
        )}

        {screen === 'complete' && (
          <div className="rounded-3xl bg-white p-6 text-center text-slate-900 shadow-xl sm:p-8">
            <p className="text-4xl">⭐⭐⭐</p>
            <h1 className="mt-3 text-2xl font-bold">Mission complete!</h1>
            <p className="mt-2 text-slate-600">
              You got <strong>{correctCount}</strong> of <strong>{cards.length}</strong> correct
              {tracking !== 'none' && scoreSaved ? ' · score saved' : ''}
            </p>
            <ul className="mt-6 space-y-2 text-left">
              {cards.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-bold text-teal-600">{i + 1}</span>
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                      🎤
                    </span>
                  )}
                  <span className="font-medium">{c.target_text || c.prompt || 'Card'}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/"
              className="mt-8 block w-full rounded-2xl bg-teal-600 py-4 text-center text-lg font-bold text-white hover:bg-teal-700"
            >
              Back to home
            </Link>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-3 w-full rounded-2xl border-2 border-teal-600 py-3 text-base font-semibold text-teal-700 hover:bg-teal-50"
            >
              Play again
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-teal-200">No account needed · VocaProna</p>
      </div>
    </div>
  )
}
