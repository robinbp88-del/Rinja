-- Email sending is not enabled yet; default to in-app only.
alter table public.user_preferences
  alter column email_digest set default 'none';

update public.user_preferences
set email_digest = 'none'
where email_digest in ('daily', 'immediate');
