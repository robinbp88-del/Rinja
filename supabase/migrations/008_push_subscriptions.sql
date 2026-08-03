-- Web Push subscriptions (one row per browser/device endpoint)

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users read own push subs" on public.push_subscriptions;
drop policy if exists "Users upsert own push subs" on public.push_subscriptions;
drop policy if exists "Users update own push subs" on public.push_subscriptions;
drop policy if exists "Users delete own push subs" on public.push_subscriptions;

create policy "Users read own push subs"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users upsert own push subs"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users update own push subs"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users delete own push subs"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
