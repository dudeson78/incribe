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

/** 스케줄 `yyyy-MM-dd` → `5.23` (월·일, 앞자리 0 없음) */
function formatMdDotsFromYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd.trim();
  return `${Number(m[2])}.${Number(m[3])}`;
}

/** ISO 시각 → 현지 달력 기준 `5.23` */
function formatMdDotsFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getMonth() + 1}.${d.getDate()}`;
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

/** 상태 칩만 */
function SessionStatusColumn({
  recorded,
  statusLabel,
}: {
  recorded: boolean;
  statusLabel: string;
}) {
  return (
    <View style={styles.statusColInner}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.statusBadgeBase,
          recorded ? styles.statusBadgeDone : styles.statusBadgePending,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            recorded ? styles.statusBadgeTextDone : styles.statusBadgeTextPending,
          ]}
          numberOfLines={1}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

export function HomeGroupedReview({
  items,
  onSelectVerse,
}: HomeGroupedReviewProps) {
  const { t } = useTranslation();

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
            <View style={[styles.col, styles.headCell, styles.colHeadCentered]}>
              <Text style={[styles.headLabel, styles.cellTextCentered]}>
                {t('home.reviewListColKind')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell, styles.colHeadVerse]}>
              <Text style={[styles.headLabel, styles.cellTextVerse]}>
                {t('home.reviewListColVerse')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell, styles.colHeadCentered]}>
              <Text style={[styles.headLabel, styles.cellTextCentered]}>
                {t('home.reviewListColSession')}
              </Text>
            </View>
            <View style={[styles.col, styles.headCell, styles.colHeadCentered]}>
              <Text style={[styles.headLabel, styles.cellTextCentered]}>
                {t('home.reviewListColStatus')}
              </Text>
            </View>
            <View
              style={[
                styles.col,
                styles.headCell,
                styles.headCellLast,
                styles.colHeadRemark,
              ]}
            >
              <Text style={[styles.headLabel, styles.cellTextCentered]}>
                {t('home.reviewListColRemark')}
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
          const remarkLine = (() => {
            if (recorded) {
              return t('home.reviewListRemarkNext', {
                date: formatMdDotsFromYmd(row.schedule.next_review_date),
              });
            }
            const prevDots = row.lastPracticedAtIso
              ? formatMdDotsFromIso(row.lastPracticedAtIso)
              : null;
            if (prevDots) {
              return t('home.reviewListRemarkPrev', { date: prevDots });
            }
            return t('home.reviewListRemarkFirstPractice');
          })();
          const a11y = t('home.reviewListRowA11y', {
            phase: phaseText,
            ref: verse.reference,
            session: sessionText,
            status: statusLabel,
            remark: remarkLine,
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
              <View style={[styles.col, styles.colCentered]}>
                <Text style={[styles.colPhase, styles.cellTextCentered]} numberOfLines={2}>
                  {phaseText}
                </Text>
              </View>
              <View style={[styles.col, styles.colVerse]}>
                <Text
                  style={[styles.colRef, styles.cellTextVerse]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {verse.reference}
                </Text>
              </View>
              <View style={[styles.col, styles.colCentered]}>
                <Text
                  style={[styles.colSession, styles.cellTextCentered]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {sessionText}
                </Text>
              </View>
              <View style={[styles.col, styles.colCentered, styles.statusCol]}>
                <SessionStatusColumn
                  recorded={recorded}
                  statusLabel={statusLabel}
                />
              </View>
              <View style={[styles.col, styles.colCentered, styles.remarkCol]}>
                <Text
                  style={[styles.remarkText, styles.cellTextCentered]}
                  numberOfLines={2}
                >
                  {remarkLine}
                </Text>
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
    paddingHorizontal: 12,
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
    paddingHorizontal: 1,
    minWidth: 0,
    flexGrow: 1,
    flexBasis: 0,
  },
  colHeadCentered: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  colHeadVerse: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  colHeadRemark: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headCellLast: {},
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
  /** 균등 5열 — 구분·연습회차·암송상태·훈련정보는 가운데 · 구절만 왼쪽 */
  col: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  colCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colVerse: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cellTextCentered: {
    textAlign: 'center',
    width: '100%',
  },
  cellTextVerse: {
    textAlign: 'left',
    width: '100%',
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
  statusCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingVertical: 0,
  },
  statusColInner: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  remarkCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  remarkText: {
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
    width: '100%',
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
