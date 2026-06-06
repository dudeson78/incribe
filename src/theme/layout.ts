/** Minimum touch target (WCAG 2.5.5). */
export const touchTarget = {
  min: 48,
} as const;

/** Padding around small touch targets (with hitSlop). */
export const hitSlopComfortable = 12;

/** 화면 좌우 기본 여백 — 파스텔 v1 (16→20) */
export const screenPadding = 20;

/** 카드 컨테이너 내부 패딩 (기존 20px 대비 40% 축소) */
export const cardPadding = 12;

/** 카드·패널 모서리 통일 (16px) */
export const cardRadius = 16;

/** 코너 반경 스케일 — 매직넘버 대신 이 토큰을 사용 */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /** 완전한 알약/원형 */
  pill: 999,
} as const;
