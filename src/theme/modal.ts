import { StyleSheet } from 'react-native';

import { colors, typography } from './colors';
import { verseTypography } from './fonts';
import { radius } from './layout';

/** 앱 전역 모달 톤 — parchment·overlay·serif 본문 통일 */
export const modalTheme = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shellTop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBackdrop,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.parchment,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    padding: 20,
    gap: 14,
    zIndex: 1,
    maxHeight: '82%',
  },
  title: {
    fontSize: typography.refLarge,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  hint: {
    fontSize: typography.min,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: -4,
  },
  ref: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 340,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  body: {
    ...verseTypography.bodyLarge,
    textAlign: 'left',
  },
  bodyItalic: {
    ...verseTypography.body,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  verseScroll: {
    maxHeight: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.pastelBlueBorderSoft,
    backgroundColor: colors.sky,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  verseScrollText: {
    ...verseTypography.body,
    textAlign: 'left',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
