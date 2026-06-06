import type { ViewStyle } from 'react-native';

import { cardShadow, colors } from './colors';
import { cardPadding, cardRadius } from './layout';

/** 양피지 말씀·퀴즈 카드 공통 표면 */
export const parchmentCard: ViewStyle = {
  backgroundColor: colors.parchment,
  borderRadius: cardRadius,
  borderWidth: 1,
  borderColor: colors.creamBorder,
  padding: cardPadding,
  ...cardShadow,
};

/** 관리 탭 구절 행 — 좌측 올리브 세로줄 */
export const scrollCardRow: ViewStyle = {
  flexDirection: 'row',
  backgroundColor: colors.parchment,
  borderRadius: cardRadius,
  borderWidth: 1,
  borderColor: colors.creamBorder,
  marginBottom: 12,
  overflow: 'hidden',
  ...cardShadow,
};

export const scrollCardOliveBar: ViewStyle = {
  width: 4,
  backgroundColor: colors.forest,
};
