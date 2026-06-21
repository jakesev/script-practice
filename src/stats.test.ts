import { describe, it, expect } from 'vitest'
import { totalReads, perScript, dailyReads, currentStreak, activeDays } from './stats'
import { newScript } from './storage'
import type { Script } from './types'

function scriptWith(over: Partial<Script>): Script {
  return { ...newScript(0), ...over }
}
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('stats', () => {
  it('totalReads sums readCount', () => {
    expect(totalReads([scriptWith({ readCount: 3 }), scriptWith({ readCount: 5 })])).toBe(8)
  })

  it('perScript sorts by reads desc, with titles from the doc', () => {
    const a = scriptWith({ body: 'Alpha\nx', readCount: 2, highScore: 1 })
    const b = scriptWith({ body: 'Bravo\ny', readCount: 7, highScore: 3 })
    const r = perScript([a, b])
    expect(r.map((s) => s.title)).toEqual(['Bravo', 'Alpha'])
    expect(r[0]).toMatchObject({ readCount: 7, highScore: 3 })
  })

  it('dailyReads buckets by local day across the window', () => {
    const now = at(2026, 6, 21)
    const s = scriptWith({ reads: [at(2026, 6, 21, 9), at(2026, 6, 21, 10), at(2026, 6, 20, 8)] })
    const buckets = dailyReads([s], 7, now)
    expect(buckets).toHaveLength(7)
    expect(buckets[6].count).toBe(2) // today
    expect(buckets[5].count).toBe(1) // yesterday
    expect(buckets[0].count).toBe(0)
  })

  it('currentStreak counts consecutive days including today', () => {
    const now = at(2026, 6, 21)
    const s = scriptWith({ reads: [at(2026, 6, 21), at(2026, 6, 20), at(2026, 6, 19)] })
    expect(currentStreak([s], now)).toBe(3)
  })

  it('streak survives an as-yet-unpractised today if yesterday was active', () => {
    const now = at(2026, 6, 21)
    const s = scriptWith({ reads: [at(2026, 6, 20), at(2026, 6, 19)] })
    expect(currentStreak([s], now)).toBe(2)
  })

  it('streak breaks on a gap', () => {
    const now = at(2026, 6, 21)
    const s = scriptWith({ reads: [at(2026, 6, 21), at(2026, 6, 18)] })
    expect(currentStreak([s], now)).toBe(1)
  })

  it('streak is 0 when nothing practised in the last two days', () => {
    const now = at(2026, 6, 21)
    const s = scriptWith({ reads: [at(2026, 6, 10)] })
    expect(currentStreak([s], now)).toBe(0)
  })

  it('activeDays counts distinct days', () => {
    const s = scriptWith({ reads: [at(2026, 6, 21, 9), at(2026, 6, 21, 10), at(2026, 6, 20)] })
    expect(activeDays([s])).toBe(2)
  })
})
