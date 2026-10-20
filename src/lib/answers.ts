/**
 * Expand a target word into accepted spoken answers — no AI.
 * Plurals + teacher aliases only.
 */

function cleanToken(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?'"~]/g, '')
}

/** Simple English plural forms (good enough for classroom words). */
export function pluralForms(word: string): string[] {
  const w = cleanToken(word)
  if (!w || w.includes(' ')) return []

  const out = new Set<string>()

  // regular +s
  out.add(w + 's')

  // -es after s, x, z, ch, sh
  if (/(?:s|x|z|ch|sh)$/i.test(w)) {
    out.add(w + 'es')
  }

  // consonant + y → ies (baby → babies)
  if (/[^aeiou]y$/i.test(w)) {
    out.add(w.slice(0, -1) + 'ies')
  }

  // -f / -fe → ves (leaf → leaves) — skip short oddities
  if (w.endsWith('fe') && w.length > 3) {
    out.add(w.slice(0, -2) + 'ves')
  } else if (w.endsWith('f') && w.length > 2 && !w.endsWith('ff')) {
    out.add(w.slice(0, -1) + 'ves')
  }

  // common irregulars used in schools
  const irregular: Record<string, string[]> = {
    cactus: ['cacti', 'cactuses'],
    child: ['children'],
    man: ['men'],
    woman: ['women'],
    mouse: ['mice'],
    goose: ['geese'],
    tooth: ['teeth'],
    foot: ['feet'],
    person: ['people'],
    leaf: ['leaves'],
    knife: ['knives'],
    life: ['lives'],
    wolf: ['wolves'],
    fish: ['fish', 'fishes'],
    sheep: ['sheep'],
    deer: ['deer'],
    ox: ['oxen'],
  }
  const irr = irregular[w]
  if (irr) irr.forEach((x) => out.add(x))

  // don't include the base word itself here
  out.delete(w)
  return [...out]
}

/**
 * Build accepted_answers list for a card.
 * target + auto plurals + teacher aliases (comma/newline separated).
 */
export function buildAcceptedAnswers(
  targetText: string,
  teacherAliases?: string
): string[] {
  const target = cleanToken(targetText)
  const set = new Set<string>()

  if (target) {
    set.add(target)
    // multi-word: keep full phrase + last word as weak fallback? No — keep full phrase only
    for (const p of pluralForms(target)) {
      set.add(p)
    }
    // If multi-word target, also pluralize last word and rebuild
    const parts = target.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      const last = parts[parts.length - 1]
      for (const p of pluralForms(last)) {
        set.add([...parts.slice(0, -1), p].join(' '))
      }
    }
  }

  if (teacherAliases) {
    for (const part of teacherAliases.split(/[,\n;]+/)) {
      const a = cleanToken(part)
      if (a) set.add(a)
    }
  }

  return [...set]
}
