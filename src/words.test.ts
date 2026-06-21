import { describe, it, expect } from 'vitest'
import { parseBody, eligibleWordCount, splitTitle } from './words'

function words(body: string) {
  return parseBody(body).lines.flat().filter((s) => s.kind === 'word')
}
function eligibleCores(body: string) {
  return words(body)
    .filter((w) => w.eligible)
    .map((w) => w.core)
}

describe('splitTitle / punctuation', () => {
  it('takes the first line as the Title', () => {
    expect(splitTitle('My Title\nbody here').title).toBe('My Title')
  })
  it('keeps punctuation out of the word core so it stays visible', () => {
    const p = parseBody('T\nwell,')
    const w = p.lines[0].find((s) => s.kind === 'word')
    expect(w?.core).toBe('well')
    expect(w?.trail).toBe(',')
  })
})

describe('role-aware eligibility', () => {
  it('no labels → every word is yours', () => {
    expect(eligibleWordCount('T\nhello world foo')).toBe(3)
    expect(eligibleCores('T\nhello world foo')).toEqual(['hello', 'world', 'foo'])
  })

  it('only You: words are eligible; Them: stays a cue', () => {
    const body = 'Pitch\nYou: hey mate\nThem: who are you'
    expect(eligibleCores(body)).toEqual(['hey', 'mate'])
    expect(eligibleWordCount(body)).toBe(2)
    // total words still counts the cue line
    expect(parseBody(body).wordCount).toBe(5)
  })

  it('keeps the label as its own visible segment, not a word', () => {
    const line0 = parseBody('Pitch\nYou: hi').lines[0]
    expect(line0[0]).toMatchObject({ kind: 'label', text: 'You:' })
    expect(line0.filter((s) => s.kind === 'word').map((w) => w.core)).toEqual(['hi'])
  })

  it('a label on its own line carries to the following lines', () => {
    const body = 'T\nYou:\nfirst line\nsecond line\nThem:\ntheir bit'
    expect(eligibleCores(body)).toEqual(['first', 'line', 'second', 'line'])
    expect(eligibleWordCount(body)).toBe(4)
  })

  it('Me: is yours; Rep:/Them: are cues', () => {
    const body = 'T\nMe: alpha\nRep: beta\nThem: gamma'
    expect(eligibleCores(body)).toEqual(['alpha'])
  })

  it('is case-insensitive for You/Me', () => {
    expect(eligibleCores('T\nYOU: a\nyou: b\nThem: c')).toEqual(['a', 'b'])
  })

  it('treats narration before the first label as a cue, not yours', () => {
    const body = 'T\n(door opens)\nYou: hi'
    expect(eligibleCores(body)).toEqual(['hi'])
  })
})

describe('speaker kinds + notes', () => {
  const kinds = (body: string) => parseBody(body).lineKinds

  it('tags You as mine and Them as other', () => {
    expect(kinds('T\nYou: hi\nThem: yo')).toEqual(['mine', 'other'])
  })

  it('tags a Notes line as note and never makes it eligible', () => {
    const body = 'T\nYou: hello\nNotes: smile here'
    expect(kinds(body)).toEqual(['mine', 'note'])
    expect(eligibleCores(body)).toEqual(['hello'])
  })

  it('a Notes line in a monologue does NOT stop the monologue blacking out', () => {
    const body = 'Monologue\nNotes: say it slowly\nTo be or not to be'
    expect(kinds(body)).toEqual(['note', 'none'])
    expect(eligibleCores(body)).toEqual(['To', 'be', 'or', 'not', 'to', 'be'])
  })

  it('a Notes line does not change who is speaking (You carries past it)', () => {
    const body = 'T\nYou: hello\nNotes: pause\nand smile'
    expect(kinds(body)).toEqual(['mine', 'note', 'mine'])
    expect(eligibleCores(body)).toEqual(['hello', 'and', 'smile'])
  })

  it('a one-off non-dialogue label (Stage:/INT:) does NOT flip a monologue out of blackout', () => {
    const body = 'Title\nTo be or not to be\nStage: lights up\nthat is the question'
    expect(kinds(body)).toEqual(['none', 'none', 'none'])
    expect(eligibleCores(body)).toEqual([
      'To', 'be', 'or', 'not', 'to', 'be', 'lights', 'up', 'that', 'is', 'the', 'question',
    ])
  })
})

describe('tips (parentheticals)', () => {
  it('words inside ( … ) are tips — never eligible, and tagged', () => {
    const body = 'T\nYou: hey mate (smile, warm tone) how are you'
    expect(eligibleCores(body)).toEqual(['hey', 'mate', 'how', 'are', 'you'])
    const tips = parseBody(body)
      .lines.flat()
      .filter((s) => s.kind === 'word' && s.tip)
      .map((s) => s.core)
    expect(tips).toEqual(['smile', 'warm', 'tone'])
  })
})
