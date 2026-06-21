# Script Practice — focus board

A script-memorization web app: read a Script through, tap Done, one more word blacks out, repeat
until it's all from memory. Synced web app (PWA) — laptop + iPhone. Separate from Knock'a.

Decisions live in [CONTEXT.md](../CONTEXT.md) (glossary) and [docs/adr/](adr/).

## Build slices
| Slice | What | Status |
|---|---|---|
| 1 | Core loop + Library (create, practice, Done→confirm, random blackout, reset, high score, stats numbers, localStorage) | ✅ Built + browser-verified |
| 1.1 | Light/dark theme toggle — dark page + light bars OR paper page + true-black bars (persists) | ✅ Built + browser-verified |
| 1.2 | Role-aware blackout — only your `You:`/`Me:` lines hide; `Them:`/other speakers + labels stay visible as cues; no-label scripts blank fully | ✅ Built + browser-verified (16 tests) |
| 2 | Notes-style rich editor — TipTap; auto-title, paste keeps formatting, B/I/H/list toolbar; body stores PM-JSON; formatting + role-aware blackout coexist | ✅ Built + browser-verified (23 tests) |
| 2a | Notes asides + speaker colour-coding — `Notes:` = collapsible amber italic callout (per-line, never blacked, doesn't break monologues); `You:` blue / `Them:` green with left gutter bars | ✅ Built + browser-verified both themes (27 tests) |
| 2b | Fast read + Undo — Space (laptop) / one-tap Done (no more Yes/Not-yet confirm) logs a read instantly; ↩ Undo button + ⌘Z revert exactly incl. high score, rapid-press safe, disables at 0 | ✅ Built + browser-verified |
| 2v | Adversarial review of slice 2 (26 agents) — 14 findings: **8 fixed** (monologue `Stage:`/`INT:` no longer kills blackout #1; `\n`-in-text-node desync #2/3; save() trailing-`\n` wipe #6; heading clamp #12; ordered-list `start` #13; note `aria-controls` #9; dead `.editor` CSS #10; narrow-footer overflow #14; dropped unused `hasSpeakerLabels` #11), **4 accepted** (Space-past-done counts = intended #5; link-mark strip = safe-by-design #7; blackout AT cue = single-user scope #8; Notes-as-list-marker = niche #4). 34 tests; #1 live-verified | ✅ Done |
| U1 | Desktop launcher — `~/Desktop/Launch Script Practice.command` double-click → starts dev server (port 3120, nvm PATH) + opens browser | ✅ Done + verified (HTTP 200 from clean env) |
| 3 | Stats screen — totals (reads/streak/scripts) + 30-day activity chart + per-Script read/best bars; 📊 from Library; empty state | ✅ Built + browser-verified both themes (35 tests; stats math in stats.ts) |
| 2c | Live editor highlighting — `You:` blue / `Them:` green / `Notes:` amber colour-coded AS YOU TYPE (ProseMirror decoration `speakerHighlight.ts`); title skipped | ✅ Built + browser-verified (DOM colours confirmed) |
| 2d | Reading focus + tips — soft per-speaker block highlight (You faint-blue / Them faint-green / Notes amber) so sections stand out; `( … )` parentheticals = tips (amber italic, NEVER blacked, excluded from count), inline or in `Note:( … )` | ✅ Built + browser-verified (41 tests; 4/14 count proves tip exclusion) |
| 2e | Follow mode (teleprompter) — ▶ Follow highlights the current line (yellow highlighter bar); tap the text to move down one readable line (skips Notes), auto-scrolls, clamps at last; ■ Stop exits | ✅ Built + browser-verified (advance/skip/clamp/stop all confirmed) |
| 4a | PWA + private GitHub repo — manifest + service worker (offline precache), icons, base `/script-practice/`; repo `jakesev/script-practice` PRIVATE, pushed (36 files) | ✅ Done |
| 4b | Live hosting (phone URL) — repo made PUBLIC (user choice), GitHub Pages via Actions. **LIVE at https://jakesev.github.io/script-practice/** — page+assets+manifest+sw+apple-icon all 200; installable offline PWA | ✅ Done |
| 4c | Cross-device sync CLIENT — sync-code (no email), Supabase RPC, merge-by-updatedAt, hashed client-side; Sync screen + Library ⇄ button; dormant until keys set; `supabase/sync.sql` written | ✅ Built (40 tests); committed+pushed (dormant) |
| 4d | Sync BACKEND — user creates free Supabase project + runs `supabase/sync.sql` + sends Project URL + anon key → I fill `syncConfig.ts`, push, live-verify round-trip | 📍 Now — user homework, then I finish |

## Open decisions
- **App name** — folder `script-blackout` is a placeholder.

## Parked
- Per-Script font/size choice for the reader.
- Export/import a Script.
