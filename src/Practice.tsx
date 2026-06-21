import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Script } from './types'
import { parseBody } from './words'
import { scriptPlainText, bodyToDoc } from './doc'
import { applyRead, resetRound } from './loop'
import { Confirm } from './Confirm'
import { ThemeToggle } from './ThemeToggle'
import { RichReader } from './RichReader'

export function Practice({
  script,
  theme,
  onToggleTheme,
  onChange,
  onEdit,
  onBack,
}: {
  script: Script
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onChange: (s: Script) => void
  onEdit: () => void
  onBack: () => void
}) {
  const parsed = useMemo(() => parseBody(scriptPlainText(script.body)), [script.body])
  const doc = useMemo(() => bodyToDoc(script.body), [script.body])
  const hidden = useMemo(() => new Set(script.blackouts), [script.blackouts])
  const [askReset, setAskReset] = useState(false)

  const total = parsed.eligibleIndices.length
  const hasCues = parsed.wordCount > total
  const done = total > 0 && hidden.size >= total

  // Follow mode: tap the text to move a highlight down the readable (non-note, has-words) lines.
  const stops = useMemo(
    () =>
      parsed.lines
        .map((segs, idx) => ({ idx, kind: parsed.lineKinds[idx], hasWord: segs.some((s) => s.kind === 'word') }))
        .filter((x) => x.kind !== 'note' && x.hasWord)
        .map((x) => x.idx),
    [parsed],
  )
  const [followPos, setFollowPos] = useState<number | null>(null)
  const following = followPos !== null
  const activeLineIndex = following && stops.length ? stops[Math.min(followPos, stops.length - 1)] : null
  const toggleFollow = () => setFollowPos((p) => (p === null ? (stops.length ? 0 : null) : null))
  const advance = () => setFollowPos((p) => (p === null ? null : Math.min(p + 1, stops.length - 1)))

  // A working copy + undo stack in refs, so rapid Space presses chain correctly (don't wait for a
  // re-render) and Undo restores the EXACT prior state — including High score.
  const workingRef = useRef(script)
  const historyRef = useRef<Script[]>([])
  const [, bump] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    workingRef.current = script
  }, [script])

  const finish = () => {
    const cur = workingRef.current
    historyRef.current = [...historyRef.current.slice(-49), cur]
    const next = applyRead(cur, Date.now())
    workingRef.current = next
    bump()
    onChange(next)
  }
  const reset = () => {
    const cur = workingRef.current
    historyRef.current = [...historyRef.current.slice(-49), cur]
    const next = resetRound(cur, Date.now())
    workingRef.current = next
    setAskReset(false)
    bump()
    onChange(next)
  }
  const undo = () => {
    const h = historyRef.current
    if (h.length === 0) return
    const prev = h[h.length - 1]
    historyRef.current = h.slice(0, -1)
    workingRef.current = prev
    bump()
    onChange(prev)
  }

  // Keep the latest handlers/flags reachable from the once-bound key listener.
  const finishRef = useRef(finish)
  const undoRef = useRef(undo)
  const askResetRef = useRef(askReset)
  useEffect(() => {
    finishRef.current = finish
    undoRef.current = undo
    askResetRef.current = askReset
  })

  // Space = log a read fast; ⌘Z / Ctrl+Z = undo. Ignored while typing or a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      const tag = (el?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || el?.isContentEditable) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undoRef.current()
        return
      }
      if (askResetRef.current) return
      if (e.code === 'Space' || e.key === ' ') {
        if (e.repeat) return
        e.preventDefault()
        finishRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canUndo = historyRef.current.length > 0

  return (
    <div className="screen practice">
      <header className="topbar">
        <button className="btn ghost" onClick={onBack}>
          ‹ Library
        </button>
        <div className="topbar-actions">
          <button
            className={'btn ghost' + (following ? ' active' : '')}
            onClick={toggleFollow}
            disabled={stops.length === 0}
            aria-pressed={following}
            title="Follow along — tap the text to move down a line"
          >
            {following ? '■ Stop' : '▶ Follow'}
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn ghost" onClick={onEdit}>
            Edit
          </button>
        </div>
      </header>

      <RichReader
        doc={doc}
        parsed={parsed}
        hidden={hidden}
        activeLineIndex={activeLineIndex}
        onReaderTap={following ? advance : undefined}
      />

      {done && (
        <div className="celebrate">
          🎉 {hasCues ? 'All your lines memorized' : 'Whole script memorized'} — {script.readCount}{' '}
          {script.readCount === 1 ? 'read' : 'reads'}. Keep going or reset.
        </div>
      )}

      <footer className="practice-foot">
        <div className="stats">
          <Stat label="Reads" value={script.readCount} />
          <Stat label="Hidden" value={`${hidden.size}/${total}`} />
          <Stat label="Best" value={script.highScore} />
        </div>
        <div className="actions">
          <button
            className="btn ghost icon"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo last read"
            title="Undo (⌘Z)"
          >
            ↩
          </button>
          <button className="btn ghost" onClick={() => setAskReset(true)} disabled={hidden.size === 0}>
            Reset
          </button>
          <button className="btn primary big" onMouseDown={(e) => e.preventDefault()} onClick={finish}>
            Done — I read it
          </button>
        </div>
        <p className="practice-hint muted">
          {following ? (
            <>
              <b>Tap the text</b> to move down a line · <b>■ Stop</b> to exit follow
            </>
          ) : (
            <>
              Press <b>Space</b> to log a read · <b>⌘Z</b> to undo
            </>
          )}
        </p>
      </footer>

      {askReset && (
        <Confirm
          title="Reset blackouts?"
          body="Clears the hidden words for a fresh round. Your read count and best stay."
          confirmLabel="Reset"
          onCancel={() => setAskReset(false)}
          onConfirm={reset}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )
}
