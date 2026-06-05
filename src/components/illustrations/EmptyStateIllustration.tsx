import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/layout';

export type EmptyIllustrationVariant =
  | 'scroll'
  | 'leaves'
  | 'quiz'
  | 'seedling';

type Props = {
  variant: EmptyIllustrationVariant;
};

/**
 * 선 없는 소프트 라인아트 — View·채움색만 (SVG 없음).
 * scroll=양피지, leaves=7잎, quiz=칩, seedling=새싹
 */
export function EmptyStateIllustration({ variant }: Props) {
  if (variant === 'scroll') {
    return (
      <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.scrollBack} />
        <View style={styles.scrollFront}>
          <View style={[styles.textLine, styles.textLineLong]} />
          <View style={[styles.textLine, styles.textLineMid]} />
          <View style={[styles.textLine, styles.textLineShort]} />
        </View>
        <View style={styles.scrollMark} />
      </View>
    );
  }

  if (variant === 'leaves') {
    const leafAngles = Array.from(
      { length: 7 },
      (_, i) => (i / 7) * 360 - 90,
    );
    return (
      <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.leafRing}>
          {leafAngles.map((deg) => (
            <View
              key={deg}
              style={[
                styles.leafPetal,
                { transform: [{ rotate: `${deg}deg` }, { translateY: -28 }] },
              ]}
            />
          ))}
        </View>
        <View style={styles.leafCenter} />
      </View>
    );
  }

  if (variant === 'quiz') {
    return (
      <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.quizChip, styles.quizChipSky]} />
        <View style={[styles.quizChip, styles.quizChipSage]} />
        <View style={[styles.quizChip, styles.quizChipDawn]} />
        <View style={styles.quizDot} />
      </View>
    );
  }

  return (
    <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.pot} />
      <View style={styles.stem} />
      <View style={[styles.sproutLeaf, styles.sproutLeft]} />
      <View style={[styles.sproutLeaf, styles.sproutRight]} />
      <View style={styles.sunGlow} />
    </View>
  );
}

const FRAME = 112;

const styles = StyleSheet.create({
  frame: {
    width: FRAME,
    height: FRAME,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scrollBack: {
    position: 'absolute',
    width: 72,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSecondary,
    transform: [{ rotate: '-6deg' }, { translateX: -6 }],
  },
  scrollFront: {
    width: 76,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.parchment,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 8,
    transform: [{ rotate: '4deg' }],
  },
  textLine: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    opacity: 0.85,
  },
  textLineLong: { width: '100%' },
  textLineMid: { width: '78%', alignSelf: 'center' },
  textLineShort: { width: '52%', alignSelf: 'center' },
  scrollMark: {
    position: 'absolute',
    bottom: 10,
    right: 18,
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    opacity: 0.35,
  },
  leafRing: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafPetal: {
    position: 'absolute',
    width: 14,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    opacity: 0.75,
  },
  leafCenter: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.orangeTint,
  },
  quizChip: {
    position: 'absolute',
    height: 14,
    borderRadius: radius.pill,
    opacity: 0.9,
  },
  quizChipSky: {
    width: 56,
    backgroundColor: colors.sky,
    top: 28,
    left: 20,
    transform: [{ rotate: '-8deg' }],
  },
  quizChipSage: {
    width: 48,
    backgroundColor: colors.sage,
    top: 48,
    left: 32,
    transform: [{ rotate: '4deg' }],
  },
  quizChipDawn: {
    width: 40,
    backgroundColor: colors.orangeTint,
    top: 66,
    left: 42,
    transform: [{ rotate: '-3deg' }],
  },
  quizDot: {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    opacity: 0.2,
  },
  pot: {
    position: 'absolute',
    bottom: 8,
    width: 52,
    height: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: colors.orangeTint,
  },
  stem: {
    position: 'absolute',
    bottom: 32,
    width: 6,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    opacity: 0.45,
  },
  sproutLeaf: {
    position: 'absolute',
    width: 22,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    bottom: 52,
  },
  sproutLeft: {
    left: 34,
    transform: [{ rotate: '-32deg' }],
  },
  sproutRight: {
    right: 34,
    transform: [{ rotate: '32deg' }],
  },
  sunGlow: {
    position: 'absolute',
    top: 14,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.orangeTint,
    opacity: 0.65,
  },
});
