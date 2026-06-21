-- Cross-device sync for Script Practice — accountless, keyed by a secret "sync code".
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Security model: the client hashes the sync code (SHA-256) and only ever sends the HASH.
-- The table has RLS on with NO policies, so the public/anon key cannot read or write it directly.
-- The only way in is via the two SECURITY DEFINER functions below — and they require the hash,
-- which you can only produce if you know the code. So your data is reachable only with your code.

create table if not exists public.sync_vaults (
  code_hash  text primary key,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sync_vaults enable row level security;
-- (intentionally no policies → no direct anon access to the table)

-- Read the scripts stored under a code hash (empty array if none yet).
create or replace function public.sync_pull(p_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v jsonb;
begin
  if coalesce(length(p_hash), 0) < 32 then
    raise exception 'invalid code';
  end if;
  select data into v from public.sync_vaults where code_hash = p_hash;
  return coalesce(v, '[]'::jsonb);
end;
$$;

-- Upsert the scripts under a code hash; returns the new updated_at.
create or replace function public.sync_push(p_hash text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare v timestamptz;
begin
  if coalesce(length(p_hash), 0) < 32 then
    raise exception 'invalid code';
  end if;
  insert into public.sync_vaults (code_hash, data)
    values (p_hash, coalesce(p_data, '[]'::jsonb))
  on conflict (code_hash) do update
    set data = excluded.data, updated_at = now()
  returning updated_at into v;
  return v;
end;
$$;

-- Expose ONLY the two functions to the anonymous client; nothing else.
revoke all on function public.sync_pull(text) from public;
revoke all on function public.sync_push(text, jsonb) from public;
grant execute on function public.sync_pull(text) to anon, authenticated;
grant execute on function public.sync_push(text, jsonb) to anon, authenticated;
