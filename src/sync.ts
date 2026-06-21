import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Script } from './types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './syncConfig'

export function isSyncConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
}

let client: SupabaseClient | null = null
function getClient(): SupabaseClient | null {
  if (!isSyncConfigured()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  }
  return client
}

/** Codes are case/dash-insensitive — normalize before hashing so "abcd-ef" === "ABCDEF". */
function normalize(code: string): string {
  return code.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function isValidCode(code: string): boolean {
  return normalize(code).length >= 12
}

async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalize(code))
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** A fresh high-entropy sync code, grouped for readability, e.g. ABCD-EFGH-JKMN-PQRS. */
export function generateCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I/L
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let s = ''
  for (const b of bytes) s += alphabet[b % alphabet.length]
  return (s.match(/.{1,4}/g) ?? [s]).join('-')
}

export async function pull(code: string): Promise<Script[]> {
  const sb = getClient()
  if (!sb) throw new Error('sync not configured')
  const { data, error } = await sb.rpc('sync_pull', { p_hash: await hashCode(code) })
  if (error) throw error
  return (data as Script[] | null) ?? []
}

export async function push(code: string, scripts: Script[]): Promise<void> {
  const sb = getClient()
  if (!sb) throw new Error('sync not configured')
  const { error } = await sb.rpc('sync_push', { p_hash: await hashCode(code), p_data: scripts })
  if (error) throw error
}

/**
 * Merge two script sets by id, keeping the version with the later updatedAt (ties favour `local`).
 * Handles adds + edits across devices. (Deletes aren't tracked yet — a script deleted on one
 * device can reappear from the other's copy until deleted there too.)
 */
export function mergeScripts(local: Script[], remote: Script[]): Script[] {
  const byId = new Map<string, Script>()
  for (const s of [...local, ...remote]) {
    const ex = byId.get(s.id)
    if (!ex || (s.updatedAt ?? 0) > (ex.updatedAt ?? 0)) byId.set(s.id, s)
  }
  return [...byId.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}
