import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  orderTodayScheduledRows,
  type ScheduledRow,
} from '../hooks/useVerses';
import { colors, typography } from '../theme/colors';

type HomeGroupedReviewProps = {
  items: ScheduledRow[];
  onSelectVerse: (verseId: string) => void;
};

type ListedRow = {
  row: ScheduledRow;
  /** 일반 단기는 단기 줄, 재연습·장기는 장기 줄 */
  lineKind: 'short' | 'long';
};

function localeTagForApp(language: string): string {
  const raw = language ?? 'en';
  const base = raw.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
  if (base === 'ko') return 'ko-KR';
  if (base === 'zh') return 'zh-CN';
  if (base === 'pt') return 'pt-BR';
  if (base === 'es') return 'es-ES';
  return 'en-US';
}

function formatLastPracticeDisplay(
  iso: string | null | undefined,
  language: string,
  t: TFunction,
): string {
  if (iso == null || iso === '') {
    return t('home.reviewListFirstPractice');
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return t('home.reviewListFirstPractice');
  try {
    return new Intl.DateTimeFormat(localeTagForApp(language), {
      dateStyle: 'medium',
    }).format(d);
  } catch {
    return t('home.reviewListFirstPractice');
  }
}

function listedRowLineKind(row: ScheduledRow): 'short' | 'long' {
  const { schedule } = row;
  if (
    schedule.review_phase === 'short' &&
    schedule.current_interval_days === 1
  ) {
    return 'short';
  }
  return 'long';
}

function sessionChipLabel(
  row: ScheduledRow,
  lineKind: 'short' | 'long',
  recordedToday: boolean,
  t: TFunction,
): string {
  const { schedule } = row;
  if (lineKind === 'short') {
    const s = schedule.short_success_count;
    const n = recordedToday
      ? Math.min(Math.max(s, 1), 7)
      : Math.min(s + 1, 7);
    return t('home.reviewListSessionPractice', { n });
  }
  /** 재연습(단기이지만 교정 간격) · 장기 회차 */
  if (
    schedule.review_phase === 'short' &&
    schedule.current_interval_days > 1
  ) {
    const s = schedule.short_success_count;
    const n = recordedToday
      ? Math.min(Math.max(s, 1), 7)
      : Math.min(s + 1, 7);
    return t('home.reviewListSessionPractice', { n });
  }
  const lc = schedule.long_success_count ?? 0;
  const n = recordedToday ? Math.max(1, lc) : Math.max(1, lc + 1);
  return t('home.reviewListSessionPractice', { n });
}

/** 상태를 작은 라운드 버튼(칩) 형태로 표시 — 행의 접근성 라벨이 전체 상태를 안내한다. */
function SessionStatusBadge({
  recorded,
  label,
}: {
  recorded: boolean;
  label: string;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.statusBadgeBase, recorded ? styles.statusBadgeDone : styles.statusBadgePending]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          recorded ? styles.statusBadgeTextDone : styles.statusBadgeTextPending,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function HomeGroupedReview({
  items,
  onSelectVerse,
}: HomeGroupedReviewProps) {
  const { t, i18n } = useTranslation();

  const entries = useMemo((): ListedRow[] => {
    return orderTodayScheduledRows(items).map((row) => ({
      row,
      lineKind: listedRowLineKind(row),
    }));
  }, [items]);

  if (entries.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <View style={styles.headRow}>
            <View style={[styles.col, styles.headCell]}>
              <Text style={styles.headLabel}>
                {t('home.reviewListColKind')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell]}>
              <Text style={styles.headLabel}>
                {t('home.reviewListColVerse')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell]}>
              <Text style={styles.headLabel}>
                {t('home.reviewListColSession')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell]}>
              <Text style={styles.headLabel}>
                {t('home.reviewListColLastPractice')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell, styles.headCellLast]}>
              <Text style={styles.headLabel}>
                {t('home.reviewListColStatus')}
              </Text>
            </View>
          </View>
        </View>

        {entries.map(({ row, lineKind }) => {
          const { verse } = row;
          const recorded = row.todaySessionRecordedSuccess ?? false;
          const phaseText =
            lineKind === 'short'
              ? t('home.sectionShort')
              : t('home.sectionLong');
          const sessionText = sessionChipLabel(row, lineKind, recorded, t);
          const statusLabel = recorded
            ? t('home.reviewListTrainingDoneStatus')
            : t('home.reviewListTrainingPendingStatus');
          const lastPracticeVisible = formatLastPracticeDisplay(
            row.lastPracticedAtIso,
            i18n.language,
            t,
          );
          const a11y = t('home.reviewListRowA11y', {
            phase: phaseText,
            ref: verse.reference,
            session: sessionText,
            lastPractice: lastPracticeVisible,
            status: statusLabel,
          });
          return (
            <Pressable
              key={verse.id}
              disabled={recorded}
              onPress={() => onSelectVerse(verse.id)}
              style={({ pressed }) => [
                styles.row,
                recorded && styles.rowDone,
                pressed && !recorded && styles.rowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={a11y}
              accessibilityState={{ disabled: recorded }}
            >
              <View style={styles.col}>
                <Text style={styles.colPhase} numberOfLines={2}>
                  {phaseText}
                </Text>
              </View>
              <View style={styles.col}>
                <Text
                  style={styles.colRef}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {verse.reference}
                </Text>
              </View>
              <View style={styles.col}>
                <Text
                  style={styles.colSession}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {sessionText}
                </Text>
              </View>
              <View style={styles.col}>
                <Text
                  style={styles.colLastPractice}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {lastPracticeVisible}
                </Text>
              </View>
              <View style={[styles.col, styles.statusCol]}>
                <SessionStatusBadge
                  recorded={recorded}
                  label={statusLabel}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  /** 헤더 + 하단 구분선 하나 */
  tableHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderTertiary,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headCell: {
    paddingVertical: 0,
    paddingHorizontal: 6,
    minWidth: 0,
    flexGrow: 1,
    flexBasis: 0,
  },
  headCellLast: {
    alignItems: 'center',
  },
  headLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowDone: {
    opacity: 0.72,
  },
  /** 균등 5열 — 구분 / 참조 / 연습회차 / 직전 연습일 / 상태 */
  col: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  colPhase: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: colors.forest,
    lineHeight: 17,
  },
  colRef: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: colors.forest,
    lineHeight: 17,
  },
  colSession: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  colLastPractice: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  statusCol: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  statusBadgeBase: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgePending: {
    backgroundColor: colors.badgeShortBg,
    borderColor: `${colors.orange}aa`,
    elevation: 0,
    shadowOpacity: 0,
  },
  statusBadgeDone: {
    backgroundColor: colors.successBg,
    borderColor: `${colors.successBorder}aa`,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17,
  },
  statusBadgeTextPending: {
    color: colors.badgeShortText,
  },
  statusBadgeTextDone: {
    color: colors.successBorder,
  },
});
