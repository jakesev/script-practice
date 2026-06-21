import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { generateCode, isValidCode } from './sync'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline'

const STATUS_LABEL: Record<SyncStatus, string> = {
  idle: '',
  syncing: 'Syncing…',
  synced: 'Synced ✓',
  offline: 'Offline — saved on this device, will sync later',
}

export function SyncScreen({
  code,
  status,
  theme,
  onToggleTheme,
  onSetCode,
  onClearCode,
  onSyncNow,
  onBack,
}: {
  code: string | null
  status: SyncStatus
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onSetCode: (code: string) => void
  onClearCode: () => void
  onSyncNow: () => void
  onBack: () => void
}) {
  const [entry, setEntry] = useState('')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the code is shown for manual copy */
    }
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

      <h1 className="stats-h1">Sync</h1>

      {!code ? (
        <>
          <p className="muted sync-intro">
            Link your devices so your scripts follow you. Create a code here, then enter the same code on your
            other device.
          </p>
          <button className="btn primary big sync-cta" onClick={() => onSetCode(generateCode())}>
            Create a sync code
          </button>

          <div className="sync-or">or enter a code from another device</div>
          <div className="sync-entry">
            <input
              className="sync-input"
              placeholder="ABCD-EFGH-JKMN-PQRS"
              value={entry}
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setEntry(e.target.value)}
            />
            <button
              className="btn primary"
              disabled={!isValidCode(entry)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSetCode(entry.trim())
                setEntry('')
              }}
            >
              Link
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted sync-intro">This device is linked. {STATUS_LABEL[status]}</p>

          <div className="sync-code-box">
            <div className="sync-code">{code}</div>
            <button className="btn ghost" onMouseDown={(e) => e.preventDefault()} onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>

          <p className="muted sync-hint">
            On your other device: open this app → <b>Sync</b> → enter this code.
          </p>

          <div className="sync-actions">
            <button className="btn primary" onClick={onSyncNow}>
              Sync now
            </button>
            <button className="btn danger ghost" onClick={onClearCode}>
              Unlink this device
            </button>
          </div>
        </>
      )}
    </div>
  )
}
