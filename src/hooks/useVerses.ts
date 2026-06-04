import {
  addDays,
  addMinutes,
  format,
  getYear,
  parseISO,
  startOfDay,
  subHours,
} from 'date-fns';
import { useMemo } from 'react';

import { supabase } from '../supabase/client';
import type {
  AddVerseInput,
  ReviewLogRow,
  ReviewPhase,
  ReviewScheduleRow,
  UpdateScheduleInput,
  UpdateVerseInput,
  VerseRow,
  VerseWithSchedule,
} from '../types/verses';

function ymd(d: Date): string {
  return format(startOfDay(d), 'yyyy-MM-dd');
}

function normalizeSchedule(
  row: VerseWithSchedule
): ReviewScheduleRow | null {
  const s = row.review_schedule;
  if (!s) return null;
  return Array.isArray(s) ? s[0] ?? null : s;
}

type SchedulePatch = {
  next_review_date: string;
  current_interval_days: number;
  consecutive_failures: number;
  review_phase: ReviewPhase;
  short_success_count: number;
  long_success_count: number;
};

/**
 * 장기 트랙 — 단계형 간격 (`long_success_count`):
 * - 단기 종료 직후: 첫 검사는 `오늘+7일`, `long_success_count=0`.
 * - 장기 검사 성공 후 `long_success_count`를 1씩 증가시키고, 다음 간격은 `7 × 2^( streak - 1 )`일
 *   (1단계 뒤 7일 → 2단계 뒤 14일 → 28일 …). 첫 검사 후 다시 짧게 7일을 두 번째로 진행 가능.
 * - 실패 후 교정·3회 패널티(반으로, 최소 7일)는 기존대로.
 */
function halveLongIntervalDays(intervalDays: number): number {
  return Math.max(7, Math.floor(intervalDays / 2));
}

function computeAfterReview(
  schedule: ReviewScheduleRow,
  success: boolean,
  now: Date = new Date()
): { count_in_session: number | null; next: SchedulePatch } {
  const today = startOfDay(now);
  const todayStr = format(today, 'yyyy-MM-dd');

  if (schedule.review_phase === 'short') {
    /** 장기 검사 미달 후 7회 암송 교정 — 일반 단기 진도와 무관하게 별도 함수로 처리해야 함 */
    if (schedule.current_interval_days > 1) {
      throw new Error('Remedial short track: use completeLongRemediation');
    }

    const slot = Math.min(schedule.short_success_count + 1, 7);

    if (success) {
      const newShortCount = schedule.short_success_count + 1;
      if (newShortCount >= 7) {
        return {
          count_in_session: 7,
          next: {
            review_phase: 'long',
            short_success_count: 7,
            current_interval_days: 7,
            consecutive_failures: 0,
            long_success_count: 0,
            next_review_date: format(addDays(today, 7), 'yyyy-MM-dd'),
          },
        };
      }
      return {
        count_in_session: slot,
        next: {
          review_phase: 'short',
          short_success_count: newShortCount,
          current_interval_days: 1,
          consecutive_failures: 0,
          long_success_count: schedule.long_success_count ?? 0,
          next_review_date: format(addDays(today, 1), 'yyyy-MM-dd'),
        },
      };
    }

    return {
      count_in_session: slot,
      next: {
        review_phase: 'short',
        short_success_count: schedule.short_success_count,
        current_interval_days: 1,
        consecutive_failures: schedule.consecutive_failures,
        long_success_count: schedule.long_success_count ?? 0,
        next_review_date: format(addDays(today, 1), 'yyyy-MM-dd'),
      },
    };
  }

  /** === 장기 검사 결과 === */
  const interval = schedule.current_interval_days;
  const lc = schedule.long_success_count ?? 0;

  if (success) {
    const streak = lc + 1;
    /** 1회 검사 성공 후 7일, 2회 후 14일, 3회 후 28일 … */
    const nextGapDays = 7 * 2 ** (streak - 1);
    return {
      count_in_session: null,
      next: {
        review_phase: 'long',
        short_success_count: schedule.short_success_count,
        current_interval_days: nextGapDays,
        consecutive_failures: 0,
        long_success_count: streak,
        next_review_date: format(addDays(today, nextGapDays), 'yyyy-MM-dd'),
      },
    };
  }

  /** 장기 검사 실패 → 교정 세션 진입 (`short` 유지 하나 `interval_days`는 현재 간격 표시용) */
  let failures = schedule.consecutive_failures + 1;
  let retainedInterval = interval;
  if (failures >= 3) {
    retainedInterval = halveLongIntervalDays(interval);
    failures = 0;
  }

  return {
    count_in_session: null,
    next: {
      review_phase: 'short',
      short_success_count: 0,
      current_interval_days: retainedInterval,
      consecutive_failures: failures,
      long_success_count: lc,
      next_review_date: todayStr,
    },
  };
}

