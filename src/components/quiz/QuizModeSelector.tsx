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

const MODE_CHIP: Record<
  QuizSurfaceMode,
  { bg: string; border: string; activeBg: string; activeBorder: string }
> = {
  blank: {
    bg: colors.sky,
    border: colors.pastelBlueBorderSoft,
    activeBg: colors.pastelBlueBorder,
    activeBorder: colors.pastelBlueText,
  },
  order: {
    bg: colors.sage,
    border: colors.successBorder,
    activeBg: colors.forest,
    activeBorder: colors.forest,
  },
  reference: {
    bg: colors.orangeTint,
    border: colors.orangeTintBorder,
    activeBg: colors.orange,
    activeBorder: colors.badgeShortText,
  },
};

export function QuizModeSelector({ active, onChange, labels }: Props) {
  const items: { mode: QuizSurfaceMode; title: string }[] = [
    { mode: 'reference', title: labels.reference },
    { mode: 'blank', title: labels.blank },
    { mode: 'order', title: labels.order },
  ];

  return (
    <View style={styles.row}>
      {items.map(({ mode, title }) => {
        const on = active === mode;
        const chip = MODE_CHIP[mode];
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: on ? chip.activeBg : chip.bg,
                borderColor: on ? chip.activeBorder : chip.border,
              },
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={title}
          >
            <Text
              style={[
                styles.label,
                on ? styles.labelOn : styles.labelOff,
                on && {
                  color:
                    mode === 'order' ? colors.textOnDark : colors.textPrimary,
                },
              ]}
              numberOfLines={1}
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
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: typography.versePreview,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelOn: {
    fontWeight: '800',
  },
  labelOff: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
