import { describe, it, expect } from 'vitest'
import { applyRead, resetRound } from './loop'
import { newScript } from './storage'
import { parseBody } from './words'

function scriptWith(body: string) {
  const s = newScript(0)
  s.body = body
  return s
}

describe('applyRead', () => {
  it('increments the read count and hides one word', () => {
    const r = applyRead(scriptWith('Title\nhello world foo'), 100, () => 0)
    expect(r.readCount).toBe(1)
    expect(r.blackouts.length).toBe(1)
    expect(r.reads).toEqual([100])
    expect(r.highScore).toBe(1)
  })

  it('never hides more words than the body has, but still counts the read', () => {
    let s = scriptWith('T\na b') // 2 body words
    s = applyRead(s, 1, () => 0)
    s = applyRead(s, 2, () => 0)
    s = applyRead(s, 3, () => 0) // nothing left to hide
    expect(s.blackouts.length).toBe(2)
    expect(s.readCount).toBe(3)
    expect(s.highScore).toBe(2)
  })

  it('keeps read count and high score through a reset', () => {
    let s = scriptWith('T\na b c')
    s = applyRead(s, 1, () => 0)
    s = applyRead(s, 2, () => 0)
    const after = resetRound(s, 3)
    expect(after.blackouts.length).toBe(0)
    expect(after.highScore).toBe(2)
    expect(after.readCount).toBe(2)
  })

  it('only ever hides YOUR lines, never the other speaker', () => {
    // "You: alpha beta" → indices 0,1 ; "Them: gamma delta" → indices 2,3 (cues)
    const body = 'Pitch\nYou: alpha beta\nThem: gamma delta'
    const eligible = parseBody(body).eligibleIndices
    expect(eligible).toEqual([0, 1])

    let s = scriptWith(body)
    for (let i = 0; i < 5; i++) s = applyRead(s, i, () => 0)

    expect(s.readCount).toBe(5)
    expect(s.blackouts.length).toBe(2) // capped at your two words
    expect(s.blackouts.every((i) => eligible.includes(i))).toBe(true)
    expect(s.highScore).toBe(2)
  })
})
