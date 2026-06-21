export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light'
  onToggle: () => void
}) {
  return (
    <button
      className="btn ghost icon"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light page' : 'Switch to dark page'}
      title={theme === 'dark' ? 'Switch to light page' : 'Switch to dark page'}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
