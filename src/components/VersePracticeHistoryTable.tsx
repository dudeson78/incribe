import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  buildPracticeHistoryCells,
  type PracticeCellKind,
} from '../lib/practiceHistoryTable';
import type { ReviewLogRow, ReviewScheduleRow, VerseRow } from '../types/verses';
import { colors, typography } from '../theme/colors';

const SESSIONS = 7 as const;

type Props = {
  verse: VerseRow;
  schedule: ReviewScheduleRow;
  logs: ReviewLogRow[];
};

/** yyyy-MM-dd → 표시용 초소형 날짜(올해는 월·일만 → 셀 너비 절약) */
function fmtHistoryDateDisplay(cell: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    const tag = 'ko-KR';
    const date = new Date(y, m - 1, d);
    const thisYear = new Date().getFullYear();
    const opts: Intl.DateTimeFormatOptions =
      y !== thisYear
        ? { year: '2-digit', month: 'numeric', day: 'numeric' }
        : { month: 'numeric', day: 'numeric' };
    return new Intl.DateTimeFormat(tag, opts).format(date);
  } catch {
    return cell;
  }
}

/** 접근성·전체 정보용 (연 포함) */
function fmtHistoryDateA11y(cell: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    const tag = 'ko-KR';
    return new Intl.DateTimeFormat(tag, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(new Date(y, m - 1, d));
  } catch {
    return cell;
  }
}

export function VersePracticeHistoryTable({ verse, schedule, logs }: Props) {
  const { t } = useTranslation();
  const { shortRow, longRow, shortKind, longKind } = buildPracticeHistoryCells(
    verse,
    schedule,
    logs,
  );

  const headerSession = Array.from({ length: SESSIONS }, (_, i) =>
    t('verses.historySession', { n: i + 1 }),
  );

  function subtitleFor(kind: PracticeCellKind): string {
    if (kind === 'completed') return t('verses.historyDateCompleted');
    if (kind === 'scheduled') return t('verses.historyDateScheduled');
    return '';
  }

  function Row({
    label,
    cells,
    kinds,
  }: {
    label: string;
    cells: string[];
    kinds: PracticeCellKind[];
  }) {
    return (
      <View style={styles.tr}>
        <View style={[styles.cell, styles.labelCell]}>
          <Text style={styles.labelHeadText} numberOfLines={1}>
            {label}
          </Text>
        </View>
        {cells.slice(0, SESSIONS).map((raw, ix) => {
          const kind = kinds[ix] ?? 'empty';
          const rawCell = raw ?? '';
          const dateShown = fmtHistoryDateDisplay(rawCell).trim();
          const dateA11y = fmtHistoryDateA11y(rawCell).trim();
          const subtitle = subtitleFor(kind);
          const isBlank = !dateShown && !subtitle;
          const a11y = isBlank
            ? '-'
            : [dateA11y || dateShown || rawCell, subtitle]
                .filter(Boolean)
                .join(' ');
          return (
            <View
              key={ix}
              style={[styles.cell, styles.dataCell]}
              accessibilityLabel={a11y}
            >
              {isBlank ? (
                <Text style={styles.cellDash} accessibilityElementsHidden>
                  -
                </Text>
              ) : (
                <>
                  {dateShown ? (
                    <Text
                      style={styles.cellText}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {dateShown}
                    </Text>
                  ) : null}
                  {subtitle ? (
                    <Text style={styles.cellSub} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.table}>
        <View style={styles.tr}>
          <View style={[styles.cell, styles.labelCell, styles.headerLabelCell]}>
            <Text style={styles.headerCorner} numberOfLines={1}>
              {t('verses.historyColCategory')}
            </Text>
          </View>
          {headerSession.map((h, i) => (
            <View key={i} style={[styles.cell, styles.dataCell, styles.headerCell]}>
              <Text style={styles.headerText} numberOfLines={1}>
                {h}
              </Text>
            </View>
          ))}
        </View>
        <Row
          label={t('verses.historyShort')}
          cells={shortRow}
          kinds={shortKind}
        />
        <Row
          label={t('verses.historyLong')}
          cells={longRow}
          kinds={longKind}
        />
      </View>
    </View>
  );
}

/** 연습 이력 미니 표 — 카드 너비 안에 7회까지 가로 스크롤 없이 표시 */
const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  table: {
    alignSelf: 'stretch',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderTertiary,
    justifyContent: 'center',
    paddingHorizontal: 1,
    paddingVertical: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  labelCell: {
    width: 26,
    minHeight: 28,
    backgroundColor: `${colors.forest}0d`,
  },
  headerLabelCell: {
    backgroundColor: `${colors.orange}18`,
  },
  dataCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 28,
  },
  headerCell: {
    backgroundColor: `${colors.forest}0f`,
    minHeight: 24,
  },
  headerCorner: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 11,
  },
  headerText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 11,
  },
  cellText: {
    fontSize: 9,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 11,
  },
  cellDash: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.borderSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  cellSub: {
    marginTop: 0,
    fontSize: 7,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 8,
  },
  labelHeadText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 11,
  },
});
