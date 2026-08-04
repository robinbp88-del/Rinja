-- Admin analytics: search log + last-seen activity

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  query text not null,
  created_at timestamptz not null default now()
);

create index if not exists search_events_created_at_idx
  on public.search_events (created_at desc);

create index if not exists search_events_user_id_idx
  on public.search_events (user_id);

alter table public.search_events enable row level security;

-- Users can insert their own search rows; reads are service-role / admin only.
drop policy if exists "Users insert own search events" on public.search_events;
create policy "Users insert own search events"
  on public.search_events for insert
  with check (auth.uid() = user_id);

create table if not exists public.user_activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_activity enable row level security;

drop policy if exists "Users upsert own activity" on public.user_activity;
drop policy if exists "Users update own activity" on public.user_activity;
drop policy if exists "Users insert own activity" on public.user_activity;
drop policy if exists "Users read own activity" on public.user_activity;

create policy "Users read own activity"
  on public.user_activity for select
  using (auth.uid() = user_id);

create policy "Users insert own activity"
  on public.user_activity for insert
  with check (auth.uid() = user_id);

create policy "Users update own activity"
  on public.user_activity for update
  using (auth.uid() = user_id);
