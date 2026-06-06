import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SevenLeafRing } from './SevenLeafRing';
import { colors, typography } from '../theme/colors';

const SESSION_SIZE = 7;

type SevenCheckTableProps = {
  /** 7칸을 모두 채웠을 때(축하 UI 등) */
  onAllFilled: () => void;
  disabled?: boolean;
  /** 기본값: `seven.sectionLabel`. 빈 문자열이면 제목 줄을 렌더하지 않음 */
  heading?: string;
  /** 기본값: `seven.captionRecite`. 빈 문자열이면 안내 줄을 렌더하지 않음 */
  caption?: string;
  /** 훈련 parchment 카드 안에 넣을 때 — 별도 박스 테두리 제거 */
  embedded?: boolean;
};

/**
 * 7잎 링으로 순차 탭(다음 잎만) / 마지막 완료 잎 탭으로 한 단계 취소
 */
export function SevenCheckTable({
  onAllFilled,
  disabled = false,
  heading,
  caption,
  embedded = false,
}: SevenCheckTableProps) {
  const { t } = useTranslation();
  const headingText = heading ?? t('seven.sectionLabel');
  const captionText =
    caption !== undefined ? caption : t('seven.captionRecite');
  /** 완료된 단계 수 0~7 */
  const [filled, setFilled] = useState(0);

  function onLeafPress(index: number) {
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

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      {headingText.trim() !== '' ? (
        <Text style={styles.sectionLabel}>{headingText}</Text>
      ) : null}
      {captionText.trim() !== '' ? (
        <Text style={styles.caption}>{captionText}</Text>
      ) : null}
      <SevenLeafRing
        filled={filled}
        disabled={disabled}
        onLeafPress={onLeafPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    gap: 10,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.borderTertiary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 4,
    alignItems: 'center',
  },
  wrapEmbedded: {
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  caption: {
    fontSize: typography.min,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
