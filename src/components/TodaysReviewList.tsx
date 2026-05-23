import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CelebrationVariant } from './CelebrationModal';
import { CelebrationModal } from './CelebrationModal';
import { SectionOrangeHeader } from './SectionOrangeHeader';
import { SevenCheckTable } from './SevenCheckTable';
import { VerseVerifyModalTrigger } from './VerseVerifyModalTrigger';
import type { ScheduledRow } from '../hooks/useVerses';
import { computeAfterReview } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { ReviewScheduleRow } from '../types/verses';

function parseScheduleYmdLocal(dateStr: string): Date {
  const seg = dateStr.split('-').map((x) => parseInt(x, 10));
  if (
    seg.length !== 3 ||
    seg.some((n) => Number.isNaN(n)) ||
    seg[0] == null ||
    seg[1] == null ||
    seg[2] == null
  ) {
    return startOfDay(new Date());
  }
  return startOfDay(new Date(seg[0], seg[1] - 1, seg[2]));
}

function localeTagFromLanguage(language: string): string {
  const raw = language ?? 'en';
  const base = raw.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
  if (base === 'ko') return 'ko-KR';
  if (base === 'zh') return 'zh-CN';
  if (base === 'pt') return 'pt-BR';
  if (base === 'es') return 'es-ES';
  return 'en-US';
}

function buildShortDailyNextTrainingSubtitle(
  schedule: ReviewScheduleRow,
  fn: TFunction,
  language: string,
): string {
  try {
    const { next } = computeAfterReview(schedule, true);
    const today = startOfDay(new Date());
    const target = parseScheduleYmdLocal(next.next_review_date);
    const days = differenceInCalendarDays(target, today);
    const dateDisplay = new Intl.DateTimeFormat(
      localeTagFromLanguage(language),
      { month: 'long', day: 'numeric' },
    ).format(target);
    if (days < 1) {
      return fn('celebration.subtitleShortNextTrainingToday', {
        dateDisplay,
      });
    }
    return fn('celebration.subtitleShortNextTraining', { days, dateDisplay });
  } catch {
    return fn('celebration.subtitle');
  }
}

type SessionEndPrompt = {
  verseId: string;
  variant: CelebrationVariant;
};

type TodaysReviewListProps = {
  items: ScheduledRow[];
  loading: boolean;
  /**
   * 오늘 훈련 일정 구절 수(완료·미완료 포함 전체).
   * 주면 훈련카드 제목 current/total이 홈 「오늘 훈련구절」과 같은 기준으로 유지된다.
   */
  plannedSessionTotal?: number;
  /**
   * 홈 「오늘 훈련구절」과 같은 순서의 verse id 목록이면,
   * 훈련카드 제목의 순번(current)이 해당 목록 안에서 몇 번째인지 표시된다.
   */
  homeTrainingOrderVerseIds?: readonly string[];
  /** 빈 목록일 때 우선 표시할 문구(예: 오늘 목록 구절은 모두 세션 완료) */
  alternateEmptyCaption?: string;
  onLogged?: () => void | Promise<void>;
  logReview: (verseId: string, success: boolean) => Promise<void>;
  completeLongRemediation: (verseId: string) => Promise<void>;
};

