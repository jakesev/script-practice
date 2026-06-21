import { useEffect, useState } from 'react'
import type { Script } from './types'
import { loadScripts, saveScripts, newScript } from './storage'
import { Library } from './Library'
import { Editor } from './Editor'
import { Practice } from './Practice'
import { Stats } from './StatsScreen'
import { SyncScreen, type SyncStatus } from './SyncScreen'
import { isSyncConfigured, pull, push, mergeScripts } from './sync'

type View =
  | { name: 'library' }
  | { name: 'editor'; id: string }
  | { name: 'practice'; id: string }
  | { name: 'stats' }
  | { name: 'sync' }

type Theme = 'dark' | 'light'
const THEME_KEY = 'script-practice:theme'
const SYNC_KEY = 'script-practice:sync-code'

export function App() {
  const [scripts, setScripts] = useState<Script[]>(() => loadScripts())
  const [view, setView] = useState<View>({ name: 'library' })
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'dark',
  )

  useEffect(() => {
    saveScripts(scripts)
  }, [scripts])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  // --- cross-device sync (optional; active only when a sync code is set + backend configured) ---
  const [syncCode, setSyncCode] = useState<string | null>(() => localStorage.getItem(SYNC_KEY))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    if (syncCode) localStorage.setItem(SYNC_KEY, syncCode)
    else localStorage.removeItem(SYNC_KEY)
  }, [syncCode])

  // Pull + merge whenever the active code changes (incl. on load).
  useEffect(() => {
    if (!syncCode || !isSyncConfigured()) return
    let alive = true
    setSyncStatus('syncing')
    pull(syncCode)
      .then((remote) => {
        if (!alive) return
        setScripts((prev) => {
          const merged = mergeScripts(prev, remote)
          saveScripts(merged)
          return merged
        })
        setSyncStatus('synced')
      })
      .catch(() => alive && setSyncStatus('offline'))
    return () => {
      alive = false
    }
  }, [syncCode])

  // Debounced push whenever scripts change while linked.
  useEffect(() => {
    if (!syncCode || !isSyncConfigured()) return
    const t = setTimeout(() => {
      push(syncCode, scripts)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'))
    }, 1200)
    return () => clearTimeout(t)
  }, [scripts, syncCode])

  const syncNow = () => {
    if (!syncCode || !isSyncConfigured()) return
    setSyncStatus('syncing')
    pull(syncCode)
      .then((remote) => {
        const merged = mergeScripts(scripts, remote)
        setScripts(merged)
        saveScripts(merged)
        return push(syncCode, merged)
      })
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'))
  }

  const upsert = (s: Script) =>
    setScripts((prev) => {
      const i = prev.findIndex((p) => p.id === s.id)
      if (i === -1) return [s, ...prev]
      const copy = prev.slice()
      copy[i] = s
      return copy
    })

  const remove = (id: string) => setScripts((prev) => prev.filter((p) => p.id !== id))

  const current =
    view.name === 'editor' || view.name === 'practice' ? scripts.find((s) => s.id === view.id) : undefined

  if (view.name === 'editor' && current) {
    return (
      <Editor
        key={current.id}
        script={current}
        onChange={upsert}
        onDelete={() => {
          remove(current.id)
          setView({ name: 'library' })
        }}
        onPractice={() => setView({ name: 'practice', id: current.id })}
        onBack={() => setView({ name: 'library' })}
      />
    )
  }

  if (view.name === 'practice' && current) {
    return (
      <Practice
        key={current.id}
        script={current}
        theme={theme}
        onToggleTheme={toggleTheme}
        onChange={upsert}
        onEdit={() => setView({ name: 'editor', id: current.id })}
        onBack={() => setView({ name: 'library' })}
      />
    )
  }

  if (view.name === 'stats') {
    return <Stats scripts={scripts} theme={theme} onToggleTheme={toggleTheme} onBack={() => setView({ name: 'library' })} />
  }

  if (view.name === 'sync') {
    return (
      <SyncScreen
        code={syncCode}
        status={syncStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSetCode={(c) => setSyncCode(c)}
        onClearCode={() => {
          setSyncCode(null)
          setSyncStatus('idle')
        }}
        onSyncNow={syncNow}
        onBack={() => setView({ name: 'library' })}
      />
    )
  }

  return (
    <Library
      scripts={scripts}
      theme={theme}
      onToggleTheme={toggleTheme}
      onNew={() => {
        const s = newScript(Date.now())
        upsert(s)
        setView({ name: 'editor', id: s.id })
      }}
      onOpen={(id) => setView({ name: 'practice', id })}
      onEdit={(id) => setView({ name: 'editor', id })}
      onStats={() => setView({ name: 'stats' })}
      onSync={isSyncConfigured() ? () => setView({ name: 'sync' }) : undefined}
    />
  )
}
