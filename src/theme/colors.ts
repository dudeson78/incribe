/**
 * 「말씀의 정원」 팔레트 — Deep Sky · Warm Gold · Cool Off-White
 *
 * 기존 키(forest, orange, cream…)는 유지하되 값만 새 팔레트로 매핑해
 * 전역 import 변경 없이 톤 전환.
 */
const palette = {
  primary: '#2B6B8F',
  surface: '#1A4A66',
  accent: '#C8A96E',
  text: '#1C1C1E',
  muted: '#6B7280',
  bg: '#F5F8FA',
  card: '#FFFFFF',
  success: '#3A7D96',
  warning: '#C8A96E',
} as const;

export const colors = {
  /** 시맨틱 토큰 */
  primary: palette.primary,
  surface: palette.surface,
  accent: palette.accent,
  success: palette.success,
  warning: palette.warning,

  /** 브랜드 — Deep Sky */
  forest: palette.primary,
  olive: palette.primary,

  /** 강조 — Warm Gold (구 orange/dawn) */
  orange: palette.accent,
  dawn: palette.accent,

  /** 캔버스 — Cool Off-White */
  mist: palette.bg,
  background: palette.bg,
  backgroundPrimary: palette.card,
  backgroundSecondary: '#EEF2F6',

  /** 카드·양피지 */
  parchment: palette.card,
  cream: palette.card,
  card: palette.card,
  creamBorder: '#E0E6EB',

  white: '#FFFFFF',
  text: palette.text,
  textPrimary: palette.text,
  textSecondary: palette.muted,
  textOnDark: '#FFFFFF',
  muted: palette.muted,
  borderSecondary: '#D8DEE5',
  borderTertiary: '#E8ECF0',

  /** 단기 트랙 — 골드 틴트 */
  badgeShortBg: '#F5F0E6',
  badgeShortText: palette.text,

  /** 장기·완료 — Sky 틴트 */
  sage: '#E0EEF5',
  badgeLongBg: '#E0EEF5',
  badgeLongText: palette.text,
  circleNumBg: '#E0EEF5',
  successBg: '#E0EEF5',
  successBorder: palette.success,

  /** 주의·오류 */
  rose: '#F5E8E8',
  errorBg: '#F5E8E8',
  errorBorder: '#9E4B55',
  dangerSolid: '#9E4B55',

  /** 모달 딤 + 버튼 틴트 */
  overlayBackdrop: 'rgba(26, 74, 102, 0.45)',
  forestTint: 'rgba(43, 107, 143, 0.10)',
  forestTintBorder: 'rgba(43, 107, 143, 0.28)',
  forestTintActive: 'rgba(43, 107, 143, 0.18)',
  orangeTint: 'rgba(200, 169, 110, 0.20)',
  orangeTintBorder: 'rgba(200, 169, 110, 0.42)',

  /** 말씀 하이라이트 — 스카이 톤 */
  sky: '#D6E8F5',
  /** 스플래시·다크 서피스 */
  skyDeep: '#1A4A66',
  pastelBlueBg: '#D6E8F5',
  pastelBlueBorderSoft: '#B8D4E8',
  pastelBlueBorder: '#7AADC8',
  pastelBlueText: '#4A7A94',
  /** 말씀 참조 박스 등 — 파스텔 연두 */
  pastelGreenBg: '#D4EFC8',
  pastelGreenBorderSoft: '#A8D8A0',
  pastelGreenBorder: '#7CB87A',
  pastelGreenText: '#2D5038',
  /** 키워드·연상기법·레마 보조 버튼 */
  accentMuted: '#F5EDD8',
  /** 말씀확인·말씀듣기 — 미완료 칩과 동일 살구 파스텔 */
  pastelApricotBg: '#FDF6E8',
  pastelApricotBorderSoft: 'rgba(200, 169, 110, 0.42)',
  pastelApricotText: '#C8A96E',
} as const;

/** 카드 — 흰 배경 + 은은한 그림자 */
export const cardShadow = {
  shadowColor: palette.text,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const typography = {
  caption: 13,
  min: 15,
  chip: 12,
  ref: 15,
  versePreview: 14,
  body: 17,
  /** Large verse line */
  bodyLarge: 18,
  refLarge: 20,
  title: 22,
  goalNumber: 36,
  headline: 26,
  /** 탭 화면 최상단 목적 타이틀 (24–28px 권장) */
  screenTitle: 26,
  /** 카드·블록 내부 섹션 제목 (16–18px) */
  cardTitle: 17,
} as const;

/** 탭 화면 최상단 — 화면 목적(설정, 훈련 등) */
export const screenTitleTypography = {
  fontSize: typography.screenTitle,
  fontWeight: '700' as const,
  color: colors.textPrimary,
  lineHeight: Math.round(typography.screenTitle * 1.2),
} as const;

/** 설정·카드 블록 내부 제목 — 연간 목표, 음성 낭독 등 */
export const settingsSectionTitle = {
  fontSize: typography.cardTitle,
  fontWeight: '700' as const,
  color: colors.textPrimary,
  lineHeight: Math.round(typography.cardTitle * 1.35),
} as const;

/** Field labels above inputs — prototype `.input-label` */
export const labelTypography = {
  fontWeight: '500' as const,
  fontSize: 15 as const,
  color: colors.textPrimary,
};
