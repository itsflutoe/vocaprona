import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  addCard,
  createGame,
  deleteCard,
  getGame,
  playUrl,
  publishGame,
  unpublishGame,
  updateCard,
  updateGame,
} from '@/services/games'
import {
  ACTIVITY_TYPE_LABELS,
  SUBJECTS,
  type ActivityCard,
  type ActivityType,
  type GameWithCards,
} from '@/types'

const CARD_TYPES: { type: ActivityType; label: string; hint: string }[] = [
  { type: 'picture_missing_letters', label: 'Spelling', hint: 'Picture + fill missing letters' },
  { type: 'speech', label: 'Speaking', hint: 'Say the word out loud' },
  { type: 'listening', label: 'Listening', hint: 'Hear the word, then type it' },
  { type: 'sentence', label: 'Sentence', hint: 'Read a full sentence' },
]

export default function GameEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [game, setGame] = useState<GameWithCards | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState<string>('English')
  const [customSubject, setCustomSubject] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCardForm, setShowCardForm] = useState(false)
  const [editingCard, setEditingCard] = useState<ActivityCard | null>(null)

  // Simple card fields only
  const [cardType, setCardType] = useState<ActivityType>('speech')
  const [cardWord, setCardWord] = useState('')
  const [cardPrompt, setCardPrompt] = useState('')
  const [cardImage, setCardImage] = useState('')

  const load = useCallback(async () => {
    if (isNew || !id) return
    setLoading(true)
    setError('')
    try {
      const g = await getGame(id)
      if (!g) {
        setError('Game not found.')
        return
      }
      setGame(g)
      setTitle(g.title)
      setDescription(g.description || '')
      setSubject(g.subject)
      setCustomSubject(g.custom_subject || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game')
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  function resetCardForm() {
    setCardType('speech')
    setCardWord('')
    setCardPrompt('')
    setCardImage('')
    setEditingCard(null)
  }

  async function handleSaveMeta(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!profile) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (isNew) {
        const created = await createGame(profile.id, {
          title,
          description,
          subject,
          custom_subject: customSubject,
        })
        navigate(`/dashboard/games/${created.id}`, { replace: true })
        return
      }
      if (!id) return
      const updated = await updateGame(id, {
        title: title.trim(),
        description: description.trim() || null,
        subject,
        custom_subject: subject === 'Other' ? customSubject.trim() || null : null,
      })
      setGame((prev) => (prev ? { ...prev, ...updated } : prev))
      setMessage('Saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function openNewCard() {
    resetCardForm()
    setShowCardForm(true)
  }

  function openEditCard(card: ActivityCard) {
    setEditingCard(card)
    setCardType(card.type)
    setCardWord(card.target_text || '')
    setCardPrompt(card.prompt || '')
    setCardImage(card.image_url || '')
    setShowCardForm(true)
  }

  async function handleSaveCard(e: FormEvent) {
    e.preventDefault()
    if (!id || isNew) {
      setError('Save the game first, then add cards.')
      return
    }
    const word = cardWord.trim()
    if (!word) {
      setError('Enter the word or sentence students should practice.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        type: cardType,
        target_text: word,
        prompt: cardPrompt.trim() || undefined,
        image_url: cardImage.trim() || undefined,
        accepted_answers: [word],
      }

      if (editingCard) {
        await updateCard(editingCard.id, payload)
      } else {
        await addCard(id, payload)
      }
      setShowCardForm(false)
      resetCardForm()
      await load()
      setMessage(editingCard ? 'Card updated.' : 'Card added.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save card')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Delete this card?')) return
    setSaving(true)
    setError('')
    try {
      await deleteCard(cardId)
      await load()
      setMessage('Card deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!id || isNew) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await publishGame(id)
      setGame((prev) => (prev ? { ...prev, ...updated } : prev))
      setMessage('Published! Share link is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnpublish() {
    if (!id || isNew) return
    setSaving(true)
    setError('')
    try {
      const updated = await unpublishGame(id)
      setGame((prev) => (prev ? { ...prev, ...updated } : prev))
      setMessage('Unpublished (back to draft).')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  const cards = game?.activity_cards || []
  const shareLink = game?.share_slug && game.share_enabled ? playUrl(game.share_slug) : null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
            ← Dashboard
          </Link>
          <span className="text-sm text-slate-500">
            {isNew ? 'New game' : game?.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'Create game' : 'Edit game'}
        </h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div>
        )}

        <form onSubmit={handleSaveMeta} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Animal names"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Short note for yourself"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {subject === 'Other' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Custom subject</label>
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNew ? 'Create game' : 'Save details'}
          </button>
        </form>

        {!isNew && (
          <>
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Cards ({cards.length})
                </h2>
                <button
                  type="button"
                  onClick={openNewCard}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                  + Add card
                </button>
              </div>

              {cards.length === 0 && !showCardForm && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No cards yet. Tap <strong>+ Add card</strong>, pick a type, type a word — done.
                </p>
              )}

              <ul className="space-y-3">
                {cards.map((card, i) => (
                  <li
                    key={card.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                        {i + 1}. {ACTIVITY_TYPE_LABELS[card.type]}
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {card.target_text || card.prompt || '(empty)'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditCard(card)}
                        className="text-sm text-slate-600 hover:text-teal-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCard(card.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {showCardForm && (
              <form
                onSubmit={handleSaveCard}
                className="mt-6 space-y-5 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingCard ? 'Edit card' : 'Add a card'}
                </h3>

                {/* Step 1: type as big buttons */}
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">1. What kind of practice?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CARD_TYPES.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setCardType(t.type)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          cardType === t.type
                            ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="block font-semibold text-slate-900">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{t.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: the word */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    2. Word or sentence to practice
                  </label>
                  <input
                    value={cardWord}
                    onChange={(e) => setCardWord(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder={cardType === 'sentence' ? 'e.g. The cat sat on the mat' : 'e.g. elephant'}
                    required
                    autoFocus
                  />
                </div>

                {/* Optional extras collapsed by simplicity */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hint for student (optional)
                  </label>
                  <input
                    value={cardPrompt}
                    onChange={(e) => setCardPrompt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. A large animal with a trunk"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Image link (optional)
                  </label>
                  <input
                    value={cardImage}
                    onChange={(e) => setCardImage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="https://… paste a picture URL"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingCard ? 'Save changes' : 'Add this card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCardForm(false)
                      resetCardForm()
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Publish & share</h2>
              <p className="mt-1 text-sm text-slate-500">
                Students open the link — no account needed.
              </p>
              {shareLink && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="break-all rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                    {shareLink}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(shareLink)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Copy
                  </button>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {game?.status === 'published' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleUnpublish()}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving || cards.length === 0}
                    onClick={() => void handlePublish()}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    Publish game
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
