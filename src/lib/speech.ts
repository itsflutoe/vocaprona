/**
 * Browser Web Speech API helpers + kid-friendly answer matching
 * (mechanics aligned with itsflutoe/Scigame — read-only reference).
 */

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

function looksSimilar(spoken: string, target: string): boolean {
  if (!spoken || spoken.length < 1) return false
  if (spoken === target) return true
  if (spoken.includes(target) || target.includes(spoken)) return true

  if (target.length <= 5) {
    let matches = 0
    for (const char of target) {
      if (spoken.includes(char)) matches++
    }
    return matches >= Math.ceil(target.length * 0.7)
  }

  const start = target.slice(0, 4)
  if (spoken.includes(start) || spoken.startsWith(start.slice(0, 3))) return true

  let matches = 0
  for (const char of target) {
    if (spoken.includes(char)) matches++
  }
  return matches >= Math.ceil(target.length * 0.6)
}

/**
 * Check spoken alternatives against accepted answers (lenient, Scigame-style).
 */
export function checkSpokenAnswer(
  alternatives: string[],
  acceptedAnswers: string[]
): { matched: boolean; bestHeard: string } {
  const targets = acceptedAnswers
    .map((a) => cleanSpeech(a))
    .filter(Boolean)

  let matched = false
  let bestHeard = alternatives[0] || ''

  for (const raw of alternatives) {
    const cleaned = cleanSpeech(raw)
    if (!cleaned) continue
    for (const answer of targets) {
      if (looksSimilar(cleaned, answer)) {
        matched = true
        bestHeard = raw
        return { matched, bestHeard }
      }
    }
  }

  return { matched, bestHeard }
}

export function speakText(text: string, lang = 'en-US'): void {
  if (!window.speechSynthesis || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

/** Display word with optional missing letter indices (0-based on letters only) */
export function formatMaskedWord(
  word: string,
  missingIndices: number[] | null | undefined
): string {
  if (!word) return ''
  if (!missingIndices || missingIndices.length === 0) {
    // Default: hide ~40% of letters for spelling-style hint
    const letters = word.split('')
    const letterPositions: number[] = []
    letters.forEach((ch, i) => {
      if (/[a-zA-Z]/.test(ch)) letterPositions.push(i)
    })
    const hideCount = Math.max(1, Math.floor(letterPositions.length * 0.4))
    const hide = new Set(
      letterPositions.filter((_, idx) => idx % Math.max(1, Math.floor(letterPositions.length / hideCount)) === 0).slice(0, hideCount)
    )
    return letters.map((ch, i) => (hide.has(i) ? '_' : ch)).join('')
  }
  // missingIndices refer to letter index among a-z only
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
