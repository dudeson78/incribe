import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

export type ReviewDisplayMode = 'full' | 'verseOnly';

type ReviewModeToggleProps = {
  mode: ReviewDisplayMode;
  onChange: (mode: ReviewDisplayMode) => void;
};

export function ReviewModeToggle({ mode, onChange }: ReviewModeToggleProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row} accessibilityRole="tablist">
      <Pressable
        onPress={() => onChange('full')}
        style={({ pressed }) => [
          styles.segment,
          mode === 'full' && styles.segmentActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'full' }}
      >
        <Text
          style={[styles.label, mode === 'full' && styles.labelActive]}
        >
          {t('review.modeFull')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('verseOnly')}
        style={({ pressed }) => [
          styles.segment,
          mode === 'verseOnly' && styles.segmentActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: mode === 'verseOnly' }}
      >
        <Text
          style={[styles.label, mode === 'verseOnly' && styles.labelActive]}
        >
          {t('review.modeVerseOnly')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    minHeight: touchTarget.min,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelActive: {
    fontWeight: '500',
    color: colors.forest,
  },
});
