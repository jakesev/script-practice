import { useRef, useState } from 'react'
import type { Script } from './types'
import { ThemeToggle } from './ThemeToggle'
import { exportJSON, encodeBackup, parseBackup } from './backup'

export function BackupScreen({
  scripts,
  theme,
  onToggleTheme,
  onImport,
  onBack,
}: {
  scripts: Script[]
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onImport: (incoming: Script[]) => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const download = () => {
    const blob = new Blob([exportJSON(scripts, Date.now())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'script-practice-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup file saved ✓')
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(encodeBackup(scripts, Date.now()))
      setMsg('Code copied ✓ — paste it on your other device')
    } catch {
      setMsg('Copy blocked — use the file instead')
    }
  }

  const applyImport = (incoming: Script[]) => {
    if (!incoming.length) {
      setMsg("Couldn't read that backup")
      return
    }
    onImport(incoming)
    setMsg(`Imported ${incoming.length} ${incoming.length === 1 ? 'script' : 'scripts'} ✓`)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    applyImport(parseBackup(await file.text()))
    e.target.value = ''
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="btn ghost" onClick={onBack}>
          ‹ Library
        </button>
        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      <h1 className="stats-h1">Backup &amp; transfer</h1>
      <p className="muted sync-intro">
        Move your {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'} to another device, or keep a
        safe copy. No accounts — it all stays with you.
      </p>

      <h2 className="stats-h2">Export</h2>
      <div className="sync-actions">
        <button className="btn primary" onClick={download}>
          Download file
        </button>
        <button className="btn ghost" onClick={copyCode}>
          Copy code
        </button>
      </div>
      <p className="muted sync-hint">
        Save/AirDrop the <b>file</b> (best), or <b>copy the code</b> and message it to yourself.
      </p>

      <h2 className="stats-h2">Import</h2>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
      <div className="sync-actions">
        <button className="btn primary" onClick={() => fileRef.current?.click()}>
          Choose a file
        </button>
      </div>
      <div className="sync-or">or paste a code</div>
      <div className="sync-entry">
        <input
          className="sync-input"
          placeholder="Paste backup code…"
          value={code}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="btn primary"
          disabled={code.trim().length < 8}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            applyImport(parseBackup(code))
            setCode('')
          }}
        >
          Import
        </button>
      </div>

      {msg && <p className="backup-msg">{msg}</p>}
    </div>
  )
}
