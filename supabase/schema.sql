-- Satluj movie site — Part B schema
-- Paste this into Supabase → SQL Editor → New query → Run.
-- Safe to run repeatedly (uses IF NOT EXISTS / CREATE OR REPLACE).

-- Extensions
create extension if not exists "uuid-ossp";

-- Anonymous visitor sessions.
create table if not exists public.sessions (
  id            uuid primary key,
  display_name  text,
  device        text,
  os            text,
  browser       text,
  language      text,
  timezone      text,
  country       text,
  country_code  text,
  region        text,
  city          text,
  ip            text,
  screen_w      int,
  screen_h      int,
  dpr           real,
  referrer      text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- Firehose of all UI events. Kept forever unless you add a TTL.
create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  type        text not null,
  data        jsonb,
  ts          timestamptz not null default now()
);
create index if not exists events_session_ts_idx on public.events (session_id, ts desc);
create index if not exists events_type_ts_idx    on public.events (type, ts desc);

-- One reaction per session; toggleable.
create table if not exists public.reactions (
  session_id  uuid primary key references public.sessions(id) on delete cascade,
  value       smallint not null check (value in (-1, 1)),
  updated_at  timestamptz not null default now()
);

-- Denormalized live counter for O(1) reads. Single row, id='reactions'.
create table if not exists public.counters (
  id      text primary key,
  likes   int not null default 0,
  dislikes int not null default 0
);
insert into public.counters (id, likes, dislikes)
values ('reactions', 0, 0)
on conflict (id) do nothing;

-- Auto-adjust counters when reactions change.
create or replace function public.tally_reactions()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.counters
       set likes    = likes    + case when new.value =  1 then 1 else 0 end,
           dislikes = dislikes + case when new.value = -1 then 1 else 0 end
     where id = 'reactions';
  elsif (tg_op = 'UPDATE') then
    update public.counters
       set likes    = likes
                      - case when old.value =  1 then 1 else 0 end
                      + case when new.value =  1 then 1 else 0 end,
           dislikes = dislikes
                      - case when old.value = -1 then 1 else 0 end
                      + case when new.value = -1 then 1 else 0 end
     where id = 'reactions';
  elsif (tg_op = 'DELETE') then
    update public.counters
       set likes    = likes    - case when old.value =  1 then 1 else 0 end,
           dislikes = dislikes - case when old.value = -1 then 1 else 0 end
     where id = 'reactions';
  end if;
  return null;
end $$;

drop trigger if exists tally_reactions_trg on public.reactions;
create trigger tally_reactions_trg
after insert or update or delete on public.reactions
for each row execute function public.tally_reactions();

-- Auto-published comments.
create table if not exists public.comments (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  display_name  text not null,
  body          text not null check (char_length(body) between 1 and 2000),
  created_at    timestamptz not null default now()
);
create index if not exists comments_created_idx on public.comments (created_at desc);

-- Row Level Security
alter table public.sessions  enable row level security;
alter table public.events    enable row level security;
alter table public.reactions enable row level security;
alter table public.comments  enable row level security;
alter table public.counters  enable row level security;

-- Anon can upsert their own session (id is the visitor UUID they mint locally).
drop policy if exists sessions_read_all      on public.sessions;
drop policy if exists sessions_insert_own    on public.sessions;
drop policy if exists sessions_update_own    on public.sessions;
create policy sessions_read_all   on public.sessions for select using (true);
create policy sessions_insert_own on public.sessions for insert with check (true);
create policy sessions_update_own on public.sessions for update using (true) with check (true);

-- Anon can insert their events; reads open for now (tighten later if desired).
drop policy if exists events_read_all   on public.events;
drop policy if exists events_insert_own on public.events;
create policy events_read_all   on public.events for select using (true);
create policy events_insert_own on public.events for insert with check (true);

-- Anon can upsert their own reaction and see all reactions.
drop policy if exists reactions_read_all      on public.reactions;
drop policy if exists reactions_insert_own    on public.reactions;
drop policy if exists reactions_update_own    on public.reactions;
drop policy if exists reactions_delete_own    on public.reactions;
create policy reactions_read_all   on public.reactions for select using (true);
create policy reactions_insert_own on public.reactions for insert with check (true);
create policy reactions_update_own on public.reactions for update using (true) with check (true);
create policy reactions_delete_own on public.reactions for delete using (true);

-- Comments: anyone can read + insert; no edit/delete.
drop policy if exists comments_read_all   on public.comments;
drop policy if exists comments_insert_own on public.comments;
create policy comments_read_all   on public.comments for select using (true);
create policy comments_insert_own on public.comments for insert with check (true);

-- Counters: read-only for anon (trigger maintains them).
drop policy if exists counters_read_all on public.counters;
create policy counters_read_all on public.counters for select using (true);

-- Enable realtime broadcasting on the tables the client subscribes to.
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.counters;
alter publication supabase_realtime add table public.comments;