async function requireUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  if (sessionUser) {
    return sessionUser;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user;
}

async function addVerse(input: AddVerseInput): Promise<VerseRow> {
  const user = await requireUser();
  const today = ymd(new Date());

  const { data: verse, error: verseError } = await supabase
    .from('verses')
    .insert({
      user_id: user.id,
      reference: input.reference,
      text: input.text,
      rema: input.rema ?? null,
      keywords: input.keywords ?? null,
      mnemonics: input.mnemonics ?? null,
      verse_group: input.verse_group,
    })
    .select()
    .single();

  if (verseError) throw verseError;
  if (!verse) throw new Error('Insert failed');

  const { error: schedError } = await supabase.from('review_schedule').insert({
    verse_id: verse.id,
    next_review_date: today,
    current_interval_days: 1,
    consecutive_failures: 0,
    review_phase: 'short',
    short_success_count: 0,
    long_success_count: 0,
  });

  if (schedError) throw schedError;

  return verse;
}

async function updateVerse(
  verseId: string,
  updates: UpdateVerseInput
): Promise<VerseRow> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('verses')
    .update(updates)
    .eq('id', verseId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Verse not found');
  return data;
}

async function deleteVerse(verseId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await supabase
    .from('verses')
    .delete()
    .eq('id', verseId)
    .eq('user_id', user.id);

  if (error) throw error;
}

