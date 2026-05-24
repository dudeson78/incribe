import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../theme/colors';

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
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    alignItems: 'center',
    flexGrow: 0,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    justifyContent: 'center',
    borderWidth: 1,
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
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  pillTextOn: {
    color: colors.white,
  },
  pillTextOff: {
    color: colors.forest,
  },
});
