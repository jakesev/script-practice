import { describe, it, expect } from 'vitest'
import { bodyToDoc, flattenBlocks, scriptPlainText, type PMNode } from './doc'
import { parseBody } from './words'

const doc = (content: PMNode[]): PMNode => ({ type: 'doc', content })
const para = (text: string): PMNode => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : [],
})

describe('bodyToDoc / scriptPlainText', () => {
  it('round-trips plain text through the projection', () => {
    expect(scriptPlainText('Title\nhello world')).toBe('Title\nhello world')
  })
  it('treats empty body as no content', () => {
    expect(scriptPlainText('')).toBe('')
  })
  it('parses stored PM JSON', () => {
    const json = JSON.stringify(doc([para('Hi there')]))
    expect(bodyToDoc(json).type).toBe('doc')
    expect(scriptPlainText(json)).toBe('Hi there')
  })
  it('falls back to plain text on invalid JSON-looking input', () => {
    expect(scriptPlainText('{not json')).toBe('{not json')
  })
})

describe('flattenBlocks', () => {
  it('flattens paragraphs, headings and list items into one line each', () => {
    const d = doc([
      para('My Title'),
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scene 1' }] },
      para('You: hello'),
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [para('first')] },
          { type: 'listItem', content: [para('second')] },
        ],
      },
    ])
    const blocks = flattenBlocks(d)
    expect(blocks.map((b) => b.text)).toEqual(['My Title', 'Scene 1', 'You: hello', 'first', 'second'])
    expect(blocks[1].level).toBe(2)
    expect(blocks[3].listMarker).toBe('•')
  })

  it('records the marks at each character', () => {
    const d = doc([
      para('a'),
      { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
    ])
    const b = flattenBlocks(d)[1]
    expect(b.text).toBe('bold')
    expect(b.marksAt).toHaveLength(4)
    expect(b.marksAt.every((m) => m.some((x) => x.type === 'bold'))).toBe(true)
  })

  it('normalizes a literal newline inside a text node so block.text has no newline (no desync)', () => {
    const d = doc([para('Title'), { type: 'paragraph', content: [{ type: 'text', text: 'hello\nworld here' }] }])
    const blocks = flattenBlocks(d)
    expect(blocks).toHaveLength(2)
    expect(blocks[1].text).toBe('hello world here')
    expect(scriptPlainText(JSON.stringify(d)).split('\n')).toHaveLength(2)
  })
})

describe('rich + role integration', () => {
  it('a rich dialogue doc yields the right eligible words via parseBody', () => {
    const d = doc([para('Pitch'), para('You: alpha beta'), para('Them: gamma')])
    const plain = scriptPlainText(JSON.stringify(d))
    expect(plain).toBe('Pitch\nYou: alpha beta\nThem: gamma')

    const eligibleCores = parseBody(plain)
      .lines.flat()
      .filter((s) => s.kind === 'word' && s.eligible)
      .map((s) => s.core)
    expect(eligibleCores).toEqual(['alpha', 'beta'])
  })
})