async function getAllVerses(): Promise<VerseWithSchedule[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('verses')
    .select('*, review_schedule(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function getReviewLogsForVerseIds(
  verseIds: string[],
): Promise<Record<string, ReviewLogRow[]>> {
  const byId: Record<string, ReviewLogRow[]> = {};
  if (verseIds.length === 0) return byId;
  await requireUser();
  for (const id of verseIds) byId[id] = [];

  const { data, error } = await supabase
    .from('review_logs')
    .select('*')
    .in('verse_id', verseIds)
    .order('verse_id')
    .order('reviewed_at', { ascending: true });

  if (error) throw error;
  for (const row of data ?? []) {
    const r = row as ReviewLogRow;
    const list = byId[r.verse_id];
    if (list) list.push(r);
    else byId[r.verse_id] = [r];
  }
  return byId;
}

async function logReview(verseId: string, success: boolean): Promise<void> {
  const user = await requireUser();

  const { data: verse, error: verseError } = await supabase
    .from('verses')
    .select('id, user_id')
    .eq('id', verseId)
    .eq('user_id', user.id)
    .single();

  if (verseError || !verse) throw new Error('Verse not found');

  const { data: scheduleRow, error: schedErr } = await supabase
    .from('review_schedule')
    .select('*')
    .eq('verse_id', verseId)
    .single();

  if (schedErr || !scheduleRow) throw new Error('Schedule not found');

  if (
    scheduleRow.review_phase === 'short' &&
    scheduleRow.current_interval_days > 1
  ) {
    throw new Error(
      'Remedial session: tap “Done” after 7 reps; do not record as daily progress'
    );
  }

  const { count_in_session, next } = computeAfterReview(scheduleRow, success);

  const { error: logError } = await supabase.from('review_logs').insert({
    verse_id: verseId,
    success,
    count_in_session,
  });

  if (logError) throw logError;

  const legacySchedulePatch = {
    next_review_date: next.next_review_date,
    current_interval_days: next.current_interval_days,
    consecutive_failures: next.consecutive_failures,
    review_phase: next.review_phase,
    short_success_count: next.short_success_count,
  };

  const { error: updErr } = await supabase
    .from('review_schedule')
    .update({
      ...legacySchedulePatch,
      long_success_count: next.long_success_count,
    })
    .eq('verse_id', verseId);

  if (updErr) {
    const { error: legacyErr } = await supabase
      .from('review_schedule')
      .update(legacySchedulePatch)
      .eq('verse_id', verseId);
    if (legacyErr) throw legacyErr;
  }
}

async function completeLongRemediation(verseId: string): Promise<void> {
  const user = await requireUser();

  const { data: verse, error: verseError } = await supabase
    .from('verses')
    .select('id')
    .eq('id', verseId)
    .eq('user_id', user.id)
    .single();

  if (verseError || !verse) throw new Error('Verse not found');

  const { data: scheduleRow, error: schedErr } = await supabase
    .from('review_schedule')
    .select('*')
    .eq('verse_id', verseId)
    .single();

  if (schedErr || !scheduleRow) throw new Error('Schedule not found');

  if (
    scheduleRow.review_phase !== 'short' ||
    scheduleRow.current_interval_days <= 1
  ) {
    throw new Error('Not in long remediation');
  }

  const interval = scheduleRow.current_interval_days;
  const today = startOfDay(new Date());

  const { error: updErr } = await supabase
    .from('review_schedule')
    .update({
      review_phase: 'long',
      short_success_count: 7,
      next_review_date: format(addDays(today, interval), 'yyyy-MM-dd'),
    })
    .eq('verse_id', verseId);

  if (updErr) throw updErr;
}

export type ScheduledRow = {
  schedule: ReviewScheduleRow;
  verse: VerseRow;
  /**
   * 현지 오늘 날짜에 이 구절로 성공 복습 로그(count_in_session)가 남음.
   * 스케줄이 다음날 이후로 넘어가도 홈 목록에는 당일 훈련 구절로 남김.
   */
  todaySessionRecordedSuccess?: boolean;
  /** `review_logs` 중 해당 구절의 가장 최근 `reviewed_at`(ISO 문자열). 없으면 미연습 표시용 */
  lastPracticedAtIso?: string | null;
};

/** 홈·훈련카드 공통: 단기 일반 → 재연습 단기 → 장기 */
export function partitionScheduledForHomeGroupedReview(items: ScheduledRow[]): {
  remedialRows: ScheduledRow[];
  genuineShortRows: ScheduledRow[];
  longRows: ScheduledRow[];
} {
  const remedialRows = items.filter(
    (r) =>
      r.schedule.review_phase === 'short' &&
      r.schedule.current_interval_days > 1,
  );
  const genuineShortRows = items.filter(
    (r) =>
      r.schedule.review_phase === 'short' &&
      r.schedule.current_interval_days === 1,
  );
  const longRows = items.filter((r) => r.schedule.review_phase === 'long');
  return { remedialRows, genuineShortRows, longRows };
}

function sortScheduledBucketNewTodayLast(bucket: ScheduledRow[]): ScheduledRow[] {
  const todayStr = ymd(new Date());
  const notNewToday: ScheduledRow[] = [];
  const createdToday: ScheduledRow[] = [];
  for (const r of bucket) {
    const createdDay = ymd(parseISO(r.verse.created_at));
    (createdDay === todayStr ? createdToday : notNewToday).push(r);
  }
  const cmpRef = (a: ScheduledRow, b: ScheduledRow) =>
    a.verse.reference.localeCompare(b.verse.reference, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  notNewToday.sort(cmpRef);
  createdToday.sort(cmpRef);
  return [...notNewToday, ...createdToday];
}

/**
 * 오늘 훈련 목록 순서 (`getScheduledToday`·홈 그룹·훈련카드 동일).
 * 같은 구역(단기 일반·재연습 단기·장기) 안에서는 참조 순, 당일 새로 저장한 구절은 해당 구역 맨 뒤.
 */
export function orderTodayScheduledRows(rows: ScheduledRow[]): ScheduledRow[] {
  const { genuineShortRows, remedialRows, longRows } =
    partitionScheduledForHomeGroupedReview(rows);
  return [
    ...sortScheduledBucketNewTodayLast(genuineShortRows),
    ...sortScheduledBucketNewTodayLast(remedialRows),
    ...sortScheduledBucketNewTodayLast(longRows),
  ];
}

export function sortScheduledForMemorizeOrder(
  rows: ScheduledRow[],
): ScheduledRow[] {
  return orderTodayScheduledRows(rows);
}

async function fetchVerseIdsLoggedSuccessToday(userIdStr: string): Promise<Set<string>> {
  const todayStr = ymd(new Date());
  const windowStart = subHours(new Date(), 72).toISOString();

  const { data, error } = await supabase
    .from('review_logs')
    .select('verse_id, reviewed_at')
    .eq('success', true)
    .gte('reviewed_at', windowStart);

  if (error) throw error;

  const verseIdsSeen = new Set<string>();
  for (const row of data ?? []) {
    const r = row as { verse_id?: string | null; reviewed_at?: string | null };
    if (!r.verse_id || !r.reviewed_at) continue;
    if (ymd(parseISO(r.reviewed_at)) !== todayStr) continue;
    verseIdsSeen.add(r.verse_id);
  }

  if (verseIdsSeen.size === 0) return new Set<string>();

  const { data: verses, error: vErr } = await supabase
    .from('verses')
    .select('id')
    .eq('user_id', userIdStr)
    .eq('is_active', true)
    .in('id', [...verseIdsSeen]);

  if (vErr) throw vErr;

  const allowed = new Set((verses ?? []).map((v) => v.id as string));
  return new Set([...verseIdsSeen].filter((id) => allowed.has(id)));
}

/** 오늘 훈련 목록에 쓰이는 구절들 각각 최신 연습 로그 시각(max reviewed_at ISO) */
async function fetchLatestReviewAtPerVerse(
  verseIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(verseIds)];
  if (unique.length === 0) return map;
  await requireUser();

  const { data, error } = await supabase
    .from('review_logs')
    .select('verse_id, reviewed_at')
    .in('verse_id', unique);

  if (error) throw error;
  for (const row of data ?? []) {
    const r = row as { verse_id?: string | null; reviewed_at?: string | null };
    if (!r.verse_id || !r.reviewed_at) continue;
    const prev = map.get(r.verse_id);
    if (!prev || r.reviewed_at > prev) map.set(r.verse_id, r.reviewed_at);
  }
  return map;
}

async function attachLatestPracticeTimestamps(
  rows: ScheduledRow[],
): Promise<ScheduledRow[]> {
  const ids = rows.map((r) => r.verse.id);
  const latest = await fetchLatestReviewAtPerVerse(ids);
  return rows.map((r) => ({
    ...r,
    lastPracticedAtIso: latest.get(r.verse.id) ?? null,
  }));
}

async function getScheduledToday(): Promise<ScheduledRow[]> {
  const user = await requireUser();
  const todayStr = ymd(new Date());

  const successTodayIds = await fetchVerseIdsLoggedSuccessToday(user.id);

  const { data, error } = await supabase
    .from('review_schedule')
    .select('*, verses!inner(*)')
    .eq('verses.user_id', user.id)
    .eq('verses.is_active', true)
    .lte('next_review_date', todayStr);

  if (error) throw error;

  const dueOrdered: ScheduledRow[] = [];
  for (const row of data ?? []) {
    const r = row as ReviewScheduleRow & { verses: VerseRow | VerseRow[] };
    const { verses, ...sched } = r;
    const verse = Array.isArray(verses) ? verses[0]! : verses;
    dueOrdered.push({
      verse,
      schedule: sched as ReviewScheduleRow,
      todaySessionRecordedSuccess: successTodayIds.has(verse.id),
    });
  }

  const dueIdSet = new Set(dueOrdered.map((row) => row.verse.id));
  const missingIds = [...successTodayIds].filter((vid) => !dueIdSet.has(vid));

  if (missingIds.length === 0) {
    return attachLatestPracticeTimestamps(orderTodayScheduledRows(dueOrdered));
  }

  const { data: schedExtra, error: eErr } = await supabase
    .from('review_schedule')
    .select('*, verses!inner(*)')
    .in('verse_id', missingIds)
    .eq('verses.user_id', user.id)
    .eq('verses.is_active', true);

  if (eErr) throw eErr;

  const appended: ScheduledRow[] = [];
  for (const row of schedExtra ?? []) {
    const r = row as ReviewScheduleRow & { verses: VerseRow | VerseRow[] };
    const { verses, ...sched } = r;
    const verse = Array.isArray(verses) ? verses[0]! : verses;
    appended.push({
      verse,
      schedule: sched as ReviewScheduleRow,
      todaySessionRecordedSuccess: true,
    });
  }
  return attachLatestPracticeTimestamps(
    orderTodayScheduledRows([...dueOrdered, ...appended]),
  );
}

export type DashboardSummary = {
  goalTarget: number;
  versesThisYear: number;
  doneToday: number;
  dueToday: number;
};

async function getDashboardSummary(
  goalTarget: number = 52,
  scheduledRows?: ScheduledRow[]
): Promise<DashboardSummary> {
  const user = await requireUser();
  const year = getYear(new Date());

  const { data: verseRows, error: vErr } = await supabase
    .from('verses')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (vErr) throw vErr;

  const versesThisYear =
    verseRows?.filter((v) => getYear(parseISO(v.created_at)) === year)
      .length ?? 0;

  const due =
    scheduledRows !== undefined
      ? scheduledRows
      : await getScheduledToday();

  const windowStart = subHours(new Date(), 36).toISOString();
  const { data: logs, error: lErr } = await supabase
    .from('review_logs')
    .select('reviewed_at')
    .eq('success', true)
    .gte('reviewed_at', windowStart);

  if (lErr) throw lErr;

  const todayStr = ymd(new Date());
  const doneToday =
    logs?.filter((l) => ymd(parseISO(l.reviewed_at)) === todayStr).length ?? 0;

  return {
    goalTarget,
    versesThisYear,
    doneToday,
    dueToday: due.filter((r) => !(r.todaySessionRecordedSuccess ?? false)).length,
  };
}

/**
 * 활성 구절 전부: 복습 일정을 처음 저장한 직후와 같이 되돌리고 `review_logs`를 비웁니다.
 * (단기 0/7·오늘 복습, 장기 구간·실패 카운트 초기화 — 프로그램 테스트용)
 * @returns 활성 구절 id 수(스케줄 행 유무와 관계없이 대상을 정한 규모)
 */
async function resetAllPracticeToNewVerseState(): Promise<number> {
  const user = await requireUser();
  const today = ymd(new Date());

  const { data: verses, error: vErr } = await supabase
    .from('verses')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (vErr) throw vErr;

  const ids = (verses ?? []).map((v) => v.id);
  if (ids.length === 0) return 0;

  const { error: delErr } = await supabase
    .from('review_logs')
    .delete()
    .in('verse_id', ids);

  if (delErr) throw delErr;

  const legacyPatch = {
    next_review_date: today,
    current_interval_days: 1,
    consecutive_failures: 0,
    review_phase: 'short' as const,
    short_success_count: 0,
  };

  const { error: updErr } = await supabase
    .from('review_schedule')
    .update({ ...legacyPatch, long_success_count: 0 })
    .in('verse_id', ids);

  if (updErr) {
    const { error: retryErr } = await supabase
      .from('review_schedule')
      .update(legacyPatch)
      .in('verse_id', ids);

    if (retryErr) throw retryErr;
  }

  return ids.length;
}

/**
 * 테스트용: 해당 구절의 복습 로그를 비우고 단기 7회 성공을 재현한 뒤 장기 트랙(다음 복습=오늘)으로 둡니다.
 */
async function simulateShortCompleteMoveToLong(verseId: string): Promise<void> {
  const user = await requireUser();
  const today = ymd(new Date());

  const { data: verse, error: vErr } = await supabase
    .from('verses')
    .select('id, user_id, created_at')
    .eq('id', verseId)
    .eq('user_id', user.id)
    .single();

  if (vErr || !verse) throw new Error('Verse not found');

  const { error: delErr } = await supabase
    .from('review_logs')
    .delete()
    .eq('verse_id', verseId);
  if (delErr) throw delErr;

  const anchor = parseISO(verse.created_at as string);
  const logRows = Array.from({ length: 7 }, (_, i) => ({
    verse_id: verseId,
    success: true,
    count_in_session: (i + 1) as number,
    reviewed_at: addMinutes(anchor, i + 1).toISOString(),
  }));

  const { error: insErr } = await supabase
    .from('review_logs')
    .insert(logRows);
  if (insErr) throw insErr;

  const { error: schedErr } = await supabase
    .from('review_schedule')
    .update({
      next_review_date: today,
      current_interval_days: 7,
      consecutive_failures: 0,
      review_phase: 'long',
      short_success_count: 7,
      long_success_count: 0,
    })
    .eq('verse_id', verseId);
  if (schedErr) throw schedErr;

  const { error: verseGrpErr } = await supabase
    .from('verses')
    .update({ verse_group: 'long' })
    .eq('id', verseId)
    .eq('user_id', user.id);
  if (verseGrpErr) throw verseGrpErr;
}

async function updateSchedule(
  verseId: string,
  updates: UpdateScheduleInput
): Promise<ReviewScheduleRow> {
  const user = await requireUser();

  const { data: verse } = await supabase
    .from('verses')
    .select('id')
    .eq('id', verseId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!verse) throw new Error('Verse not found');

  const { data, error } = await supabase
    .from('review_schedule')
    .update(updates)
    .eq('verse_id', verseId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Schedule not found');
  return data;
}

export function useVerses() {
  return useMemo(
    () => ({
      addVerse,
      updateVerse,
      deleteVerse,
      getAllVerses,
      getReviewLogsForVerseIds,
      logReview,
      getScheduledToday,
      getDashboardSummary,
      updateSchedule,
      resetAllPracticeToNewVerseState,
      simulateShortCompleteMoveToLong,
      completeLongRemediation,
    }),
    []
  );
}

export {
  addVerse,
  computeAfterReview,
  completeLongRemediation,
  deleteVerse,
  getAllVerses,
  getDashboardSummary,
  getReviewLogsForVerseIds,
  getScheduledToday,
  logReview,
  normalizeSchedule,
  resetAllPracticeToNewVerseState,
  simulateShortCompleteMoveToLong,
  updateSchedule,
  updateVerse,
  ymd,
};
