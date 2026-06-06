import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '../theme/tokens';

type SectionOrangeHeaderProps = {
  title: string;
  accessibilityLabel: string;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
};

/** 섹션 머리줄 — 연간 목표 카드와 훈련 목록 사이 라벨 */
export function SectionOrangeHeader({
  title,
  accessibilityLabel,
  accessibilityLiveRegion,
}: SectionOrangeHeaderProps) {
  return (
    <View
      style={styles.badge}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={accessibilityLiveRegion}
    >
      <Text style={styles.text} selectable={false}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: tokens.radius.lg,
    marginBottom: 8,
    backgroundColor: tokens.color.successBg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.primary,
  },
  text: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.primary,
    textAlign: 'left',
    lineHeight: 20,
  },
});
