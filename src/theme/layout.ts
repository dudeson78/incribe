/** Minimum touch target (WCAG 2.5.5). */
export const touchTarget = {
  min: 48,
} as const;

/** Padding around small touch targets (with hitSlop). */
export const hitSlopComfortable = 12;

/** 코너 반경 스케일 — 매직넘버 대신 이 토큰을 사용 */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /** 완전한 알약/원형 */
  pill: 999,
};
