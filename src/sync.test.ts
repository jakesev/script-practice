import { describe, it, expect } from 'vitest'
import { mergeScripts, generateCode, isValidCode } from './sync'
import { newScript } from './storage'
import type { Script } from './types'

function s(id: string, updatedAt: number, over: Partial<Script> = {}): Script {
  return { ...newScript(0), id, updatedAt, ...over }
}

describe('mergeScripts', () => {
  it('keeps the newer version of a script that exists on both sides', () => {
    const merged = mergeScripts([s('a', 100, { readCount: 1 })], [s('a', 200, { readCount: 9 })])
    expect(merged).toHaveLength(1)
    expect(merged[0].readCount).toBe(9)
  })

  it('unions scripts unique to each side', () => {
    const merged = mergeScripts([s('a', 100), s('b', 50)], [s('a', 90), s('c', 70)])
    expect(merged.map((x) => x.id).sort()).toEqual(['a', 'b', 'c'])
    // 'a' kept the local (newer) copy
    expect(merged.find((x) => x.id === 'a')!.updatedAt).toBe(100)
  })

  it('sorts most-recently-updated first', () => {
    const merged = mergeScripts([s('a', 100)], [s('b', 300), s('c', 200)])
    expect(merged.map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('sync codes', () => {
  it('generates a grouped high-entropy code', () => {
    expect(generateCode()).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)
  })

  it('generates distinct codes', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateCode()))
    expect(set.size).toBe(50)
  })

  it('validates length case/dash-insensitively', () => {
    expect(isValidCode(generateCode())).toBe(true)
    expect(isValidCode('abcd-efgh-jkmn')).toBe(true)
    expect(isValidCode('too-short')).toBe(false)
  })
})
