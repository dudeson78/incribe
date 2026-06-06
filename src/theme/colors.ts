/**
 * 「말씀의 정원」 파스텔 팔레트 v1
 * mist·parchment·olive·dawn·sky·sage·rose
 *
 * 기존 키(forest, orange, cream…)는 유지하되 값만 새 팔레트로 매핑해
 * 전역 import 변경 없이 1주차 톤 전환.
 */
export const colors = {
  /** 브랜드 — 올리브 (구 forest) */
  forest: '#5A7D62',
  olive: '#5A7D62',

  /** 강조 — 새벽빛 (구 orange) */
  orange: '#E8B88A',
  dawn: '#E8B88A',

  /** 캔버스 — 흰 배경 (원래 톤 복원) */
  mist: '#FFFFFF',
  background: '#FFFFFF',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',

  /** 말씀·카드 — 흰 카드, 파스텔은 sky·sage 등 액센트만 */
  parchment: '#FFFFFF',
  cream: '#FFFFFF',
  card: '#FFFFFF',
  creamBorder: '#E0E0E0',

  white: '#FFFFFF',
  /** UI 글자 — 밝은 배경용 검정 */
  text: '#000000',
  textPrimary: '#000000',
  /** 밝은 배경에서도 동일(회색 글자 금지) */
  textSecondary: '#000000',
  /** 어두운·채움 버튼·카드용 흰 글자 */
  textOnDark: '#FFFFFF',
  borderSecondary: '#D8DCD9',
  borderTertiary: '#E8E8E8',
  muted: '#000000',

  /** 단기 트랙 — dawn 틴트 */
  badgeShortBg: '#F5E8D8',
  badgeShortText: '#000000',

  /** 장기·성장 — sage */
  sage: '#DDE8DC',
  badgeLongBg: '#DDE8DC',
  badgeLongText: '#000000',
  circleNumBg: '#DDE8DC',
  successBg: '#DDE8DC',
  successBorder: '#5A7D62',

  /** 주의 — rose 파스텔 */
  rose: '#F5D5D8',
  errorBg: '#F5D5D8',
  errorBorder: '#9E4B55',
  dangerSolid: '#9E4B55',

  /** 모달 딤 + 버튼 틴트 */
  overlayBackdrop: 'rgba(42, 51, 46, 0.38)',
  forestTint: 'rgba(90, 125, 98, 0.10)',
  forestTintBorder: 'rgba(90, 125, 98, 0.30)',
  forestTintActive: 'rgba(90, 125, 98, 0.18)',
  orangeTint: 'rgba(232, 184, 138, 0.18)',
  orangeTintBorder: 'rgba(232, 184, 138, 0.45)',

  /** 말씀 하이라이트 — sky (구 pastel blue) */
  sky: '#D6E8F5',
  /** 첫 화면·스플래시 — 진한 하늘색 */
  skyDeep: '#95C4E3',
  pastelBlueBg: '#D6E8F5',
  pastelBlueBorderSoft: '#B8D4E8',
  pastelBlueBorder: '#7AADC8',
  pastelBlueText: '#000000',
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
} as const;

/** MY(설정) 화면 섹션 제목 — 연간 목표 등 블록 라벨 */
export const settingsSectionTitle = {
  fontSize: typography.headline,
  fontWeight: '700' as const,
  color: colors.textPrimary,
} as const;

/** Field labels above inputs — prototype `.input-label` */
export const labelTypography = {
  fontWeight: '500' as const,
  fontSize: 15 as const,
  color: colors.textPrimary,
};
