# Script Practice — Context

This file defines the language for the script-practice app — a tool for memorizing scripts by reading them over and over while progressively blacking out words. It is a glossary only; it holds no implementation detail.

## Language

**Script**:
One piece of text the user pastes in to memorize and rehearse. The core unit of the app.
_Avoid_: Document, doc, passage, page

**Library**:
The user's full collection of Scripts.
_Avoid_: List, folder, files

**Title**:
The first line of a Script, shown as a large heading and used as the Script's name in the Library (macOS Notes style). It is never blacked out.
_Avoid_: Name, heading, label

**Speaker**:
A labelled voice in a dialogue Script, set by a "Name:" prefix at the start of a line (You:, Them:, Rep:…). "You" and "Me" are the user's own Speaker; only their lines are eligible to be blacked out.
_Avoid_: Character, role, part

**Cue line**:
A line belonging to another Speaker (not You/Me). It stays fully visible and is never blacked out — it prompts recall of the user's own next line. (A Script with no Speaker labels at all is treated as entirely the user's own lines.)
_Avoid_: Their line, prompt, other part

**Read**:
One completed pass through a Script, confirmed by the user when they have read it all the way through. Reads are what the app counts.
_Avoid_: Attempt, rep, run, session, practice

**Blackout**:
A single word in a Script that is currently hidden behind a black bar, so it must be recalled from memory.
_Avoid_: Redaction, blank, mask, hidden word

**Round**:
One memorization cycle for a Script — it begins with no Blackouts and grows by one Blackout per Read until the whole Script is hidden, after which a Reset starts the next Round.
_Avoid_: Cycle, level, pass, attempt

**Reset**:
Clearing all current Blackouts on a Script back to zero to begin a new Round, while preserving the Read count and High score.
_Avoid_: Clear, restart, wipe, start over

**Read count**:
The lifetime total number of Reads recorded for a Script; it never resets.
_Avoid_: Counter, total, tally

**High score**:
The greatest number of Blackouts the user has ever reached on a Script — the furthest they got before a Reset. It survives Resets.
_Avoid_: Personal best, record, max, top score
