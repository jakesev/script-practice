// Parsing a Script's text into a Title (first line) + body words that can be blacked out.
//
// A "word" is the alphanumeric core of a chunk; leading/trailing punctuation stays visible
// so the layout never shifts when a word is hidden.
//
// Role-aware: dialogue lines can be labelled by speaker ("You:", "Them:", "Rep:"…). Only YOUR
// lines (You/Me) are eligible to black out — the other speaker's lines and the labels themselves
// stay visible as cues. "Notes:" / "Note:" is a per-line aside (a reminder): never blacked out,
// styled distinctly, and it does NOT change who is speaking (so it won't swallow a monologue).
// A Script with no dialogue labels at all is treated as entirely the user's own lines.

const WORD_CORE = /[A-Za-z0-9][A-Za-z0-9'’-]*/
const LABEL_RE = /^(\s*)([A-Za-z][A-Za-z0-9_'’-]*)\s*:/

/** Speakers whose lines are "yours" and therefore get blacked out. */
const MY_SPEAKERS = new Set(['you', 'me'])
/** Labels that mark a reminder/aside rather than a spoken line. */
const NOTE_SPEAKERS = new Set(['note', 'notes'])
/** Only these labels turn role-scoping ON — so a one-off "Stage:"/"INT:" line doesn't disable a monologue. */
const CORE_SPEAKERS = new Set(['you', 'me', 'them'])

export type SpeakerKind = 'mine' | 'note' | 'other' | 'none'

export type SegKind = 'space' | 'word' | 'punct' | 'label'

export interface Seg {
  kind: SegKind
  text: string
  lead?: string
  core?: string
  trail?: string
  /** Stable index across the body, assigned to every real word (used for Blackouts). */
  wordIndex?: number
  /** Whether this word may be blacked out (belongs to one of your lines). */
  eligible?: boolean
  /** Inside a ( … ) aside — a tip/stage-direction: never blacked out, styled distinctly. */
  tip?: boolean
}

/** Mark every character that sits inside a ( … ) span (parens included). */
function parenMask(s: string): boolean[] {
  const mask = new Array<boolean>(s.length).fill(false)
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') {
      depth++
      mask[i] = true
    } else if (c === ')') {
      mask[i] = depth > 0
      if (depth > 0) depth--
    } else {
      mask[i] = depth > 0
    }
  }
  return mask
}

export interface Parsed {
  title: string
  lines: Seg[][]
  /** Speaker kind per line in `lines` (for colour-coding / notes). */
  lineKinds: SpeakerKind[]
  /** Total body words (yours + cues). */
  wordCount: number
  /** wordIndex values that may be blacked out (your lines only). */
  eligibleIndices: number[]
}

interface LabelMatch {
  name: string
  labelText: string
  rest: string
}

function matchLabel(line: string): LabelMatch | null {
  const m = LABEL_RE.exec(line)
  if (!m) return null
  return { name: m[2].toLowerCase(), labelText: line.slice(0, m[0].length), rest: line.slice(m[0].length) }
}

/** Split the Title (first line) from the rest of the body. */
export function splitTitle(body: string): { title: string; rest: string } {
  const nl = body.indexOf('\n')
  if (nl === -1) return { title: body, rest: '' }
  return { title: body.slice(0, nl), rest: body.slice(nl + 1) }
}

export function parseBody(body: string): Parsed {
  const { title, rest } = splitTitle(body)
  const rawLines = rest.split('\n')
  // Role-scoping turns on ONLY with genuine dialogue markers (You/Me/Them) — not Notes asides, and
  // not a one-off structural prefix like "Stage:"/"INT:" — so a monologue still blacks out normally.
  const hasDialogue = rawLines.some((l) => {
    const m = matchLabel(l)
    return m !== null && CORE_SPEAKERS.has(m.name)
  })

  const lines: Seg[][] = []
  const lineKinds: SpeakerKind[] = []
  const eligibleIndices: number[] = []
  let wordIndex = 0
  let currentSpeaker: string | null = null

  for (const rawLine of rawLines) {
    const segs: Seg[] = []
    let content = rawLine
    let lineSpeaker = currentSpeaker

    const lab = matchLabel(rawLine)
    if (lab) {
      segs.push({ kind: 'label', text: lab.labelText })
      content = lab.rest
      if (NOTE_SPEAKERS.has(lab.name)) {
        // A note styles only this line and does NOT change the running speaker.
        lineSpeaker = lab.name
      } else {
        currentSpeaker = lab.name
        lineSpeaker = lab.name
      }
    }

    const isNoteLine = lineSpeaker !== null && NOTE_SPEAKERS.has(lineSpeaker)
    const mineNow = isNoteLine
      ? false
      : !hasDialogue
        ? true
        : lineSpeaker !== null && MY_SPEAKERS.has(lineSpeaker)

    const mask = parenMask(content)
    const re = /\S+|\s+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      const text = m[0]
      const tip = mask[m.index] ?? false
      if (/^\s+$/.test(text)) {
        segs.push({ kind: 'space', text, tip })
        continue
      }
      const cm = text.match(WORD_CORE)
      if (!cm) {
        segs.push({ kind: 'punct', text, tip })
        continue
      }
      const core = cm[0]
      const start = cm.index ?? 0
      const idx = wordIndex++
      const eligible = mineNow && !tip
      if (eligible) eligibleIndices.push(idx)
      segs.push({
        kind: 'word',
        text,
        lead: text.slice(0, start),
        core,
        trail: text.slice(start + core.length),
        wordIndex: idx,
        eligible,
        tip,
      })
    }

    lines.push(segs)
    lineKinds.push(
      isNoteLine
        ? 'note'
        : !hasDialogue || lineSpeaker === null
          ? 'none'
          : MY_SPEAKERS.has(lineSpeaker)
            ? 'mine'
            : 'other',
    )
  }

  return { title, lines, lineKinds, wordCount: wordIndex, eligibleIndices }
}

/** How many body words could be blacked out — your lines only (Title + cues + notes excluded). */
export function eligibleWordCount(body: string): number {
  return parseBody(body).eligibleIndices.length
}
