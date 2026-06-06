import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';
import { tokens } from '../theme/tokens';

const LEAF_COUNT = 7;
const RING_SIZE = 196;
const RING_RADIUS = 70;
const LEAF_W = 22;
const LEAF_H = 34;

type Props = {
  filled: number;
  disabled?: boolean;
  onLeafPress: (index: number) => void;
};

/** 7회 암송 진행 — 원형 링에 잎(필) 7개 */
export function SevenLeafRing({ filled, disabled = false, onLeafPress }: Props) {
  const { t } = useTranslation();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: LEAF_COUNT,
        now: filled,
        text: t('seven.progress', { done: filled, total: LEAF_COUNT }),
      }}
    >
      <View style={styles.ring}>
        {Array.from({ length: LEAF_COUNT }, (_, index) => {
          const done = index < filled;
          const isNext = index === filled;
          const canTap =
            !disabled && (isNext || (filled > 0 && index === filled - 1));
          const angle = (index / LEAF_COUNT) * 2 * Math.PI - Math.PI / 2;
          const left =
            RING_SIZE / 2 + RING_RADIUS * Math.cos(angle) - LEAF_W / 2;
          const top =
            RING_SIZE / 2 + RING_RADIUS * Math.sin(angle) - LEAF_H / 2;
          const rotDeg = (angle * 180) / Math.PI + 90;

          return (
            <Pressable
              key={`leaf-${index}`}
              disabled={!canTap}
              onPress={() => onLeafPress(index)}
              style={({ pressed }) => [
                styles.leafHit,
                {
                  left,
                  top,
                  width: LEAF_W,
                  height: LEAF_H,
                },
                pressed && canTap && styles.leafPressed,
              ]}
              accessibilityLabel={t('seven.a11yCell', {
                rep: t('seven.rep', { n: index + 1 }),
                status: done
                  ? t('seven.statusDone')
                  : isNext
                    ? t('seven.statusCheck')
                    : t('seven.statusWait'),
              })}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.leaf,
                  { transform: [{ rotate: `${rotDeg}deg` }] },
                  done && styles.leafDone,
                  isNext && !done && styles.leafNext,
                  !canTap && !done && styles.leafWait,
                ]}
              />
            </Pressable>
          );
        })}
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerDone}>{filled}</Text>
          <Text style={styles.centerSlash}>/</Text>
          <Text style={styles.centerTotal}>{LEAF_COUNT}</Text>
        </View>
      </View>
      <Text style={styles.caption}>
        {t('seven.progress', { done: filled, total: LEAF_COUNT })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
  },
  leafHit: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    width: LEAF_W,
    height: LEAF_H,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundPrimary,
  },
  leafDone: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  leafNext: {
    borderColor: tokens.color.primary,
    borderWidth: 2,
    backgroundColor: tokens.color.bgSecondary,
  },
  leafWait: {
    opacity: 0.42,
  },
  leafPressed: {
    opacity: 0.88,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerDone: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: tokens.color.primary,
    lineHeight: 32,
  },
  centerSlash: {
    fontSize: typography.min,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 4,
  },
  centerTotal: {
    fontSize: typography.refLarge,
    fontWeight: '600',
    color: colors.muted,
    lineHeight: 28,
    marginTop: 6,
  },
  caption: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
