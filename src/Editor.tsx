import { useRef, useState } from 'react'
import type { Script } from './types'
import { eligibleWordCount } from './words'
import { scriptPlainText } from './doc'
import { Confirm } from './Confirm'
import { RichEditor } from './RichEditor'

export function Editor({
  script,
  onChange,
  onDelete,
  onPractice,
  onBack,
}: {
  script: Script
  onChange: (s: Script) => void
  onDelete: () => void
  onPractice: () => void
  onBack: () => void
}) {
  const [body, setBody] = useState(script.body)
  const bodyRef = useRef(script.body)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleChange = (json: string) => {
    bodyRef.current = json
    setBody(json)
  }

  // Persist on the way out. Only clear the Round + cap High score when the actual WORDS changed
  // (formatting-only edits keep your Blackouts, since word positions didn't move).
  const save = () => {
    const next = bodyRef.current
    if (next === script.body) return
    const patch: Script = { ...script, body: next, updatedAt: Date.now() }
    // Compare on the word content, ignoring trailing blank lines (TipTap's TrailingNode can add/remove an
    // empty paragraph when the last block flips heading/list↔paragraph — a non-word change).
    const words = (b: string) => scriptPlainText(b).replace(/\s+$/, '')
    if (words(next) !== words(script.body)) {
      patch.blackouts = []
      patch.highScore = Math.min(script.highScore, eligibleWordCount(scriptPlainText(next)))
    }
    onChange(patch)
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button
          className="btn ghost"
          onClick={() => {
            save()
            onBack()
          }}
        >
          ‹ Library
        </button>
        <button
          className="btn primary"
          onClick={() => {
            save()
            onPractice()
          }}
        >
          Practice ›
        </button>
      </header>

      <RichEditor scriptId={script.id} initialBody={script.body} onChange={handleChange} />

      <p className="editor-tip muted">
        Tip: label lines <b>You:</b> / <b>Them:</b> (only your <b>You:</b> lines hide), and <b>Notes:</b> for
        reminders.
      </p>

      <div className="editor-foot">
        <span className="muted">{eligibleWordCount(scriptPlainText(body))} of your words to hide</span>
        <button className="btn danger ghost" onClick={() => setConfirmDel(true)}>
          Delete
        </button>
      </div>

      {confirmDel && (
        <Confirm
          title="Delete this script?"
          body="This removes the script and its stats. Can't be undone."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}
