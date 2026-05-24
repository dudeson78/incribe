import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ScheduledRow } from '../../hooks/useVerses';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

type Props = {
  rows: ScheduledRow[];
  loading: boolean;
  onPick: (row: ScheduledRow) => void;
  /** 상위 스크롤과 묶일 때 내부 스크롤 생략 */
  embedded?: boolean;
  selectedVerseId?: string | null;
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
  compactChipRow = false,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={styles.pad}>
        <Text style={styles.muted}>{t('quiz.loadingToday')}</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{t('quiz.noTrainingToday')}</Text>
        <Text style={styles.emptyBody}>{t('quiz.noTrainingTodayHint')}</Text>
      </View>
    );
  }

  const titleBlock = (
    <>
      <Text style={[styles.listTitle, embedded && styles.listTitleEmbedded]}>
        {t('quiz.todayTrainingTitle')}
      </Text>
      <Text style={[styles.listSub, embedded && styles.listSubEmbedded]}>
        {t('quiz.todayTrainingSubtitle')}
      </Text>
    </>
  );

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
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chipScrollContent}
    >
      {rows.map((row) => {
        const selected = selectedVerseId === row.verse.id;
        return (
          <Pressable
            key={row.verse.id}
            onPress={() => onPick(row)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t('quiz.pickVerseA11y', {
              ref: row.verse.reference,
            })}
          >
            <Text
              style={styles.chipRefText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {row.verse.reference}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (embedded && compactChipRow) {
    return (
      <View style={styles.embeddedWrap}>
        {titleBlock}
        {verseChipRow}
      </View>
    );
  }

  if (embedded) {
    return (
      <View style={styles.embeddedWrap}>
        {titleBlock}
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
      {titleBlock}
      {verseRowCards}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  embeddedWrap: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
    gap: 6,
  },
  embeddedRows: {
    gap: 6,
  },
  chipScrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
    flexGrow: 0,
  },
  chip: {
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    minHeight: touchTarget.min,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
  },
  chipRefText: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
    flexShrink: 1,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: `${colors.orange}12`,
  },
  chipPressed: {
    opacity: 0.9,
    backgroundColor: colors.backgroundSecondary,
  },
  pad: {
    padding: 24,
    alignItems: 'center',
  },
  muted: {
    fontSize: typography.min,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },
  listTitle: {
    fontSize: typography.refLarge,
    fontWeight: '800',
    color: colors.forest,
    marginTop: 4,
    marginBottom: 6,
  },
  listTitleEmbedded: {
    fontSize: typography.body,
    marginTop: 0,
    marginBottom: 2,
  },
  listSub: {
    fontSize: typography.min,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  listSubEmbedded: {
    marginBottom: 8,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: touchTarget.min + 4,
    marginBottom: 4,
    gap: 10,
  },
  rowCardEmbedded: {
    minHeight: touchTarget.min,
    paddingVertical: 11,
    marginBottom: 0,
  },
  rowCardSelected: {
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: `${colors.orange}10`,
  },
  rowCardPressed: {
    opacity: 0.92,
    backgroundColor: colors.backgroundSecondary,
  },
  refText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.forest,
    lineHeight: 24,
  },
  chev: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.orange,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 22,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.creamBorder,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
