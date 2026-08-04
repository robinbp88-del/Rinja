-- Beta support inbox: user reports + admin replies

create table if not exists public.beta_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  path text,
  status text not null default 'open'
    check (status in ('open', 'replied', 'closed')),
  admin_reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists beta_reports_created_at_idx
  on public.beta_reports (created_at desc);

create index if not exists beta_reports_user_id_idx
  on public.beta_reports (user_id);

create index if not exists beta_reports_status_idx
  on public.beta_reports (status);

alter table public.beta_reports enable row level security;

drop policy if exists "Users insert own beta reports" on public.beta_reports;
create policy "Users insert own beta reports"
  on public.beta_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own beta reports" on public.beta_reports;
create policy "Users read own beta reports"
  on public.beta_reports for select
  using (auth.uid() = user_id);

-- Updates (admin replies) go through service role only — no user UPDATE policy.
