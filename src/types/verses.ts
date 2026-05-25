export type VerseGroup = 'short' | 'long';
export type ReviewPhase = 'short' | 'long';

export type VerseRow = {
  id: string;
  user_id: string;
  reference: string;
  text: string;
  rema: string | null;
  /** 빈칸 퀴즈용. 쉼표(,)로 구분된 구절 표현(본문 토큰과 맞는 구간이 빈칸) */
  keywords?: string | null;
  verse_group: VerseGroup;
  created_at: string;
  is_active: boolean;
};

export type ReviewScheduleRow = {
  id: string;
  verse_id: string;
  next_review_date: string;
  current_interval_days: number;
  consecutive_failures: number;
  review_phase: ReviewPhase;
  short_success_count: number;
  /** 누적 장기 검사 성공 횟수(다음 성공 시 간격 계산에 사용) */
  long_success_count: number;
};

export type ReviewLogRow = {
  id: string;
  verse_id: string;
  reviewed_at: string;
  success: boolean;
  count_in_session: number | null;
};

export type VerseWithSchedule = VerseRow & {
  review_schedule: ReviewScheduleRow | ReviewScheduleRow[] | null;
};

export type AddVerseInput = {
  reference: string;
  text: string;
  rema?: string | null;
  keywords?: string | null;
  verse_group: VerseGroup;
};

export type UpdateVerseInput = Partial<
  Pick<
    VerseRow,
    'reference' | 'text' | 'rema' | 'keywords' | 'verse_group' | 'is_active'
  >
>;

export type UpdateScheduleInput = Partial<
  Pick<
    ReviewScheduleRow,
    | 'next_review_date'
    | 'current_interval_days'
    | 'consecutive_failures'
    | 'review_phase'
    | 'short_success_count'
    | 'long_success_count'
  >
>;
