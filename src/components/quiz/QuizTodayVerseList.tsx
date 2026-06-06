import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ScheduledRow } from '../../hooks/useVerses';
import { EmptyStatePanel } from '../EmptyStatePanel';
import { colors, typography } from '../../theme/colors';
import { verseTypography } from '../../theme/fonts';
import { screenPadding } from '../../theme/layout';
import { tokens } from '../../theme/tokens';

const VERSE_CHIP_COLUMNS = 4;
const VERSE_CHIP_GAP = 8;
const VERSE_CHIP_HEIGHT = 44;

type Props = {
  rows: ScheduledRow[];
  loading: boolean;
  onPick: (row: ScheduledRow) => void;
  /** 상위 스크롤과 묶일 때 내부 스크롤 생략 */
  embedded?: boolean;
  selectedVerseId?: string | null;
  /**
   * 빈칸·순서 모드에서 한 번 이상 맞춘 구절 id — 칩 색만 변경(계속 선택 가능)
   */
  solvedVerseIds?: ReadonlySet<string> | null;
  /**
   * true → 참조만 텍스트 너비의 칩을 가로로 나열(많으면 좌우 스크롤)
   */
  compactChipRow?: boolean;
};

export function QuizTodayVerseList({
  rows,
  loading,
  onPick,
  embedded = false,
  selectedVerseId = null,
  solvedVerseIds = null,
  compactChipRow = false,
}: Props) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [chipWrapWidth, setChipWrapWidth] = useState(0);

  const chipWidth = useMemo(() => {
    const wrapWidth =
      chipWrapWidth > 0 ? chipWrapWidth : windowWidth - screenPadding * 2;
    return (
      (wrapWidth - VERSE_CHIP_GAP * (VERSE_CHIP_COLUMNS - 1)) / VERSE_CHIP_COLUMNS
    );
  }, [chipWrapWidth, windowWidth]);

  if (loading) {
    return (
      <View style={styles.pad}>
        <Text style={styles.muted}>{t('quiz.loadingToday')}</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyStatePanel
          variant="quiz"
          compact
          plain
          title={t('quiz.noTrainingToday')}
          body={t('quiz.noTrainingTodayHint')}
        />
      </View>
    );
  }

  const verseRowCards = rows.map((row) => {
    const selected = selectedVerseId === row.verse.id;
    return (
      <Pressable
        key={row.verse.id}
        onPress={() => onPick(row)}
        style={({ pressed }) => [
          styles.rowCard,
          embedded && styles.rowCardEmbedded,
          selected && styles.rowCardSelected,
          pressed && styles.rowCardPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={t('quiz.pickVerseA11y', {
          ref: row.verse.reference,
        })}
      >
        <Text style={styles.refText} numberOfLines={2}>
          {row.verse.reference}
        </Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    );
  });

  const verseChipRow = (
    <View
      style={styles.chipWrap}
      onLayout={(e) => setChipWrapWidth(e.nativeEvent.layout.width)}
    >
      {rows.map((row) => {
        const selected = selectedVerseId === row.verse.id;
        const solved = solvedVerseIds?.has(row.verse.id) ?? false;
        return (
          <Pressable
            key={row.verse.id}
            onPress={() => onPick(row)}
            style={({ pressed }) => [
              styles.chip,
              { width: chipWidth, height: VERSE_CHIP_HEIGHT },
              selected && styles.chipSelected,
              solved && styles.chipSolved,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={
              solved
                ? t('quiz.verseChipSolvedA11y', {
                    ref: row.verse.reference,
                  })
                : t('quiz.pickVerseA11y', {
                    ref: row.verse.reference,
                  })
            }
          >
            <Text
              style={[
                styles.chipRefText,
                selected && styles.chipRefTextSelected,
                solved && !selected && styles.chipRefTextSolved,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {row.verse.reference}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (embedded && compactChipRow) {
    return (
      <View style={styles.embeddedWrap}>
        {verseChipRow}
      </View>
    );
  }

  if (embedded) {
    return (
      <View style={styles.embeddedWrap}>
        <View style={styles.embeddedRows}>{verseRowCards}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {verseRowCards}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  embeddedWrap: {
    paddingTop: 2,
    paddingBottom: 8,
    gap: 6,
  },
  embeddedRows: {
    gap: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: VERSE_CHIP_GAP,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.bgSecondary,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chipRefText: {
    width: '100%',
    fontSize: tokens.fontSize.sm,
    fontWeight: '500',
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  chipRefTextSelected: {
    fontWeight: '600',
    color: tokens.color.textOnDark,
  },
  chipRefTextSolved: {
    color: tokens.color.success,
    fontWeight: '600',
  },
  chipSolved: {
    borderColor: tokens.color.success,
    backgroundColor: tokens.color.successBg,
  },
  chipSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  chipPressed: {
    opacity: 0.9,
  },
  emptyWrap: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  pad: {
    padding: 24,
    alignItems: 'center',
  },
  muted: {
    fontSize: typography.min,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: 28,
    gap: 8,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 12,
    minHeight: 48,
    marginBottom: 4,
    gap: 10,
  },
  rowCardEmbedded: {
    minHeight: 44,
    paddingVertical: 11,
    marginBottom: 0,
  },
  rowCardSelected: {
    borderWidth: 2,
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryTint08,
  },
  rowCardPressed: {
    opacity: 0.92,
    backgroundColor: tokens.color.bgSecondary,
  },
  refText: {
    flex: 1,
    ...verseTypography.reference,
    fontSize: typography.body,
    lineHeight: 24,
  },
  chev: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.textPrimary,
  },
});
