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
      {entries.map(({ row, lineKind }, index) => {
        const { verse } = row;
        const recorded = row.todaySessionRecordedSuccess ?? false;
        const phaseText =
          lineKind === 'short'
            ? t('home.sectionShort')
            : t('home.sectionLong');
        const statusLabel = recorded
          ? t('home.reviewListTrainingDoneStatus')
          : t('home.reviewListTrainingPendingStatus');
        const remark = remarkLine(row, recorded, t);
        const a11y = t('home.reviewListRowA11y', {
          phase: phaseText,
          ref: verse.reference,
          session: '',
          status: statusLabel,
          remark,
        });

        return (
          <View key={verse.id}>
            <Pressable
              disabled={recorded}
              onPress={() => onSelectVerse(verse.id)}
              style={({ pressed }) => [
                styles.rowCard,
                recorded && styles.rowCardDone,
                pressed && !recorded && styles.rowCardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={a11y}
              accessibilityState={{ disabled: recorded }}
            >
              <View style={styles.kindBadge}>
                <Text style={styles.kindBadgeText} numberOfLines={1}>
                  {phaseText}
                </Text>
              </View>
              <Text
                style={styles.refText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {verse.reference}
              </Text>
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
              <Text
                style={styles.remarkText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {remark}
              </Text>
            </Pressable>
            {index < entries.length - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    gap: 0,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    ...shadowSm,
  },
  rowCardPressed: {
    opacity: 0.9,
  },
  rowCardDone: {
    opacity: 0.78,
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.bgSecondary,
    flexShrink: 0,
  },
  kindBadgeText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  refText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.verse,
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    flexShrink: 0,
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
  },
  statusChipTextDone: {
    color: tokens.color.success,
  },
  statusChipTextPending: {
    color: tokens.color.warning,
  },
  remarkText: {
    maxWidth: 88,
    flexShrink: 0,
    fontSize: tokens.fontSize.xs,
    color: tokens.color.textMuted,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.border,
    marginVertical: 6,
    marginHorizontal: 4,
  },
});
