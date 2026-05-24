import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../theme/colors';
import { touchTarget } from '../../theme/layout';

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

export function QuizModeSelector({ active, onChange, labels }: Props) {
  const items: { mode: QuizSurfaceMode; title: string }[] = [
    { mode: 'reference', title: labels.reference },
    { mode: 'blank', title: labels.blank },
    { mode: 'order', title: labels.order },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map(({ mode, title }) => {
        const on = active === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.pill, on ? styles.pillOn : styles.pillOff]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
    flexGrow: 0,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: touchTarget.min,
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pillOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  pillOff: {
    backgroundColor: colors.backgroundPrimary,
    borderColor: colors.borderSecondary,
  },
  pillText: {
    fontSize: typography.min,
    fontWeight: '700',
  },
  pillTextOn: {
    color: colors.white,
  },
  pillTextOff: {
    color: colors.forest,
  },
});
