import type { Script } from './types'
import { scriptTitle } from './doc'
import { ThemeToggle } from './ThemeToggle'

export function Library({
  scripts,
  theme,
  onToggleTheme,
  onNew,
  onOpen,
  onEdit,
  onStats,
}: {
  scripts: Script[]
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onNew: () => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onStats: () => void
}) {
  return (
    <div className="screen">
      <header className="topbar">
        <h1>Scripts</h1>
        <div className="topbar-actions">
          <button className="btn ghost icon" onClick={onStats} aria-label="Stats" title="Your practice stats">
            📊
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn primary" onClick={onNew}>
            + New
          </button>
        </div>
      </header>

      {scripts.length === 0 ? (
        <div className="empty">
          <p>No scripts yet.</p>
          <p className="muted">
            Tap <b>+ New</b>, paste your lines, and start reading.
          </p>
        </div>
      ) : (
        <ul className="list">
          {scripts.map((s) => {
            const title = scriptTitle(s.body) || 'Untitled'
            return (
              <li key={s.id} className="card" onClick={() => onOpen(s.id)}>
                <div className="card-main">
                  <div className="card-title">{title}</div>
                  <div className="card-sub muted">
                    {s.readCount} {s.readCount === 1 ? 'read' : 'reads'} · best {s.highScore} hidden
                  </div>
                </div>
                <button
                  className="btn ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(s.id)
                  }}
                >
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
