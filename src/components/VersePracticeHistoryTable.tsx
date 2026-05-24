import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
function fmtHistoryDateDisplay(cell: string, locale: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    const tag =
      locale === 'ko'
        ? 'ko-KR'
        : locale === 'zh'
          ? 'zh-CN'
          : locale === 'es'
            ? 'es-ES'
            : locale === 'pt'
              ? 'pt-BR'
              : 'en-US';
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
function fmtHistoryDateA11y(cell: string, locale: string): string {
  if (!cell.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
  const parts = cell.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  try {
    const tag =
      locale === 'ko'
        ? 'ko-KR'
        : locale === 'zh'
          ? 'zh-CN'
          : locale === 'es'
            ? 'es-ES'
            : locale === 'pt'
              ? 'pt-BR'
              : 'en-US';
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
  const { t, i18n } = useTranslation();
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
        <View style={[styles.cell, styles.labelCellFirst]}>
          <Text style={styles.labelHeadText} numberOfLines={2}>
            {label}
          </Text>
        </View>
        {cells.slice(0, SESSIONS).map((raw, ix) => {
          const kind = kinds[ix] ?? 'empty';
          const rawCell = raw ?? '';
          const dateShown =
            fmtHistoryDateDisplay(rawCell, i18n.language).trim();
          const dateA11y = fmtHistoryDateA11y(rawCell, i18n.language).trim();
          const subtitle = subtitleFor(kind);
          const isBlank = !dateShown && !subtitle;
          const a11y = isBlank
            ? '-'
            : [dateA11y || dateShown || rawCell, subtitle].filter(Boolean).join(' ');
          return (
            <View key={ix} style={styles.cell} accessibilityLabel={a11y}>
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
                      minimumFontScale={0.75}
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
      <Text style={styles.section}>{t('verses.historyTitle')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.scrollInner}
      >
        <View>
          <View style={styles.tr}>
            <View style={[styles.cell, styles.labelCellTop]}>
              <Text style={styles.headerCorner}>{t('verses.historyColCategory')}</Text>
            </View>
            {headerSession.map((h) => (
              <View key={h} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerText} numberOfLines={2}>
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
      </ScrollView>
    </View>
  );
}

/** 연습 이력 미니 표 — 카드 안에서 과도하게 커 보이지 않도록 시각적 무게 최소화 */
const CELL_W = 58;
const LABEL_W = 52;

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  section: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 3,
    letterSpacing: 0.15,
  },
  scrollInner: {
    paddingBottom: 1,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    width: CELL_W,
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderTertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 3,
    backgroundColor: colors.backgroundPrimary,
  },
  labelCellFirst: {
    width: LABEL_W,
    backgroundColor: `${colors.forest}0d`,
  },
  labelCellTop: {
    width: LABEL_W,
    backgroundColor: `${colors.orange}18`,
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: `${colors.forest}0f`,
    minHeight: 32,
  },
  headerCorner: {
    fontSize: typography.chip,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 13,
  },
  headerText: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 12,
  },
  cellText: {
    fontSize: 10,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 12,
  },
  cellDash: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.borderSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  cellSub: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 10,
  },
  labelHeadText: {
    fontSize: typography.chip,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 13,
  },
});
