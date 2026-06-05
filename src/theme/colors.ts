/** Matches `bible_memory_app_prototype.html` tokens */
export const colors = {
  forest: '#2D5A3D',
  orange: '#FF8C42',
  /** Screen scroll area (warm gray canvas) */
  background: '#EFEEE8',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F0EFE9',
  textPrimary: '#1E2822',
  textSecondary: '#5C665E',
  borderSecondary: '#D8DCD9',
  borderTertiary: '#E4E6E4',
  /** Verse / quiz paper card */
  cream: '#F9F6F0',
  creamBorder: '#D4C9A8',
  card: '#FFFFFF',
  white: '#FFFFFF',
  muted: '#5C665E',
  badgeShortBg: '#FFF3E0',
  badgeShortText: '#E65100',
  badgeLongBg: '#E8F5E9',
  badgeLongText: '#2E7D32',
  circleNumBg: '#E8F5E9',
  successBg: '#E8F5E9',
  successBorder: '#2E7D32',
  errorBg: '#FFEBEE',
  errorBorder: '#C62828',
  /** 파스텔 블루 — 말씀 본문 영역 / 빈칸 퀴즈 정답 강조 */
  pastelBlueBg: '#E8F0FE',
  pastelBlueBorderSoft: '#BBD9F2',
  pastelBlueBorder: '#4A80D9',
  pastelBlueText: '#2E5BBF',
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
  color: colors.forest,
} as const;

/** Field labels above inputs — prototype `.input-label` */
export const labelTypography = {
  fontWeight: '500' as const,
  fontSize: 15 as const,
  color: colors.textPrimary,
};
