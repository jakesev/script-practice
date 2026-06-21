import type { Script } from './types'

// Local-first persistence. This module is the single seam where, in a later slice,
// localStorage is swapped for the synced backend — nothing else touches storage.

const KEY = 'script-practice:v1'

export function loadScripts(): Script[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Script[]) : []
  } catch {
    return []
  }
}

export function saveScripts(scripts: Script[]): void {
  localStorage.setItem(KEY, JSON.stringify(scripts))
}

export function newScript(now: number): Script {
  return {
    id: crypto.randomUUID(),
    body: '',
    readCount: 0,
    highScore: 0,
    blackouts: [],
    reads: [],
    createdAt: now,
    updatedAt: now,
  }
}
