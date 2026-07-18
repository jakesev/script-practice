# Script Practice ("script blackout") — project map

Script-memorization PWA: paste a Script, read it through, tap Done — one more word blacks out each
Read until the whole Script is from memory. React 18 + Vite + TypeScript + TipTap editor. All data
lives in localStorage (no backend; backup = Export/Import inside the app). Separate from Knock'a.

- Live app (installable PWA): https://jakesev.github.io/script-practice/
- `CONTEXT.md` — the glossary; use its exact terms (Script, Read, Blackout, Round, Reset, Speaker, Cue line).
- `docs/STATUS.md` — build-slice board (what's done / open). Decisions live in `docs/adr/`.

## Commands
- `npm install` — once after cloning
- `npm run dev` — dev server at http://localhost:3120
- `npm test` — vitest (colocated `*.test.ts` in `src/`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build (Pages base `/script-practice/`)
- `node scripts/make-icons.mjs` — regenerate the PWA icons in `public/`

## Deploy — pushing goes live
Every push to `main` auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`. There is no
staging: only push when the change should be live at the phone URL. The repo name is baked into
`vite.config.ts` (`REPO_BASE = '/script-practice/'`) — renaming the repo breaks the live URL and any
installed PWA unless that base (and the Pages URL on devices) move with it.

## Working style
- One slice at a time: propose → confirm → build → verify; log finished slices in `docs/STATUS.md`.
- localStorage-only by decision (Supabase sync was built, then removed) — do not reintroduce a
  backend without an explicit ask.
- Keep the CONTEXT.md vocabulary in UI copy and code names.
