-- Real access control for /stats.
-- Run this ONCE in Supabase → SQL Editor after adding your email below.

-- 1. Admins allowlist
create table if not exists public.admins (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Only the caller who is themselves an admin can see their own row.
drop policy if exists admins_read_self on public.admins;
create policy admins_read_self on public.admins
  for select using (auth.email() = email);

-- 2. Fast admin check callable from the client
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where email = auth.email());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3. Tighten read policies on private tables to admins only.
-- The public site never reads sessions/events, so this is safe.
drop policy if exists sessions_read_all   on public.sessions;
drop policy if exists sessions_read_admin on public.sessions;
create policy sessions_read_admin on public.sessions
  for select using (public.is_admin());

drop policy if exists events_read_all   on public.events;
drop policy if exists events_read_admin on public.events;
create policy events_read_admin on public.events
  for select using (public.is_admin());

-- Reactions / counters / comments SELECT stays open — the public page
-- needs to read them.

-- 4. ⚠️ ADD YOUR EMAIL. Replace the string, uncomment, run.
-- insert into public.admins (email) values ('your@email.com');
