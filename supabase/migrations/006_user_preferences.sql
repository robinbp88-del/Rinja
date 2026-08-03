-- User email digest preferences

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_digest text not null default 'daily'
    check (email_digest in ('none', 'daily', 'immediate')),
  digest_last_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users read own preferences" on public.user_preferences;
drop policy if exists "Users insert own preferences" on public.user_preferences;
drop policy if exists "Users update own preferences" on public.user_preferences;

create policy "Users read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);
