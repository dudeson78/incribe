import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fontFamilies } from '../theme/fonts';
import { tokens } from '../theme/tokens';

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
    <LinearGradient
      colors={[tokens.color.primary, tokens.color.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityRole="summary"
    >
      <View style={styles.topRow}>
        <Text style={styles.goalNumbers}>
          <Text style={styles.goalLarge}>{versesThisYear}</Text>
          <Text style={styles.goalSlash}>
            {' '}
            / {goalTarget}
            {t('home.goalVersesSuffix')}
          </Text>
        </Text>
        <Text style={styles.caption}>
          {t('home.yearlyGoalCaption')} {t('home.goalPct', { pct })}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.lg,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  topRow: {
    gap: 4,
  },
  goalNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  goalLarge: {
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxl,
    fontWeight: '700',
    color: tokens.color.textOnDark,
  },
  goalSlash: {
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxl,
    fontWeight: '700',
    color: tokens.color.textOnDark,
  },
  caption: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '500',
    color: tokens.color.textOnDark,
    opacity: 0.8,
  },
  track: {
    height: 4,
    borderRadius: tokens.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: tokens.color.textOnDark,
    borderRadius: tokens.radius.full,
  },
});
