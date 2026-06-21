// Bridge between the rich-text document (TipTap / ProseMirror JSON) and the plain-text
// word/role logic in words.ts.
//
// The whole blackout + You/Them engine works on a PLAIN-TEXT PROJECTION of the doc — one line
// per block — so it stays unchanged and fully tested. Formatting is layered back on at render
// time (see RichReader) by looking up the marks for each character.

export interface PMMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface PMNode {
  type: string
  text?: string
  marks?: PMMark[]
  attrs?: Record<string, unknown>
  content?: PMNode[]
}

/** An empty document (one blank paragraph). */
export const EMPTY_DOC: PMNode = { type: 'doc', content: [{ type: 'paragraph' }] }

/** One rendered line: its plain text, the marks at each character, and block styling. */
export interface Block {
  text: string
  /** marks[i] = the marks active at character i of `text` (parallel, UTF-16 indexed). */
  marksAt: PMMark[][]
  /** 0 = paragraph; 1–6 = heading level. */
  level: number
  /** Bullet/number marker for list items, else undefined. */
  listMarker?: string
}

/** Parse a stored body into a PM doc. Accepts PM JSON, or legacy/plain text (one line → paragraph). */
export function bodyToDoc(body: string): PMNode {
  if (!body || !body.trim()) return EMPTY_DOC
  if (body.trimStart().startsWith('{')) {
    try {
      const doc = JSON.parse(body) as PMNode
      if (doc && doc.type === 'doc') return doc
    } catch {
      /* fall through to plain-text handling */
    }
  }
  const content: PMNode[] = body.split('\n').map((line) =>
    line.length ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' },
  )
  return { type: 'doc', content }
}

function inlineToText(nodes: PMNode[] | undefined): { text: string; marksAt: PMMark[][] } {
  let text = ''
  const marksAt: PMMark[][] = []
  for (const n of nodes ?? []) {
    if (n.type === 'text' && n.text) {
      // A literal newline inside a text node would desync block.text from the plain-text projection
      // (which splits on \n). Treat it like a hardBreak — a single space — keeping length 1:1.
      const t = n.text.replace(/[\r\n]/g, ' ')
      text += t
      const marks = n.marks ?? []
      for (let i = 0; i < t.length; i++) marksAt.push(marks)
    } else if (n.type === 'hardBreak') {
      text += ' '
      marksAt.push([])
    }
  }
  return { text, marksAt }
}

/** Flatten a doc into renderable lines. Each top-level block (and each list item) becomes one Block. */
export function flattenBlocks(doc: PMNode): Block[] {
  const out: Block[] = []

  const walk = (nodes: PMNode[] | undefined): void => {
    for (const node of nodes ?? []) {
      if (node.type === 'paragraph') {
        const { text, marksAt } = inlineToText(node.content)
        out.push({ text, marksAt, level: 0 })
      } else if (node.type === 'heading') {
        const { text, marksAt } = inlineToText(node.content)
        out.push({ text, marksAt, level: Number(node.attrs?.level ?? 2) })
      } else if (node.type === 'bulletList' || node.type === 'orderedList') {
        const ordered = node.type === 'orderedList'
        const start = ordered ? Number(node.attrs?.start ?? 1) : 1
        ;(node.content ?? []).forEach((li, idx) => {
          const marker = ordered ? `${start + idx}.` : '•'
          ;(li.content ?? []).forEach((child, ci) => {
            if (child.type === 'paragraph') {
              const { text, marksAt } = inlineToText(child.content)
              out.push({ text, marksAt, level: 0, listMarker: ci === 0 ? marker : undefined })
            } else {
              walk([child])
            }
          })
        })
      } else if (node.content) {
        walk(node.content)
      }
    }
  }

  walk(doc.content)
  return out
}

/** Plain-text projection: one line per block. This is what words.ts parses. */
export function docToPlain(doc: PMNode): string {
  return flattenBlocks(doc)
    .map((b) => b.text)
    .join('\n')
}

/** Convenience: a stored body → its plain-text projection for the word/role engine. */
export function scriptPlainText(body: string): string {
  return docToPlain(bodyToDoc(body))
}

/** The Script's display title — the first line/block of its content (Notes style). */
export function scriptTitle(body: string): string {
  const plain = scriptPlainText(body)
  const nl = plain.indexOf('\n')
  return (nl === -1 ? plain : plain.slice(0, nl)).trim()
}