export function TodaysReviewList({
  items,
  loading,
  plannedSessionTotal,
  homeTrainingOrderVerseIds,
  alternateEmptyCaption,
  onLogged,
  logReview,
  completeLongRemediation,
}: TodaysReviewListProps) {
  const { t, i18n } = useTranslation();
  const [sessionEnd, setSessionEnd] = useState<SessionEndPrompt | null>(null);
  /**
   * RN Modal 등이 과거 렌더의 onPress 클로저를 유지하면 sessionEnd 변수는 null 스냅샷일 수 있음.
   * ref는 탭 순간 최신값을 가리키므로 복습 기록 핸들러는 항상 여기서 읽는다.
   */
  const sessionEndRef = useRef<SessionEndPrompt | null>(null);
  sessionEndRef.current = sessionEnd;
  const [sessionBusy, setSessionBusy] = useState(false);
  /** 이번 암송 훈련 진입 후 한 번이라도 불러온 최대 예정 건수(복습 후에도 분모 유지) */
  const [sessionPeakTotal, setSessionPeakTotal] = useState(0);
  /** 현재 순서 중 몇 번째 훈련 카드만 표시할지 */
  const [activeIndex, setActiveIndex] = useState(0);

  const shortDailySubtitleOverride = useMemo(() => {
    if (!sessionEnd || sessionEnd.variant !== 'shortDailyComplete') return null;
    const row = items.find((r) => r.verse.id === sessionEnd.verseId);
    if (!row) return null;
    return buildShortDailyNextTrainingSubtitle(row.schedule, t, i18n.language);
  }, [sessionEnd, items, t, i18n.language]);

  useEffect(() => {
    if (items.length === 0) {
      setSessionPeakTotal(0);
      return;
    }
    setSessionPeakTotal((p) => Math.max(p, items.length));
  }, [items.length]);

  useEffect(() => {
    setActiveIndex((i) =>
      Math.min(i, Math.max(0, items.length - 1)),
    );
  }, [items.length]);

  async function bumpQueueAfterLogged() {
    await onLogged?.();
    setActiveIndex(0);
  }

  function showMapError(err: unknown) {
    const body = mapAppError(err, t);
    if (Platform.OS === 'web') {
      globalThis.alert(`${t('errors.title')}\n\n${body}`);
    } else {
      Alert.alert(t('errors.title'), body);
    }
  }

  async function finalizeShortDaily() {
    const p = sessionEndRef.current;
    if (!p || p.variant !== 'shortDailyComplete') return;
    setSessionBusy(true);
    try {
      await logReview(p.verseId, true);
      setSessionEnd(null);
      await bumpQueueAfterLogged();
    } catch (e) {
      showMapError(e);
    } finally {
      setSessionBusy(false);
    }
  }

  async function finalizeLongPass() {
    const p = sessionEndRef.current;
    if (!p || p.variant !== 'longAssessment') return;
    setSessionBusy(true);
    try {
      await logReview(p.verseId, true);
      setSessionEnd(null);
      await bumpQueueAfterLogged();
    } catch (e) {
      showMapError(e);
    } finally {
      setSessionBusy(false);
    }
  }

  async function finalizeLongFail() {
    const p = sessionEndRef.current;
    if (!p || p.variant !== 'longAssessment') return;
    setSessionBusy(true);
    try {
      await logReview(p.verseId, false);
      setSessionEnd(null);
      await bumpQueueAfterLogged();
    } catch (e) {
      showMapError(e);
    } finally {
      setSessionBusy(false);
    }
  }

  async function finalizeRemedial() {
    const p = sessionEndRef.current;
    if (!p || p.variant !== 'longRemedialComplete') return;
    setSessionBusy(true);
    try {
      await completeLongRemediation(p.verseId);
      setSessionEnd(null);
      await bumpQueueAfterLogged();
    } catch (e) {
      showMapError(e);
    } finally {
      setSessionBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader} accessibilityLabel={t('review.loadingA11y')}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  if (items.length === 0) {
    const trimmed = alternateEmptyCaption?.trim();
    const emptyCopy = trimmed ? trimmed : t('memorize.noMoreVersesToday');
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyMessage}>{emptyCopy}</Text>
      </View>
    );
  }

  const modalLocked = sessionEnd !== null || sessionBusy;

  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const { verse, schedule } = items[safeIndex]!;

  /** 분모: 부모 계획 수·큐 참고 */
  const plannedTotalNormalized =
    typeof plannedSessionTotal === 'number' && plannedSessionTotal > 0
      ? plannedSessionTotal
      : undefined;
  const queueTotalShown = plannedTotalNormalized ?? Math.max(sessionPeakTotal, items.length);

  const homeIx =
    homeTrainingOrderVerseIds && homeTrainingOrderVerseIds.length > 0
      ? homeTrainingOrderVerseIds.indexOf(verse.id)
      : -1;

  /** 홈 목록 순서 우선 · 없거나 찾기 실패 시 기존 «남은 큐 순」 공식 */
  const rawSequentialOrdinal =
    queueTotalShown - items.length + 1 + safeIndex;
  const ordinalFromSequential = Math.min(
    queueTotalShown,
    Math.max(1, rawSequentialOrdinal),
  );
  const queueOrdinalShown =
    homeIx >= 0
      ? Math.min(queueTotalShown, homeIx + 1)
      : ordinalFromSequential;

  const remedialShort =
    schedule.review_phase === 'short' &&
    schedule.current_interval_days > 1;

  const tableBaseKey = `${verse.id}-${schedule.next_review_date}-${schedule.short_success_count}-${schedule.review_phase}-${schedule.current_interval_days}`;

  const locked = modalLocked;

  const reciteHeading = remedialShort ? t('seven.sectionLabelLongRemedial') : '';

  const reciteCaption = remedialShort
    ? t('seven.captionLongRemedial', {
        days: schedule.current_interval_days,
      })
    : t('seven.captionRecite');

  return (
    <View style={styles.list}>
      <SectionOrangeHeader
        accessibilityLiveRegion="polite"
        title={t('memorize.trainingCardTitle', {
          n: queueOrdinalShown,
        })}
        accessibilityLabel={t('memorize.trainingCardTitleA11y', {
          n: queueOrdinalShown,
        })}
      />

      <View key={verse.id} style={styles.block}>
        <View style={styles.versePaper}>
          <Text style={styles.refLarge}>{verse.reference}</Text>

          <View style={styles.tableInCard}>
            <SevenCheckTable
              key={tableBaseKey}
              heading={reciteHeading}
              caption={reciteCaption}
              disabled={locked}
              onAllFilled={() => {
                let variant: CelebrationVariant = 'shortDailyComplete';
                if (schedule.review_phase === 'long') {
                  variant = 'longAssessment';
                } else if (remedialShort) {
                  variant = 'longRemedialComplete';
                }
                setSessionEnd({
                  verseId: verse.id,
                  variant,
                });
              }}
            />
          </View>
          <VerseVerifyModalTrigger
            reference={verse.reference}
            text={verse.text}
            disabled={locked}
          />
        </View>
      </View>

      <CelebrationModal
        visible={sessionEnd !== null}
        variant={sessionEnd?.variant ?? 'shortDailyComplete'}
        subtitleOverride={shortDailySubtitleOverride ?? undefined}
        onDismiss={
          sessionEnd && !sessionBusy
            ? () => setSessionEnd(null)
            : undefined
        }
        busy={sessionBusy}
        onConfirmShortDaily={finalizeShortDaily}
        onConfirmLongPass={finalizeLongPass}
        onConfirmLongFail={finalizeLongFail}
        onConfirmRemedial={finalizeRemedial}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    /** 그룹 목록·위 배지와 훈련카드 헤더 사이 간격 */
    marginTop: 14,
    marginBottom: 24,
  },
  loader: {
    marginTop: 14,
    paddingVertical: 32,
  },
  empty: {
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
  },
  emptyMessage: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  block: {
    gap: 16,
    marginBottom: 4,
  },
  /** cream 카드 안에서 표를 가로 너비 꽉 채움 (부모 alignItems:center 대비) */
  tableInCard: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 4,
  },
  versePaper: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.creamBorder,
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
  },
  refLarge: {
    fontSize: typography.refLarge,
    fontWeight: '500',
    color: colors.forest,
    marginBottom: 10,
    textAlign: 'center',
  },
});
