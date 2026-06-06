import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CelebrationVariant } from './CelebrationModal';
import { EmptyStatePanel } from './EmptyStatePanel';
import { CelebrationModal } from './CelebrationModal';
import { FadeIn } from './ui/FadeIn';
import { SevenCheckTable } from './SevenCheckTable';
import { VerseVerifyModalTrigger } from './VerseVerifyModalTrigger';
import type { ScheduledRow } from '../hooks/useVerses';
import { computeAfterReview } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { useDialog } from '../context/DialogContext';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/fonts';
import { shadowMd, tokens } from '../theme/tokens';
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

function buildShortDailyNextTrainingSubtitle(
  schedule: ReviewScheduleRow,
  fn: TFunction,
): string {
  try {
    const { next } = computeAfterReview(schedule, true);
    const today = startOfDay(new Date());
    const target = parseScheduleYmdLocal(next.next_review_date);
    const days = differenceInCalendarDays(target, today);
    const dateDisplay = new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
    }).format(target);
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
  /** 빈 목록일 때 우선 표시할 문구(예: 오늘 목록 구절은 모두 세션 완료) */
  alternateEmptyCaption?: string;
  onLogged?: () => void | Promise<void>;
  logReview: (verseId: string, success: boolean) => Promise<void>;
  completeLongRemediation: (verseId: string) => Promise<void>;
};

export function TodaysReviewList({
  items,
  loading,
  alternateEmptyCaption,
  onLogged,
  logReview,
  completeLongRemediation,
}: TodaysReviewListProps) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [sessionEnd, setSessionEnd] = useState<SessionEndPrompt | null>(null);
  /**
   * RN Modal 등이 과거 렌더의 onPress 클로저를 유지하면 sessionEnd 변수는 null 스냅샷일 수 있음.
   * ref는 탭 순간 최신값을 가리키므로 복습 기록 핸들러는 항상 여기서 읽는다.
   */
  const sessionEndRef = useRef<SessionEndPrompt | null>(null);
  sessionEndRef.current = sessionEnd;
  const [sessionBusy, setSessionBusy] = useState(false);
  /** 현재 순서 중 몇 번째 훈련 카드만 표시할지 */
  const [activeIndex, setActiveIndex] = useState(0);

  const shortDailySubtitleOverride = useMemo(() => {
    if (!sessionEnd || sessionEnd.variant !== 'shortDailyComplete') return null;
    const row = items.find((r) => r.verse.id === sessionEnd.verseId);
    if (!row) return null;
    return buildShortDailyNextTrainingSubtitle(row.schedule, t);
  }, [sessionEnd, items, t]);

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
    void dialog.alert({ title: t('errors.title'), message: mapAppError(err, t) });
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
      <EmptyStatePanel variant="leaves" body={emptyCopy} />
    );
  }

  const modalLocked = sessionEnd !== null || sessionBusy;

  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const { verse, schedule } = items[safeIndex]!;

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
      <FadeIn key={verse.id} style={styles.block}>
        <View style={styles.versePaper}>
          <View
            style={styles.refHeroBox}
            accessibilityRole="text"
            accessibilityLabel={verse.reference}
          >
            <Text
              style={styles.refHeroText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.45}
              selectable={false}
            >
              {verse.reference}
            </Text>
          </View>

          <View style={styles.tableInCard}>
            <SevenCheckTable
              key={tableBaseKey}
              heading={reciteHeading}
              caption={reciteCaption}
              disabled={locked}
              embedded
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
            keywords={verse.keywords}
            mnemonics={verse.mnemonics}
            rema={verse.rema}
            disabled={locked}
          />
        </View>
      </FadeIn>

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
    gap: 10,
    marginTop: 14,
    marginBottom: 24,
  },
  loader: {
    marginTop: 14,
    paddingVertical: 32,
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
    alignSelf: 'stretch',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 16,
    alignItems: 'stretch',
    gap: 14,
    ...shadowMd,
  },
  refHeroBox: {
    backgroundColor: colors.pastelGreenBg,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.pastelGreenBorderSoft,
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refHeroText: {
    width: '100%',
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxxl,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    textAlign: 'center',
    lineHeight: Math.round(tokens.fontSize.xxxl * 1.2),
  },
});
