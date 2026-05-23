import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';

export function ReviewCycleDisplay() {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.line}>
        <Text style={styles.bullet}>▸ </Text>
        {t('settings.rcShort')}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.bullet}>▸ </Text>
        {t('settings.rcLong')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: `${colors.forest}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.forest,
  },
  line: {
    fontSize: typography.body,
    lineHeight: 28,
    color: colors.forest,
  },
  bullet: {
    fontWeight: '700',
    color: colors.orange,
  },
});
