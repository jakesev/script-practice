import type { Script } from './types'

interface BackupFile {
  app: 'script-practice'
  version: number
  exportedAt: number
  scripts: Script[]
}

/** Pretty JSON for the downloadable backup file. */
export function exportJSON(scripts: Script[], now: number): string {
  const payload: BackupFile = { app: 'script-practice', version: 1, exportedAt: now, scripts }
  return JSON.stringify(payload, null, 2)
}

/** UTF-8-safe base64 of the backup, for the copy-a-code transfer. */
export function encodeBackup(scripts: Script[], now: number): string {
  const bytes = new TextEncoder().encode(exportJSON(scripts, now))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function tryParse(input: string): unknown {
  const t = input.trim()
  try {
    return JSON.parse(t)
  } catch {
    /* not raw JSON — maybe a base64 code */
  }
  try {
    const bin = atob(t.replace(/\s+/g, ''))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** Parse an exported backup (file JSON or copied code) into a scripts array; [] if unreadable. */
export function parseBackup(input: string): Script[] {
  const obj = tryParse(input) as { scripts?: unknown } | Script[] | null
  if (!obj) return []
  const arr = Array.isArray(obj) ? obj : Array.isArray(obj.scripts) ? obj.scripts : null
  if (!arr) return []
  return (arr as Script[]).filter((s) => s && typeof s.id === 'string' && typeof s.body === 'string')
}

/** Merge two script sets by id, keeping the later updatedAt (ties favour `local`). */
export function mergeScripts(local: Script[], incoming: Script[]): Script[] {
  const byId = new Map<string, Script>()
  for (const s of [...local, ...incoming]) {
    const ex = byId.get(s.id)
    if (!ex || (s.updatedAt ?? 0) > (ex.updatedAt ?? 0)) byId.set(s.id, s)
  }
  return [...byId.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}
