-- Owner-scoped RLS for watches (required for public beta)
-- Run in Supabase SQL Editor after deploying this migration.

alter table public.watches enable row level security;

drop policy if exists "Users select own watches" on public.watches;
drop policy if exists "Users insert own watches" on public.watches;
drop policy if exists "Users update own watches" on public.watches;
drop policy if exists "Users delete own watches" on public.watches;

create policy "Users select own watches"
  on public.watches for select
  using (auth.uid() = user_id);

create policy "Users insert own watches"
  on public.watches for insert
  with check (auth.uid() = user_id);

create policy "Users update own watches"
  on public.watches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own watches"
  on public.watches for delete
  using (auth.uid() = user_id);
