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
} as const;

export const typography = {
  caption: 12,
  min: 15,
  chip: 11,
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

/** Field labels above inputs — prototype `.input-label` */
export const labelTypography = {
  fontWeight: '500' as const,
  fontSize: 15 as const,
  color: colors.textPrimary,
};
