import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography } from '../../theme/colors';

export type QuizSurfaceMode = 'reference' | 'blank' | 'order';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  active: QuizSurfaceMode;
  onChange: (m: QuizSurfaceMode) => void;
  labels: {
    reference: string;
    blank: string;
    order: string;
  };
};

const ICON_BOX = 72;
const ICON_RADIUS = 16;
const ICON_GLYPH = 34;

const MODE_META: Record<QuizSurfaceMode, { icon: IonName }> = {
  reference: { icon: 'book-outline' },
  blank: { icon: 'document-text-outline' },
  order: { icon: 'reorder-three-outline' },
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
        const { icon } = MODE_META[mode];
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => [
              styles.cell,
              pressed && styles.cellPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={title}
          >
            <View
              pointerEvents="none"
              style={[
                styles.iconBox,
                on ? styles.iconBoxOn : styles.iconBoxOff,
              ]}
            >
              <Ionicons
                name={icon}
                size={ICON_GLYPH}
                color={on ? colors.white : colors.forest}
              />
            </View>
            <Text
              style={[styles.label, on ? styles.labelOn : styles.labelOff]}
              numberOfLines={2}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  cellPressed: {
    opacity: 0.88,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBoxOff: {
    backgroundColor: colors.backgroundPrimary,
    borderColor: colors.borderSecondary,
  },
  iconBoxOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  label: {
    marginTop: 8,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    letterSpacing: 0.1,
  },
  labelOn: {
    color: colors.forest,
  },
  labelOff: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
