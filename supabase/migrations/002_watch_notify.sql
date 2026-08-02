-- Run in Supabase SQL Editor

alter table public.watches
  add column if not exists notify boolean not null default true;
