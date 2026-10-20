/**
 * Lightweight UI sounds via Web Audio API — no audio files, no storage cost.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  when = 0
) {
  const audio = getCtx()
  if (!audio) return
  const t0 = audio.currentTime + when
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Short cheerful blip */
export function playCorrect() {
  tone(523.25, 0.1, 'sine', 0.14) // C5
  tone(659.25, 0.12, 'sine', 0.12, 0.08) // E5
}

/** Soft low buzz */
export function playWrong() {
  tone(180, 0.18, 'square', 0.06)
  tone(140, 0.22, 'square', 0.05, 0.05)
}

/** Short fanfare for mission complete */
export function playComplete() {
  tone(523.25, 0.12, 'sine', 0.12) // C5
  tone(659.25, 0.12, 'sine', 0.12, 0.12) // E5
  tone(783.99, 0.14, 'sine', 0.13, 0.24) // G5
  tone(1046.5, 0.28, 'sine', 0.11, 0.38) // C6
}
