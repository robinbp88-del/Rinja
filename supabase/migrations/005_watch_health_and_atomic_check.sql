-- Watch health + locking + atomic check apply (private beta P0)

-- 1) Health / lock columns on watches
alter table public.watches
  add column if not exists previous_value text,
  add column if not exists last_attempted_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_error_code text,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists check_status text not null default 'pending',
  add column if not exists baseline_pending boolean not null default false,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

alter table public.watches drop constraint if exists watches_check_status_check;
alter table public.watches
  add constraint watches_check_status_check
  check (
    check_status in (
      'pending',
      'ok',
      'changed',
      'error',
      'unsupported',
      'blocked'
    )
  );

-- Backfill: page watches without a fingerprint are baseline-pending
update public.watches
set baseline_pending = true
where (
  mode = 'page'
  or element_tag = 'page'
)
and (current_value is null or btrim(current_value) = '');

-- 2) Idempotent notifications
alter table public.notifications
  add column if not exists dedupe_key text;

-- NULL dedupe_keys allowed multiple times; non-null must be unique
create unique index if not exists notifications_dedupe_key_uidx
  on public.notifications (dedupe_key);

-- 3) Claim due watches (lease + SKIP LOCKED)
create or replace function public.claim_due_watches(
  p_limit integer default 25,
  p_worker text default 'worker',
  p_lease_seconds integer default 120,
  p_force boolean default false
)
returns setof public.watches
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.watches w
  set
    locked_at = now(),
    locked_by = p_worker,
    last_attempted_at = now()
  where w.id in (
    select c.id
    from public.watches c
    where c.paused = false
      and (
        c.locked_at is null
        or c.locked_at < now() - make_interval(secs => greatest(p_lease_seconds, 30))
      )
      and (
        p_force
        or c.last_checked is null
        or c.last_checked <= now() - case coalesce(c.frequency, '15m')
          when '5m' then interval '5 minutes'
          when '15m' then interval '15 minutes'
          when '1h' then interval '1 hour'
          when '6h' then interval '6 hours'
          when '1d' then interval '1 day'
          else interval '15 minutes'
        end
      )
    order by c.last_checked asc nulls first
    limit greatest(p_limit, 1)
    for update skip locked
  )
  returning w.*;
end;
$$;

revoke all on function public.claim_due_watches(integer, text, integer, boolean) from public;
grant execute on function public.claim_due_watches(integer, text, integer, boolean) to service_role;

-- 4) Atomic apply of one check outcome
create or replace function public.apply_watch_check_result(
  p_watch_id uuid,
  p_outcome text,
  p_new_value text default null,
  p_error_code text default null,
  p_error_message text default null,
  p_notify boolean default true,
  p_title text default null,
  p_body text default null,
  p_dedupe_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_watch public.watches%rowtype;
  v_notified boolean := false;
begin
  if p_outcome not in ('baseline', 'unchanged', 'changed', 'error') then
    raise exception 'invalid outcome: %', p_outcome;
  end if;

  select * into v_watch
  from public.watches
  where id = p_watch_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'watch_not_found');
  end if;

  if p_outcome = 'baseline' then
    update public.watches
    set
      previous_value = current_value,
      current_value = p_new_value,
      last_checked = now(),
      last_success_at = now(),
      updated_at = now(),
      baseline_pending = false,
      check_status = 'ok',
      last_error = null,
      last_error_code = null,
      consecutive_failures = 0,
      locked_at = null,
      locked_by = null
    where id = p_watch_id;

    return jsonb_build_object('ok', true, 'outcome', 'baseline', 'notified', false);
  end if;

  if p_outcome = 'unchanged' then
    update public.watches
    set
      last_checked = now(),
      last_success_at = now(),
      updated_at = now(),
      check_status = 'ok',
      last_error = null,
      last_error_code = null,
      consecutive_failures = 0,
      locked_at = null,
      locked_by = null
    where id = p_watch_id;

    return jsonb_build_object('ok', true, 'outcome', 'unchanged', 'notified', false);
  end if;

  if p_outcome = 'error' then
    update public.watches
    set
      last_checked = now(),
      updated_at = now(),
      check_status = case
        when p_error_code in ('http_403', 'http_429', 'blocked') then 'blocked'
        when p_error_code in ('js_shell', 'empty_html', 'unsupported') then 'unsupported'
        else 'error'
      end,
      last_error = left(coalesce(p_error_message, 'Check failed'), 500),
      last_error_code = p_error_code,
      consecutive_failures = coalesce(consecutive_failures, 0) + 1,
      locked_at = null,
      locked_by = null
    where id = p_watch_id;

    return jsonb_build_object('ok', true, 'outcome', 'error', 'notified', false);
  end if;

  -- changed
  update public.watches
  set
    previous_value = current_value,
    current_value = p_new_value,
    last_checked = now(),
    last_success_at = now(),
    updated_at = now(),
    baseline_pending = false,
    check_status = 'changed',
    last_error = null,
    last_error_code = null,
    consecutive_failures = 0,
    locked_at = null,
    locked_by = null
  where id = p_watch_id;

  if p_notify and p_title is not null and p_body is not null then
    begin
      insert into public.notifications (
        user_id,
        watch_id,
        title,
        body,
        old_value,
        new_value,
        read,
        dedupe_key
      )
      values (
        v_watch.user_id,
        p_watch_id,
        p_title,
        p_body,
        v_watch.current_value,
        p_new_value,
        false,
        nullif(p_dedupe_key, '')
      );
      v_notified := true;
    exception
      when unique_violation then
        v_notified := false;
    end;
  end if;

  return jsonb_build_object(
    'ok', true,
    'outcome', 'changed',
    'notified', v_notified
  );
end;
$$;

revoke all on function public.apply_watch_check_result(uuid, text, text, text, text, boolean, text, text, text) from public;
grant execute on function public.apply_watch_check_result(uuid, text, text, text, text, boolean, text, text, text) to service_role;
