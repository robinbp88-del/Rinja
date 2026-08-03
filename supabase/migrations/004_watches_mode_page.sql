-- Optional: allow explicit mode = 'page' in addition to element_tag marker.
-- App currently stores whole-page watches as mode='any' + element_tag='page'
-- so this is not required for the fix to work.

alter table public.watches drop constraint if exists watches_mode_check;

alter table public.watches
  add constraint watches_mode_check
  check (
    mode is null
    or mode in ('price', 'stock', 'text', 'image', 'any', 'custom', 'page')
  );
