-- Optional free-text mnemonics / association ideas per verse (app `verses.mnemonics`).
alter table public.verses
  add column if not exists mnemonics text;
