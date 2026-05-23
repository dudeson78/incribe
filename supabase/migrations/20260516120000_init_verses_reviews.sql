-- Run in Supabase SQL Editor or via Supabase CLI linked project.
-- App startup uses anonymous sign-in until you add email/OAuth: enable it under
-- Dashboard → Authentication → Providers → Anonymous sign-ins.
-- Tables: verses, review_schedule, review_logs

create extension if not exists "pgcrypto";

create table public.verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null,
  text text not null,
  rema text,
  verse_group text not null check (verse_group in ('short', 'long')),
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index if not exists verses_user_id_idx on public.verses (user_id);

create table public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  verse_id uuid not null references public.verses (id) on delete cascade,
  next_review_date date not null,
  current_interval_days integer not null default 1 check (current_interval_days >= 1),
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  review_phase text not null check (review_phase in ('short', 'long')),
  short_success_count integer not null default 0 check (short_success_count >= 0 and short_success_count <= 7),
  long_success_count integer not null default 0 check (long_success_count >= 0),
  constraint review_schedule_verse_id_key unique (verse_id)
);

create index if not exists review_schedule_next_date_idx on public.review_schedule (next_review_date);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  verse_id uuid not null references public.verses (id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  success boolean not null,
  count_in_session smallint check (
    count_in_session is null
    or (count_in_session >= 1 and count_in_session <= 7)
  )
);

create index if not exists review_logs_verse_id_idx on public.review_logs (verse_id);

alter table public.verses enable row level security;
alter table public.review_schedule enable row level security;
alter table public.review_logs enable row level security;

create policy "verses_select_own" on public.verses for select using (auth.uid() = user_id);
create policy "verses_insert_own" on public.verses for insert with check (auth.uid() = user_id);
create policy "verses_update_own" on public.verses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "verses_delete_own" on public.verses for delete using (auth.uid() = user_id);

create policy "review_schedule_all_own_verse" on public.review_schedule for all
  using (
    exists (select 1 from public.verses v where v.id = verse_id and v.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.verses v where v.id = verse_id and v.user_id = auth.uid())
  );

create policy "review_logs_all_own_verse" on public.review_logs for all
  using (
    exists (select 1 from public.verses v where v.id = verse_id and v.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.verses v where v.id = verse_id and v.user_id = auth.uid())
  );
