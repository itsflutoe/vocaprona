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

const EMPTY_CARD = {
  type: 'speech' as ActivityType,
  prompt: '',
  image_url: '',
  target_text: '',
  accepted_answers: '',
  missing_indices: '',
  hints: '',
}

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
  const [cardForm, setCardForm] = useState({ ...EMPTY_CARD })

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
    setEditingCard(null)
    setCardForm({ ...EMPTY_CARD })
    setShowCardForm(true)
  }

  function openEditCard(card: ActivityCard) {
    setEditingCard(card)
    setCardForm({
      type: card.type,
      prompt: card.prompt || '',
      image_url: card.image_url || '',
      target_text: card.target_text || '',
      accepted_answers: (card.accepted_answers || []).join(', '),
      missing_indices: (card.missing_letter_indices || []).join(', '),
      hints: (card.hints || []).join(', '),
    })
    setShowCardForm(true)
  }

  async function handleSaveCard(e: FormEvent) {
    e.preventDefault()
    if (!id || isNew) {
      setError('Save the game first, then add cards.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const accepted = cardForm.accepted_answers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const missing = cardForm.missing_indices
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      const hints = cardForm.hints
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      if (cardForm.type === 'picture_missing_letters' && !cardForm.target_text.trim()) {
        throw new Error('Target word is required for Picture + Missing Letters.')
      }
      if (
        (cardForm.type === 'speech' || cardForm.type === 'listening' || cardForm.type === 'sentence') &&
        !cardForm.target_text.trim()
      ) {
        throw new Error('Target text is required for this activity type.')
      }

      const payload = {
        type: cardForm.type,
        prompt: cardForm.prompt || undefined,
        image_url: cardForm.image_url || undefined,
        target_text: cardForm.target_text || undefined,
        accepted_answers: accepted.length ? accepted : cardForm.target_text ? [cardForm.target_text.trim()] : [],
        missing_letter_indices: missing.length ? missing : undefined,
        hints,
      }

      if (editingCard) {
        await updateCard(editingCard.id, payload)
      } else {
        await addCard(id, payload)
      }
      setShowCardForm(false)
      setEditingCard(null)
      await load()
      setMessage(editingCard ? 'Card updated.' : 'Card added.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save card')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Delete this activity card?')) return
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
              placeholder="e.g. Animal names — Grade 2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Optional notes for yourself"
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
                  Activity cards ({cards.length})
                </h2>
                <button
                  type="button"
                  onClick={openNewCard}
                  className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
                >
                  + Add card
                </button>
              </div>

              {cards.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No cards yet. Add spelling, speech, listening, or sentence activities.
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
                        {card.target_text || card.prompt || '(no text)'}
                      </p>
                      {card.prompt && card.target_text && (
                        <p className="mt-0.5 text-sm text-slate-500">{card.prompt}</p>
                      )}
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
                className="mt-6 space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-6"
              >
                <h3 className="font-semibold text-slate-900">
                  {editingCard ? 'Edit card' : 'New activity card'}
                </h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={cardForm.type}
                    onChange={(e) =>
                      setCardForm((f) => ({ ...f, type: e.target.value as ActivityType }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
                      <option key={t} value={t}>
                        {ACTIVITY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prompt (optional)</label>
                  <input
                    value={cardForm.prompt}
                    onChange={(e) => setCardForm((f) => ({ ...f, prompt: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="e.g. Say the name of this animal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Target text / word
                  </label>
                  <input
                    value={cardForm.target_text}
                    onChange={(e) => setCardForm((f) => ({ ...f, target_text: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="e.g. elephant"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Image URL (optional)
                  </label>
                  <input
                    value={cardForm.image_url}
                    onChange={(e) => setCardForm((f) => ({ ...f, image_url: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                {cardForm.type === 'picture_missing_letters' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Missing letter positions (0-based, comma-separated)
                    </label>
                    <input
                      value={cardForm.missing_indices}
                      onChange={(e) =>
                        setCardForm((f) => ({ ...f, missing_indices: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="e.g. 0, 3 for _le_hant from elephant"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Leave empty to auto-hide some letters when students play (Phase 3).
                    </p>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Accepted answers (comma-separated, optional)
                  </label>
                  <input
                    value={cardForm.accepted_answers}
                    onChange={(e) =>
                      setCardForm((f) => ({ ...f, accepted_answers: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Defaults to target text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hints (comma-separated, optional)
                  </label>
                  <input
                    value={cardForm.hints}
                    onChange={(e) => setCardForm((f) => ({ ...f, hints: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingCard ? 'Update card' : 'Add card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCardForm(false)
                      setEditingCard(null)
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Publish & share</h2>
              <p className="mt-1 text-sm text-slate-500">
                Students open the link with no account. Full play UI comes in Phase 3.
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
