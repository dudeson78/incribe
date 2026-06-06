import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../theme/colors';
import { radius } from '../../theme/layout';

export type QuizSurfaceMode = 'reference' | 'blank' | 'order';

type Props = {
  active: QuizSurfaceMode;
  onChange: (m: QuizSurfaceMode) => void;
  labels: {
    reference: string;
    blank: string;
    order: string;
  };
};

const MODES: QuizSurfaceMode[] = ['reference', 'blank', 'order'];

export function QuizModeSelector({ active, onChange, labels }: Props) {
  const labelByMode: Record<QuizSurfaceMode, string> = {
    reference: labels.reference,
    blank: labels.blank,
    order: labels.order,
  };

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {MODES.map((mode) => {
        const on = active === mode;
        const title = labelByMode[mode];
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={({ pressed }) => [
              styles.segment,
              on && styles.segmentActive,
              pressed && !on && styles.segmentPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={title}
          >
            <Text
              style={[styles.label, on ? styles.labelActive : styles.labelIdle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderTertiary,
    gap: 2,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentPressed: {
    opacity: 0.88,
  },
  label: {
    fontSize: typography.versePreview,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  labelIdle: {
    fontWeight: '600',
    color: colors.textPrimary,
    opacity: 0.72,
  },
});
