import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius, screenPadding } from '../theme/layout';

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
    left: screenPadding,
    right: screenPadding,
    backgroundColor: colors.parchment,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  primary: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  secondary: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    opacity: 0.85,
  },
  emphasis: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: typography.title,
  },
  emphasisDue: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: typography.title,
  },
});
