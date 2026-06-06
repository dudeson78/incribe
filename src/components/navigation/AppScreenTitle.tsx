import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies } from '../../theme/fonts';
import { screenPadding } from '../../theme/layout';
import { tokens } from '../../theme/tokens';

type Props = {
  title: string;
  /** 스택 헤더 우측 액션 등 (선택) */
  trailing?: ReactNode;
};

/** 탭 화면 상단 제목 — 말씀 관리 스택 헤더와 동일 톤 */
export function AppScreenTitle({ title, trailing }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: tokens.color.bg,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    lineHeight: Math.round(tokens.fontSize.xxl * 1.2),
  },
  trailing: {
    flexShrink: 0,
  },
});
