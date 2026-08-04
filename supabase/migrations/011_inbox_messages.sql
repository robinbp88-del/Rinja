-- Admin → user inbox messages (promo / direct notes)

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'direct'
    check (kind in ('direct', 'broadcast', 'promo')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inbox_messages_recipient_created_idx
  on public.inbox_messages (recipient_user_id, created_at desc);

create index if not exists inbox_messages_recipient_unread_idx
  on public.inbox_messages (recipient_user_id)
  where read = false;

alter table public.inbox_messages enable row level security;

drop policy if exists "Users read own inbox messages" on public.inbox_messages;
create policy "Users read own inbox messages"
  on public.inbox_messages for select
  using (auth.uid() = recipient_user_id);

drop policy if exists "Users mark own inbox messages read" on public.inbox_messages;
create policy "Users mark own inbox messages read"
  on public.inbox_messages for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

-- Inserts go through service role (admin compose / broadcast).
