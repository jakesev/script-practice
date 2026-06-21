import { useId, useState, type ReactNode } from 'react'
import { flattenBlocks, type Block, type PMMark, type PMNode } from './doc'
import type { Parsed, Seg, SpeakerKind } from './words'

/** Wrap text in the inline formatting implied by its marks. Hidden words skip this (a bar covers them). */
function withMarks(marks: PMMark[], node: ReactNode): ReactNode {
  let out = node
  if (marks.some((m) => m.type === 'bold')) out = <strong>{out}</strong>
  if (marks.some((m) => m.type === 'italic')) out = <em>{out}</em>
  if (marks.some((m) => m.type === 'underline')) out = <u>{out}</u>
  if (marks.some((m) => m.type === 'strike')) out = <s>{out}</s>
  if (marks.some((m) => m.type === 'code')) out = <code>{out}</code>
  return out
}

function marksAt(block: Block, i: number): PMMark[] {
  return block.marksAt[i] ?? []
}

/** Wrap a ( … ) tip/stage-direction so it reads as an aside (never blacked out). */
function tipWrap(tip: boolean | undefined, node: ReactNode): ReactNode {
  return tip ? <span className="tip">{node}</span> : node
}

/** Render one line's segments. `kind` colours the speaker label; `hideLabel` drops it (notes use a header). */
function renderSegs(
  segs: Seg[],
  block: Block,
  hidden: Set<number>,
  kind: SpeakerKind,
  hideLabel: boolean,
): ReactNode[] {
  const out: ReactNode[] = []
  let offset = 0

  segs.forEach((seg, i) => {
    const text = seg.text

    if (seg.kind === 'label') {
      if (!hideLabel) {
        out.push(
          <span key={i} className={`speaker speaker--${kind}`}>
            {text}
          </span>,
        )
      }
    } else if (seg.kind === 'word') {
      const isHidden = !!seg.eligible && seg.wordIndex !== undefined && hidden.has(seg.wordIndex)
      if (isHidden) {
        const leadLen = seg.lead?.length ?? 0
        const coreLen = seg.core?.length ?? 0
        out.push(
          <span key={i}>
            {seg.lead ? withMarks(marksAt(block, offset), seg.lead) : null}
            <span className="blackout" aria-hidden="true">
              {seg.core}
            </span>
            {seg.trail ? withMarks(marksAt(block, offset + leadLen + coreLen), seg.trail) : null}
          </span>,
        )
      } else {
        out.push(<span key={i}>{tipWrap(seg.tip, withMarks(marksAt(block, offset), text))}</span>)
      }
    } else {
      out.push(<span key={i}>{withMarks(marksAt(block, offset), text)}</span>)
    }

    offset += text.length
  })

  return out
}

/** A collapsible amber callout grouping one or more consecutive `Notes:` lines. */
function NoteCallout({ items, hidden }: { items: { segs: Seg[]; block: Block }[]; hidden: Set<number> }) {
  const [open, setOpen] = useState(true)
  const bodyId = useId()
  const labelSeg = items[0]?.segs.find((s) => s.kind === 'label')
  const label = (labelSeg?.text ?? 'Notes:').replace(/\s*:$/, '')

  return (
    <div className="note">
      <button
        className="note-head"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className="note-chev">{open ? '▾' : '▸'}</span>
        <span className="note-label">{label}</span>
      </button>
      {open && (
        <div className="note-body" id={bodyId}>
          {items.map((it, k) => (
            <p key={k} className="note-line">
              {renderSegs(it.segs, it.block, hidden, 'note', true)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function RichReader({
  doc,
  parsed,
  hidden,
}: {
  doc: PMNode
  parsed: Parsed
  hidden: Set<number>
}) {
  const blocks = flattenBlocks(doc)
  const title = blocks[0]
  const bodyBlocks = blocks.slice(1)

  const items: ReactNode[] = []
  let i = 0
  while (i < bodyBlocks.length) {
    const kind = parsed.lineKinds[i] ?? 'none'

    if (kind === 'note') {
      const group: { segs: Seg[]; block: Block }[] = []
      while (i < bodyBlocks.length && (parsed.lineKinds[i] ?? 'none') === 'note') {
        group.push({ segs: parsed.lines[i] ?? [], block: bodyBlocks[i] })
        i++
      }
      items.push(<NoteCallout key={`n${i}`} items={group} hidden={hidden} />)
      continue
    }

    const block = bodyBlocks[i]
    const segs = parsed.lines[i] ?? []
    const children = segs.length === 0 ? ' ' : renderSegs(segs, block, hidden, kind, false)
    const lineClass = kind === 'mine' || kind === 'other' ? ` line--${kind}` : ''

    if (block.level >= 1) {
      const Tag = block.level <= 2 ? 'h2' : 'h3'
      items.push(
        <Tag key={i} className={'reader-h' + lineClass}>
          {children}
        </Tag>,
      )
    } else if (block.listMarker) {
      items.push(
        <p key={i} className={'reader-line reader-li' + lineClass}>
          <span className="li-marker">{block.listMarker}</span>
          <span className="li-body">{children}</span>
        </p>,
      )
    } else {
      items.push(
        <p key={i} className={'reader-line' + lineClass}>
          {children}
        </p>,
      )
    }
    i++
  }

  return (
    <div className="reader">
      <h1 className="reader-title">{(title?.text ?? '').trim() || 'Untitled'}</h1>
      <div className="reader-body">{items}</div>
    </div>
  )
}
