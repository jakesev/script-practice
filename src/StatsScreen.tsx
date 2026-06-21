import { useMemo } from 'react'
import type { Script } from './types'
import { totalReads, perScript, dailyReads, currentStreak } from './stats'
import { ThemeToggle } from './ThemeToggle'

export function Stats({
  scripts,
  theme,
  onToggleTheme,
  onBack,
}: {
  scripts: Script[]
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onBack: () => void
}) {
  const now = Date.now()
  const total = totalReads(scripts)
  const streak = useMemo(() => currentStreak(scripts, now), [scripts, now])
  const perS = useMemo(() => perScript(scripts), [scripts])
  const days = useMemo(() => dailyReads(scripts, 30, now), [scripts, now])
  const maxDay = Math.max(1, ...days.map((d) => d.count))
  const maxReads = Math.max(1, ...perS.map((s) => s.readCount))

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

      <h1 className="stats-h1">Your practice</h1>

      {total === 0 ? (
        <div className="empty">
          <p>No practice yet.</p>
          <p className="muted">
            Open a script, read it, and tap <b>Done</b> (or press Space) — your reads and streak show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="stats">
            <Stat label="Total reads" value={total} />
            <Stat label="Day streak" value={streak} />
            <Stat label="Scripts" value={scripts.length} />
          </div>

          <section className="stats-section">
            <h2 className="stats-h2">Last 30 days</h2>
            <div className="daychart">
              {days.map((d) => (
                <div className="daycol" key={d.date} title={`${d.label}: ${d.count} ${d.count === 1 ? 'read' : 'reads'}`}>
                  <div
                    className="daybar"
                    style={{
                      height: `${d.count === 0 ? 3 : 10 + (d.count / maxDay) * 90}%`,
                      opacity: d.count === 0 ? 0.25 : 1,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="daychart-axis">
              <span>{days[0].label}</span>
              <span>Today</span>
            </div>
          </section>

          <section className="stats-section">
            <h2 className="stats-h2">By script</h2>
            <ul className="scriptstats">
              {perS.map((s) => (
                <li className="scriptstat" key={s.id}>
                  <div className="scriptstat-top">
                    <span className="scriptstat-title">{s.title}</span>
                    <span className="scriptstat-meta muted">
                      {s.readCount} {s.readCount === 1 ? 'read' : 'reads'} · best {s.highScore}
                    </span>
                  </div>
                  <div className="scriptstat-track">
                    <div className="scriptstat-bar" style={{ width: `${Math.max(4, (s.readCount / maxReads) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
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
