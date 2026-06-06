import { Ionicons } from '@expo/vector-icons';
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
 * 소프트 라인아트 — scroll은 1:1 미니멀 아이콘, 나머지는 View 채움.
 */
export function EmptyStateIllustration({ variant }: Props) {
  if (variant === 'scroll') {
    return (
      <View
        style={styles.iconSquare}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.iconTile}>
          <Ionicons
            name="book-outline"
            size={38}
            color={colors.forest}
            style={styles.scrollIcon}
          />
          <View style={styles.scrollAccent} />
        </View>
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
const ICON_SQUARE = 88;

const styles = StyleSheet.create({
  frame: {
    width: FRAME,
    height: FRAME,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconSquare: {
    width: ICON_SQUARE,
    height: ICON_SQUARE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconTile: {
    width: ICON_SQUARE,
    height: ICON_SQUARE,
    borderRadius: radius.lg,
    backgroundColor: colors.forestTint,
    borderWidth: 1,
    borderColor: colors.forestTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollIcon: {
    opacity: 0.88,
  },
  scrollAccent: {
    position: 'absolute',
    bottom: 14,
    width: 28,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    opacity: 0.28,
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
