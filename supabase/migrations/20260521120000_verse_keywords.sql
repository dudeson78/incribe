-- Optional comma-separated phrases for blank-drill mode (see app `verses.keywords`).
alter table public.verses
  add column if not exists keywords text;
