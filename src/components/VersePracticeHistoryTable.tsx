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

/** yyyy-MM-dd → 로케일 짧은 날짜 (빈 값·예정 문자열 통과 그대로) */
function fmtDate(cell: string, locale: string): string {
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
          const dateShown = fmtDate(raw ?? '', i18n.language);
          const subtitle = subtitleFor(kind);
          const a11y =
            kind === 'empty'
              ? undefined
              : [dateShown, subtitle].filter(Boolean).join(' ');
          return (
            <View key={ix} style={styles.cell} accessibilityLabel={a11y}>
              {dateShown ? (
                <Text style={styles.cellText}>{dateShown}</Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.cellSub}>{subtitle}</Text>
              ) : null}
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

const CELL_W = 86;
const LABEL_W = 92;

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  section: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  scrollInner: {
    paddingBottom: 2,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    width: CELL_W,
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderTertiary,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
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
  },
  headerCorner: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 18,
  },
  headerText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 16,
  },
  cellText: {
    fontSize: typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 17,
  },
  cellSub: {
    marginTop: 2,
    fontSize: Math.max(10, typography.caption - 1),
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  labelHeadText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 17,
  },
});
