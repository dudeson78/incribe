import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

type FloatingReviewSummaryProps = {
  doneToday: number;
  dueToday: number;
};

export function FloatingReviewSummary({
  doneToday,
  dueToday,
}: FloatingReviewSummaryProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.wrap, { bottom: 16 + insets.bottom }]}
      accessibilityRole="summary"
    >
      <Text style={styles.primary}>
        <Text>{t('summary.donePrefix')}</Text>
        <Text style={styles.emphasis}>{doneToday}</Text>
        <Text>{t('summary.doneSuffix')}</Text>
      </Text>
      <Text style={styles.secondary}>
        <Text>{t('summary.duePrefix')}</Text>
        <Text style={styles.emphasisDue}>{dueToday}</Text>
        <Text>{t('summary.dueSuffix')}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primary: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.forest,
  },
  secondary: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.forest,
    opacity: 0.85,
  },
  emphasis: {
    color: colors.orange,
    fontWeight: '800',
    fontSize: typography.title,
  },
  emphasisDue: {
    color: colors.forest,
    fontWeight: '800',
    fontSize: typography.title,
  },
});
