-- 장기 간격: 1번째 검사 성공 후 7일, 2번째 후 14일, 3번째 후 28일 … (7×2^(n-1))

alter table public.review_schedule
  add column if not exists long_success_count integer not null default 0
  check (long_success_count >= 0);

comment on column public.review_schedule.long_success_count is
  'Cumulative successful long-track reviews (1-based tier for spacing: next gap = 7 * 2^(count-1) after success).';
