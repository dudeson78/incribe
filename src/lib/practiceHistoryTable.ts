import { format, parseISO, startOfDay } from 'date-fns';

import { computeAfterReview } from '../hooks/useVerses';
import type { ReviewLogRow, ReviewScheduleRow, VerseRow } from '../types/verses';

const COLS = 7;

/** yyyy-MM-dd (로그 발생일 기준 현지 시작일) */
function ymd(ts: Date): string {
  return format(startOfDay(ts), 'yyyy-MM-dd');
}

function initialScheduleSkeleton(
  verseId: string,
  createdAtISO: string,
): ReviewScheduleRow {
  const firstDay = startOfDay(parseISO(createdAtISO));
  return {
    id: '__replay__',
    verse_id: verseId,
    next_review_date: format(firstDay, 'yyyy-MM-dd'),
    current_interval_days: 1,
    consecutive_failures: 0,
    review_phase: 'short',
    short_success_count: 0,
    long_success_count: 0,
  };
}

/** 복습 로그 순서대로 재생해 회차별 완료일(단기·장기 각 최대 7회) */
export function replayPracticeDates(
  verseId: string,
  verseCreatedAtISO: string,
  logs: ReviewLogRow[],
): {
  shortDoneYmd: (string | null)[];
  longDoneYmd: (string | null)[];
} {
  const shortDoneYmd: (string | null)[] = Array.from(
    { length: COLS },
    () => null,
  );
  const longDoneYmd: (string | null)[] = Array.from(
    { length: COLS },
    () => null,
  );
  let longSuccesses = 0;

  let s = initialScheduleSkeleton(verseId, verseCreatedAtISO);

  const ordered = [...logs].sort((a, b) => {
    const ta = parseISO(a.reviewed_at).getTime();
    const tb = parseISO(b.reviewed_at).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });

  for (const log of ordered) {
    const when = parseISO(log.reviewed_at);
    const wasShort = s.review_phase === 'short';
    const prevShort = s.short_success_count;

    if (log.success) {
      if (wasShort && prevShort < 7) {
        shortDoneYmd[prevShort] = ymd(when);
      } else if (!wasShort && s.review_phase === 'long') {
        longSuccesses += 1;
        const idx = longSuccesses - 1;
        if (idx >= 0 && idx < COLS) {
          longDoneYmd[idx] = ymd(when);
        }
      }
    }

    const { next } = computeAfterReview(s, log.success, when);
    s = { ...s, ...next };
  }

  return { shortDoneYmd, longDoneYmd };
}

/** 빈 칸 · 완료된 회차 날짜 · 다음 예정 복습일 */
export type PracticeCellKind = 'empty' | 'completed' | 'scheduled';

export type PracticeHistoryCells = {
  shortRow: string[];
  longRow: string[];
  shortKind: PracticeCellKind[];
  longKind: PracticeCellKind[];
};

/**
 * 과거 재생 결과 + 현재 스케줄로 표 셀(날짜 yyyy-MM-dd·또는 빈 문자열).
 * 단기 다음 예정: `phase === short && short_success_count < 7`
 * 장기 다음 예정: 장기 줄에서 첫 번째 빈 열 하나에만 `next_review_date`
 */
export function buildPracticeHistoryCells(
  verse: VerseRow,
  current: ReviewScheduleRow,
  logs: ReviewLogRow[],
): PracticeHistoryCells {
  const { shortDoneYmd, longDoneYmd } = replayPracticeDates(
    verse.id,
    verse.created_at,
    logs,
  );

  const shortRow: string[] = [];
  const shortKind: PracticeCellKind[] = [];

  /** DB 기준 다음 단기 회차(1-based). 단기 종료 후에는 예정 표시 안 함 */
  const nextShort1Based =
    current.review_phase === 'short' && current.short_success_count < COLS
      ? current.short_success_count + 1
      : -1;

  for (let col = 0; col < COLS; col += 1) {
    const completed = shortDoneYmd[col];
    if (completed) {
      shortRow[col] = completed;
      shortKind[col] = 'completed';
    } else if (col + 1 === nextShort1Based) {
      shortRow[col] = current.next_review_date;
      shortKind[col] = 'scheduled';
    } else {
      shortRow[col] = '';
      shortKind[col] = 'empty';
    }
  }

  const longRow: string[] = [];
  const longKind: PracticeCellKind[] = [];
  for (let col = 0; col < COLS; col += 1) {
    const done = longDoneYmd[col];
    if (done) {
      longRow[col] = done;
      longKind[col] = 'completed';
    } else {
      longRow[col] = '';
      longKind[col] = 'empty';
    }
  }
  if (current.review_phase === 'long') {
    const hole = longDoneYmd.findIndex((v) => v == null);
    if (hole !== -1) {
      longRow[hole] = current.next_review_date;
      longKind[hole] = 'scheduled';
    }
  }

  return { shortRow, longRow, shortKind, longKind };
}
