import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { tokens } from '../theme/tokens';

const LEAF_COUNT = 7;
const DOT = 12;
const ROW_GAP = 10;
const COL_GAP = 14;

/** 3-3-1 행별 인덱스 */
const GRID_ROWS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6],
];

type Props = {
  filled: number;
  disabled?: boolean;
  onLeafPress: (index: number) => void;
};

/** 7회 암송 진행 — 12px 원형 점 3-3-1 배치 */
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
      <View style={styles.grid}>
        {GRID_ROWS.map((row, rowIx) => (
          <View
            key={`row-${rowIx}`}
            style={[styles.dotRow, row.length === 1 && styles.dotRowSingle]}
          >
            {row.map((index) => {
              const done = index < filled;
              const isNext = index === filled;
              const canTap =
                !disabled && (isNext || (filled > 0 && index === filled - 1));

              return (
                <Pressable
                  key={`dot-${index}`}
                  disabled={!canTap}
                  onPress={() => onLeafPress(index)}
                  style={({ pressed }) => [
                    styles.dotHit,
                    pressed && canTap && styles.dotPressed,
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
                      styles.dot,
                      done && styles.dotDone,
                      isNext && !done && styles.dotNext,
                      !canTap && !done && styles.dotWait,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.counter}>
        {filled}/{LEAF_COUNT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
  },
  grid: {
    alignItems: 'center',
    gap: ROW_GAP,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: COL_GAP,
  },
  dotRowSingle: {
    justifyContent: 'center',
  },
  dotHit: {
    width: DOT + 8,
    height: DOT + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: tokens.color.border,
  },
  dotDone: {
    backgroundColor: tokens.color.primary,
  },
  dotNext: {
    backgroundColor: tokens.color.bgSecondary,
    borderWidth: 2,
    borderColor: tokens.color.primary,
  },
  dotWait: {
    opacity: 0.55,
  },
  dotPressed: {
    opacity: 0.85,
  },
  counter: {
    fontSize: tokens.fontSize.xl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
});
