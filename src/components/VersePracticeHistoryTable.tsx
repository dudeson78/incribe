import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  buildPracticeHistoryCells,
  type PracticeCellKind,
} from '../lib/practiceHistoryTable';
import type { ReviewLogRow, ReviewScheduleRow, VerseRow } from '../types/verses';
import { tokens } from '../theme/tokens';

const SESSIONS = 7 as const;

type Props = {
  verse: VerseRow;
  schedule: ReviewScheduleRow;
  logs: ReviewLogRow[];
};

function fmtHistoryDateDisplay(cell: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    const date = new Date(y, m - 1, d);
    const thisYear = new Date().getFullYear();
    const opts: Intl.DateTimeFormatOptions =
      y !== thisYear
        ? { year: '2-digit', month: 'numeric', day: 'numeric' }
        : { month: 'numeric', day: 'numeric' };
    return new Intl.DateTimeFormat('ko-KR', opts).format(date);
  } catch {
    return cell;
  }
}

function fmtHistoryDateA11y(cell: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(new Date(y, m - 1, d));
  } catch {
    return cell;
  }
}

function chipTone(kind: PracticeCellKind) {
  if (kind === 'completed') {
    return {
      bg: tokens.color.successBg,
      fg: tokens.color.success,
    };
  }
  if (kind === 'scheduled') {
    return {
      bg: tokens.color.warningBg,
      fg: tokens.color.warning,
    };
  }
  return {
    bg: tokens.color.bgSecondary,
    fg: tokens.color.textMuted,
  };
}

function SessionChip({
  sessionNum,
  kind,
  rawCell,
  scheduledLabel,
}: {
  sessionNum: number;
  kind: PracticeCellKind;
  rawCell: string;
  scheduledLabel: string;
}) {
  const tone = chipTone(kind);
  const dateShown = fmtHistoryDateDisplay(rawCell).trim();
  const dateA11y = fmtHistoryDateA11y(rawCell).trim();
  const isEmpty = kind === 'empty';
  const subtitle = kind === 'scheduled' ? scheduledLabel : '';

  const a11y = isEmpty
    ? `${sessionNum}? -`
    : [dateA11y || dateShown || rawCell, subtitle].filter(Boolean).join(' ');

  return (
    <View
      style={[styles.chip, { backgroundColor: tone.bg }]}
      accessibilityLabel={a11y}
    >
      <Text style={[styles.chipSession, { color: tone.fg }]}>
        {sessionNum}?
      </Text>
      {isEmpty ? (
        <Text style={[styles.chipDash, { color: tone.fg }]}>?</Text>
      ) : (
        <>
          {dateShown ? (
            <Text style={[styles.chipDate, { color: tone.fg }]} numberOfLines={1}>
              {dateShown}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.chipSub, { color: tone.fg }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

function TrackChipRow({
  label,
  cells,
  kinds,
  scheduledLabel,
}: {
  label: string;
  cells: string[];
  kinds: PracticeCellKind[];
  scheduledLabel: string;
}) {
  return (
    <View style={styles.trackRow}>
      <Text style={styles.trackLabel} numberOfLines={1}>
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {cells.slice(0, SESSIONS).map((raw, ix) => (
          <SessionChip
            key={ix}
            sessionNum={ix + 1}
            kind={kinds[ix] ?? 'empty'}
            rawCell={raw ?? ''}
            scheduledLabel={scheduledLabel}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function VersePracticeHistoryTable({ verse, schedule, logs }: Props) {
  const { t } = useTranslation();
  const { shortRow, longRow, shortKind, longKind } = buildPracticeHistoryCells(
    verse,
    schedule,
    logs,
  );

  return (
    <View style={styles.wrap}>
      <TrackChipRow
        label={t('verses.historyShort')}
        cells={shortRow}
        kinds={shortKind}
        scheduledLabel={t('verses.historyDateScheduled')}
      />
      <TrackChipRow
        label={t('verses.historyLong')}
        cells={longRow}
        kinds={longKind}
        scheduledLabel={t('verses.historyDateScheduled')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 2,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackLabel: {
    width: 28,
    fontSize: tokens.fontSize.xs,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  chipScroll: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    minWidth: 56,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  chipSession: {
    fontSize: tokens.fontSize.xs,
    fontWeight: '700',
  },
  chipDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  chipSub: {
    fontSize: 9,
    fontWeight: '500',
  },
  chipDash: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '500',
    lineHeight: 16,
  },
});
