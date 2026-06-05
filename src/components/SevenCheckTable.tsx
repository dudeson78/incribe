import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

const SESSION_SIZE = 7;

type SevenCheckTableProps = {
  /** 7칸을 모두 채웠을 때(축하 UI 등) */
  onAllFilled: () => void;
  disabled?: boolean;
  /** 기본값: `seven.sectionLabel`. 빈 문자열이면 제목 줄을 렌더하지 않음 */
  heading?: string;
  /** 기본값: `seven.captionRecite`. 빈 문자열이면 안내 줄을 렌더하지 않음 */
  caption?: string;
};

/**
 * 1행: 1회~7회 라벨, 2행: 순차 탭(다음 칸만) / 마지막 완료 칸 탭으로 한 단계 취소
 */
export function SevenCheckTable({
  onAllFilled,
  disabled = false,
  heading,
  caption,
}: SevenCheckTableProps) {
  const { t } = useTranslation();
  const headingText = heading ?? t('seven.sectionLabel');
  const captionText =
    caption !== undefined ? caption : t('seven.captionRecite');
  /** 완료된 단계 수 0~7 */
  const [filled, setFilled] = useState(0);

  function onCellPress(index: number) {
    if (disabled) return;
    if (index === filled && filled < SESSION_SIZE) {
      const next = filled + 1;
      setFilled(next);
      if (next === SESSION_SIZE) {
        onAllFilled();
      }
      return;
    }
    if (index === filled - 1 && filled > 0) {
      setFilled(filled - 1);
    }
  }

  const labels = Array.from({ length: SESSION_SIZE }, (_, i) =>
    t('seven.rep', { n: i + 1 })
  );

  return (
    <View style={styles.wrap}>
      {headingText.trim() !== '' ? (
        <Text style={styles.sectionLabel}>{headingText}</Text>
      ) : null}
      {captionText.trim() !== '' ? (
        <Text style={styles.caption}>{captionText}</Text>
      ) : null}
      <View style={styles.headerRow}>
        {labels.map((label) => (
          <Text key={label} style={styles.headerCell}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.cellRow}>
        {labels.map((_, index) => {
          const done = index < filled;
          const isNext = index === filled;
          const canTap =
            !disabled && (isNext || (filled > 0 && index === filled - 1));
          return (
            <Pressable
              key={`cell-${index}`}
              disabled={!canTap}
              onPress={() => onCellPress(index)}
              style={({ pressed }) => [
                styles.cell,
                done && styles.cellDone,
                isNext && !done && styles.cellNext,
                !canTap && !done && styles.cellDisabled,
                pressed && canTap && styles.cellPressed,
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
              <Text style={[styles.mark, done && styles.markDone]}>
                {done ? '✓' : index + 1}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.progress}>
        {t('seven.progress', { done: filled, total: SESSION_SIZE })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    gap: 10,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 0,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingVertical: 4,
  },
  cellRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundPrimary,
  },
  cellNext: {
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1.5,
  },
  cellDone: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  cellDisabled: {
    opacity: 0.45,
  },
  cellPressed: {
    opacity: 0.85,
  },
  mark: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  markDone: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  progress: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
