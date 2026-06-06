/**
 * Design tokens — mirrors src/theme/globals.css for React Native components.
 * Keep in sync when CSS :root values change.
 */
export const tokens = {
  color: {
    primary: '#2D5016',
    primaryLight: '#3D6B20',
    primaryDark: '#1A3A0A',
    accent: '#C8A96E',
    accentMuted: '#F5EDD8',
    bg: '#FAFAF7',
    bgSecondary: '#F3F3EE',
    surface: '#FFFFFF',
    textPrimary: '#1C1C1E',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E8E8E2',
    success: '#4A7C59',
    successBg: '#EDF5F0',
    warning: '#C8A96E',
    warningBg: '#FDF6E8',
    danger: '#DC2626',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FECACA',
    tabBarGlass: 'rgba(255, 255, 255, 0.92)',
    primaryTint08: 'rgba(45, 80, 22, 0.08)',
    textOnDark: '#FFFFFF',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  space: {
    2: 8,
  },
  tabBar: {
    height: 64,
    iconSize: 22,
    transitionMs: 200,
  },
} as const;

/** var(--shadow-sm) */
export const shadowSm = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;

/** var(--shadow-md) */
export const shadowMd = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
} as const;
