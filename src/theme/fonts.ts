import type { TextStyle } from 'react-native';

import { colors, typography } from './colors';

/** Noto Serif KR — 구절 본문 전용 (UI는 시스템 sans 유지) */
export const fontFamilies = {
  verse: 'NotoSerifKR_400Regular',
  verseMedium: 'NotoSerifKR_500Medium',
  verseBlack: 'NotoSerifKR_900Black',
} as const;

/** 구절·말씀 영역 타이포 — serif, line-height 1.65 */
export const verseTypography = {
  /** 훈련 카드 티저·모달 본문 */
  body: {
    fontFamily: fontFamilies.verse,
    fontSize: typography.bodyLarge,
    lineHeight: Math.round(typography.bodyLarge * 1.65),
    color: colors.textPrimary,
  } satisfies TextStyle,
  /** 모달·확인 화면 본문 (조금 더 크게) */
  bodyLarge: {
    fontFamily: fontFamilies.verse,
    fontSize: typography.refLarge,
    lineHeight: Math.round(typography.refLarge * 1.65),
    color: colors.textPrimary,
  } satisfies TextStyle,
  /** 참조 — sans, 작고 올리브 (UI chrome) */
  reference: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  } satisfies TextStyle,
} as const;
