import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

type SectionOrangeHeaderProps = {
  title: string;
  accessibilityLabel: string;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
};

/** 「오늘 훈련구절」 배지와 동일한 포맷의 오렌지 강조 머리줄 */
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: 8,
    backgroundColor: colors.orange,
  },
  text: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'left',
    lineHeight: 22,
  },
});
