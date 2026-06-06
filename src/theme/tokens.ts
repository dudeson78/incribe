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
    bg: '#FAFAF7',
    bgSecondary: '#F3F3EE',
    surface: '#FFFFFF',
    textPrimary: '#1C1C1E',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E8E8E2',
    success: '#4A7C59',
    tabBarGlass: 'rgba(255, 255, 255, 0.92)',
    primaryTint08: 'rgba(45, 80, 22, 0.08)',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
  },
  radius: {
    full: 9999,
  },
  tabBar: {
    height: 64,
    iconSize: 22,
    transitionMs: 200,
  },
} as const;
