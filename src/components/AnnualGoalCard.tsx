import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

type AnnualGoalCardProps = {
  goalTarget: number;
  versesThisYear: number;
};

export function AnnualGoalCard({
  goalTarget,
  versesThisYear,
}: AnnualGoalCardProps) {
  const { t } = useTranslation();
  const progress =
    goalTarget > 0 ? Math.min(versesThisYear / goalTarget, 1) : 0;
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.topRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.goalNumbers}>
            <Text style={styles.goalLarge}>{versesThisYear}</Text>
            <Text style={styles.goalSlash}>
              {' '}
              / {goalTarget}
              {t('home.goalVersesSuffix')}
            </Text>
          </Text>
        </View>
        <View style={styles.rightGoal}>
          <Text style={styles.rightCaption}>{t('home.yearlyGoalCaption')}</Text>
          <Text style={styles.pct}>{t('home.goalPct', { pct })}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  metricBlock: {
    flexShrink: 1,
  },
  goalNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  goalLarge: {
    fontSize: typography.goalNumber,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  goalSlash: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnDark,
  },
  rightGoal: {
    alignItems: 'flex-end',
  },
  rightCaption: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textOnDark,
  },
  pct: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  track: {
    height: 6,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xs,
  },
});
