import { describe, it, expect } from 'vitest'
import { exportJSON, encodeBackup, parseBackup, mergeScripts } from './backup'
import { newScript } from './storage'
import type { Script } from './types'

function s(id: string, updatedAt: number, over: Partial<Script> = {}): Script {
  return { ...newScript(0), id, updatedAt, body: `${id}\nbody`, ...over }
}

describe('export / import', () => {
  it('round-trips through the file JSON', () => {
    const scripts = [s('a', 100), s('b', 200)]
    const parsed = parseBackup(exportJSON(scripts, 12345))
    expect(parsed.map((x) => x.id).sort()).toEqual(['a', 'b'])
  })

  it('round-trips through the base64 code (incl. non-ASCII)', () => {
    const scripts = [s('a', 100, { body: 'Tïtle ’\nhow’s it' })]
    const parsed = parseBackup(encodeBackup(scripts, 1))
    expect(parsed[0].body).toBe('Tïtle ’\nhow’s it')
  })

  it('returns [] for junk input', () => {
    expect(parseBackup('not a backup')).toEqual([])
    expect(parseBackup('')).toEqual([])
  })

  it('accepts a bare scripts array too', () => {
    expect(parseBackup(JSON.stringify([s('z', 1)])).map((x) => x.id)).toEqual(['z'])
  })
})

describe('mergeScripts', () => {
  it('keeps the newer of a shared id and unions the rest', () => {
    const merged = mergeScripts([s('a', 100, { readCount: 1 }), s('b', 50)], [s('a', 200, { readCount: 9 }), s('c', 70)])
    expect(merged.map((x) => x.id).sort()).toEqual(['a', 'b', 'c'])
    expect(merged.find((x) => x.id === 'a')!.readCount).toBe(9)
  })
})
