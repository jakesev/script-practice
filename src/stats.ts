import type { Script } from './types'
import { scriptTitle } from './doc'

export interface ScriptStat {
  id: string
  title: string
  readCount: number
  highScore: number
}

export interface DayBucket {
  date: string // local YYYY-MM-DD
  label: string // e.g. "21/6"
  count: number
}

export function totalReads(scripts: Script[]): number {
  return scripts.reduce((sum, s) => sum + (s.readCount || 0), 0)
}

/** Per-Script read counts + high scores, most-practised first. */
export function perScript(scripts: Script[]): ScriptStat[] {
  return scripts
    .map((s) => ({
      id: s.id,
      title: scriptTitle(s.body) || 'Untitled',
      readCount: s.readCount || 0,
      highScore: s.highScore || 0,
    }))
    .sort((a, b) => b.readCount - a.readCount)
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Reads per day for the last `days` days ending at `now` (oldest first). */
export function dailyReads(scripts: Script[], days: number, now: number): DayBucket[] {
  const counts = new Map<string, number>()
  for (const s of scripts) for (const ts of s.reads || []) counts.set(dayKey(ts), (counts.get(dayKey(ts)) || 0) + 1)

  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  const out: DayBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const key = dayKey(d.getTime())
    out.push({ date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, count: counts.get(key) || 0 })
  }
  return out
}

/** Number of distinct days the user has practised on. */
export function activeDays(scripts: Script[]): number {
  const days = new Set<string>()
  for (const s of scripts) for (const ts of s.reads || []) days.add(dayKey(ts))
  return days.size
}

/** Consecutive days with ≥1 read, counting back from today — or yesterday, so an as-yet-unpractised today doesn't read as a broken streak. */
export function currentStreak(scripts: Script[], now: number): number {
  const days = new Set<string>()
  for (const s of scripts) for (const ts of s.reads || []) days.add(dayKey(ts))
  if (days.size === 0) return 0

  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(dayKey(cursor.getTime()))) return 0
  }

  let streak = 0
  while (days.has(dayKey(cursor.getTime()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
