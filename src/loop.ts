import type { Script } from './types'
import { parseBody } from './words'
import { scriptPlainText } from './doc'

/**
 * Record one Read: +1 Read count, +1 timestamp, and hide one more random eligible
 * word (your lines only — cues and labels are never hidden). High score = the most
 * words ever hidden, so it only ever climbs. Pure + deterministic given an rng.
 */
export function applyRead(script: Script, now: number, rng: () => number = Math.random): Script {
  const { eligibleIndices } = parseBody(scriptPlainText(script.body))
  const hidden = new Set(script.blackouts)

  const remaining = eligibleIndices.filter((i) => !hidden.has(i))

  let blackouts = script.blackouts
  if (remaining.length > 0) {
    const pick = remaining[Math.floor(rng() * remaining.length)]
    blackouts = [...script.blackouts, pick]
  }

  return {
    ...script,
    readCount: script.readCount + 1,
    reads: [...script.reads, now],
    blackouts,
    highScore: Math.max(script.highScore, blackouts.length),
    updatedAt: now,
  }
}

/** Clear this Round's Blackouts for a fresh Round. Read count + High score are kept. */
export function resetRound(script: Script, now: number): Script {
  return { ...script, blackouts: [], updatedAt: now }
}
