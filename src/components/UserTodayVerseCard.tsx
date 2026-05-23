import { StyleSheet, Text, View } from 'react-native';

import type { VerseRow } from '../types/verses';
import { colors, typography } from '../theme/colors';

type UserTodayVerseCardProps = {
  verse: VerseRow;
};

/** 저장 구절 중에서 날짜 시드로 고르는 카드. */
export function UserTodayVerseCard({ verse }: UserTodayVerseCardProps) {
  const text = verse.text.trim();

  return (
    <View style={styles.card} accessibilityRole="text">
      <Text style={styles.quote} selectable>
        &ldquo;{text}&rdquo;
      </Text>
      <Text style={styles.ref}>{verse.reference.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    borderColor: colors.creamBorder,
    borderRadius: 16,
    backgroundColor: colors.cream,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  quote: {
    fontSize: typography.ref,
    lineHeight: 26,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  ref: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.forest,
  },
});
