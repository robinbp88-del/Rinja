-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  watch_id uuid references public.watches (id) on delete cascade,
  title text not null,
  body text not null,
  old_value text,
  new_value text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_unread_idx
  on public.notifications (user_id)
  where read = false;

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users insert own notifications" on public.notifications;

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);
