import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  orderTodayScheduledRows,
  type ScheduledRow,
} from '../hooks/useVerses';
import { fontFamilies } from '../theme/fonts';
import { shadowSm, tokens } from '../theme/tokens';

type HomeGroupedReviewProps = {
  items: ScheduledRow[];
  onSelectVerse: (verseId: string) => void;
};

type ListedRow = {
  row: ScheduledRow;
  lineKind: 'short' | 'long';
};

/** 미완료(3글자) 기준 상태 칩 최소 너비 — 완료도 동일 박스 */
const STATUS_CHIP_MIN_WIDTH = 54;
/** 열 사이 균일 간격 */
const COL_GAP = 4;

function formatMdDotsFromYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd.trim();
  return `${Number(m[2])}.${Number(m[3])}`;
}

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

function remarkLine(
  row: ScheduledRow,
  recorded: boolean,
  t: TFunction,
): string {
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
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={[styles.col, styles.colKind]}>
            <Text style={styles.headLabel} numberOfLines={1}>
              {t('home.reviewListColKind')}
            </Text>
          </View>
          <View style={[styles.col, styles.colVerse]}>
            <Text style={[styles.headLabel, styles.headLabelLeft]} numberOfLines={1}>
              {t('home.reviewListColVerse')}
            </Text>
          </View>
          <View style={[styles.col, styles.colSession]}>
            <Text style={styles.headLabel} numberOfLines={1}>
              {t('home.reviewListColSession')}
            </Text>
          </View>
          <View style={[styles.col, styles.colStatus]}>
            <Text style={styles.headLabel} numberOfLines={1}>
              {t('home.reviewListColStatus')}
            </Text>
          </View>
          <View style={[styles.col, styles.colRemark]}>
            <Text style={styles.headLabel} numberOfLines={1}>
              {t('home.reviewListColRemark')}
            </Text>
          </View>
        </View>

        {entries.map(({ row, lineKind }, index) => {
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
          const remark = remarkLine(row, recorded, t);
          const a11y = t('home.reviewListRowA11y', {
            phase: phaseText,
            ref: verse.reference,
            session: sessionText,
            status: statusLabel,
            remark,
          });

          return (
            <View key={verse.id}>
              <Pressable
                disabled={recorded}
                onPress={() => onSelectVerse(verse.id)}
                style={({ pressed }) => [
                  styles.dataRow,
                  recorded && styles.dataRowDone,
                  pressed && !recorded && styles.dataRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={a11y}
                accessibilityState={{ disabled: recorded }}
              >
                <View style={[styles.col, styles.colKind]}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindBadgeText} numberOfLines={1}>
                      {phaseText}
                    </Text>
                  </View>
                </View>
                <View style={[styles.col, styles.colVerse]}>
                  <Text
                    style={styles.refText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {verse.reference}
                  </Text>
                </View>
                <View style={[styles.col, styles.colSession]}>
                  <Text style={styles.sessionText} numberOfLines={1}>
                    {sessionText}
                  </Text>
                </View>
                <View style={[styles.col, styles.colStatus]}>
                  <View
                    style={[
                      styles.statusChip,
                      recorded ? styles.statusChipDone : styles.statusChipPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        recorded
                          ? styles.statusChipTextDone
                          : styles.statusChipTextPending,
                      ]}
                      numberOfLines={1}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <View style={[styles.col, styles.colRemark]}>
                  <Text
                    style={styles.remarkText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {remark}
                  </Text>
                </View>
              </Pressable>
              {index < entries.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  table: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    ...shadowSm,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: COL_GAP,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.color.border,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: COL_GAP,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 48,
  },
  dataRowPressed: {
    opacity: 0.9,
  },
  dataRowDone: {
    opacity: 0.78,
  },
  col: {
    minWidth: 0,
    justifyContent: 'center',
  },
  colKind: {
    width: 26,
    flexShrink: 0,
    alignItems: 'center',
  },
  colVerse: {
    flex: 1,
    flexShrink: 1,
    minWidth: 48,
    maxWidth: 118,
    alignItems: 'flex-start',
  },
  colSession: {
    width: 32,
    flexShrink: 0,
    alignItems: 'center',
  },
  colStatus: {
    width: STATUS_CHIP_MIN_WIDTH,
    flexShrink: 0,
    alignItems: 'center',
  },
  colRemark: {
    flex: 1,
    flexShrink: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  headLabel: {
    width: '100%',
    fontSize: tokens.fontSize.xs,
    fontWeight: '700',
    color: tokens.color.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  headLabelLeft: {
    textAlign: 'left',
  },
  kindBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.bgSecondary,
  },
  kindBadgeText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  refText: {
    width: '100%',
    fontFamily: fontFamilies.verse,
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    textAlign: 'left',
  },
  sessionText: {
    width: '100%',
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  statusChip: {
    minWidth: STATUS_CHIP_MIN_WIDTH,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipDone: {
    backgroundColor: tokens.color.successBg,
  },
  statusChipPending: {
    backgroundColor: tokens.color.warningBg,
  },
  statusChipText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  statusChipTextDone: {
    color: tokens.color.success,
  },
  statusChipTextPending: {
    color: tokens.color.warning,
  },
  remarkText: {
    width: '100%',
    fontSize: tokens.fontSize.xs,
    color: tokens.color.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.border,
    marginHorizontal: 8,
  },
});
