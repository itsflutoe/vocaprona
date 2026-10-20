/**
 * Browser Web Speech API helpers + answer matching.
 * Strict enough that partial words (actus ≠ cactus, pant ≠ plant) fail,
 * but still allows 1 letter substitution on same-length words and simple plurals.
 */

import { buildAcceptedAnswers } from '@/lib/answers'

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event & { error?: string }) => void) | null
  onresult: ((ev: SpeechRecognitionResultEventLike) => void) | null
}

type SpeechRecognitionResultEventLike = {
  results: {
    length: number
    [index: number]: {
      length: number
      isFinal?: boolean
      [index: number]: { transcript: string; confidence: number }
    }
  }
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function isSpeechSupported(): boolean {
  return !!getSpeechRecognitionCtor()
}

export async function requestMicPermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}

/** Strip filler words / punctuation for matching */
export function cleanSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?'"~\-]/g, '')
    .replace(
      /\b(the|a|an|is|it's|its|um|uh|like|so|just|my|this|that|and|or|to|for|of|in|on)\b/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function lettersOnly(s: string): string {
  return s.replace(/[^a-z]/g, '')
}

function substitutionCount(a: string, b: string): number {
  if (a.length !== b.length) return 999
  let d = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++
  }
  return d
}

function isCloseMatch(spoken: string, target: string): boolean {
  const s = lettersOnly(spoken)
  const t = lettersOnly(target)
  if (!s || !t) return false

  if (s === t) return true
  if (s === t + 's' || s === t + 'es') return true
  if (t === s + 's' || t === s + 'es') return true

  const words = spoken.split(/\s+/).map(lettersOnly).filter(Boolean)
  if (words.some((w) => w === t || w === t + 's' || w === t + 'es')) return true

  if (s.length === t.length && t.length >= 4 && substitutionCount(s, t) <= 1) {
    return true
  }

  return false
}

/**
 * Check spoken alternatives against accepted answers.
 * Also expands each answer with auto plurals so old cards still get cacti, etc.
 */
export function checkSpokenAnswer(
  alternatives: string[],
  acceptedAnswers: string[]
): { matched: boolean; bestHeard: string } {
  const expanded = new Set<string>()
  for (const a of acceptedAnswers) {
    for (const x of buildAcceptedAnswers(a)) {
      expanded.add(x)
    }
    const cleaned = cleanSpeech(a)
    if (cleaned) expanded.add(cleaned)
  }
  const targets = [...expanded]

  let bestHeard = alternatives[0] || ''

  for (const raw of alternatives) {
    const cleaned = cleanSpeech(raw)
    if (!cleaned) continue
    for (const answer of targets) {
      if (isCloseMatch(cleaned, answer)) {
        return { matched: true, bestHeard: raw }
      }
    }
    if (raw) bestHeard = raw
  }

  return { matched: false, bestHeard }
}

export function speakText(text: string, lang = 'en-US'): void {
  if (!window.speechSynthesis || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export function formatMaskedWord(
  word: string,
  missingIndices: number[] | null | undefined
): string {
  if (!word) return ''
  if (!missingIndices || missingIndices.length === 0) {
    const letters = word.split('')
    const letterPositions: number[] = []
    letters.forEach((ch, i) => {
      if (/[a-zA-Z]/.test(ch)) letterPositions.push(i)
    })
    const hideCount = Math.max(1, Math.floor(letterPositions.length * 0.4))
    const hide = new Set(
      letterPositions
        .filter(
          (_, idx) =>
            idx % Math.max(1, Math.floor(letterPositions.length / hideCount)) === 0
        )
        .slice(0, hideCount)
    )
    return letters.map((ch, i) => (hide.has(i) ? '_' : ch)).join('')
  }
  let letterIdx = 0
  return word
    .split('')
    .map((ch) => {
      if (!/[a-zA-Z]/.test(ch)) return ch
      const hide = missingIndices.includes(letterIdx)
      letterIdx++
      return hide ? '_' : ch
    })
    .join('')
}
