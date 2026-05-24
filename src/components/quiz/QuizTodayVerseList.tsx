import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ScheduledRow } from '../../hooks/useVerses';
import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

type Props = {
  rows: ScheduledRow[];
  loading: boolean;
  onPick: (row: ScheduledRow) => void;
};

export function QuizTodayVerseList({ rows, loading, onPick }: Props) {
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

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.listTitle}>{t('quiz.todayTrainingTitle')}</Text>
      <Text style={styles.listSub}>{t('quiz.todayTrainingSubtitle')}</Text>
      {rows.map((row) => (
        <Pressable
          key={row.verse.id}
          onPress={() => onPick(row)}
          style={({ pressed }) => [
            styles.rowCard,
            pressed && styles.rowCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('quiz.pickVerseA11y', {
            ref: row.verse.reference,
          })}
        >
          <Text style={styles.refText} numberOfLines={2}>
            {row.verse.reference}
          </Text>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  listSub: {
    fontSize: typography.min,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 14,
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
