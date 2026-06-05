import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, typography } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'accent'
  | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** 라벨 왼쪽에 둘 아이콘/요소 (선택) */
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * 앱 전역 공용 버튼. 색·반경·높이·비활성/로딩 처리를 한 곳에서 관리해
 * 화면마다 제각각이던 버튼 스타일을 수렴한다.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  leading,
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.md,
        fullWidth && styles.fullWidth,
        v.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <View style={styles.content}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text
            style={[
              styles.label,
              size === 'md' && styles.labelMd,
              size === 'sm' && styles.labelSm,
              v.label,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<
  AppButtonVariant,
  {
    container: ViewStyle;
    label: { color: string; fontWeight?: '600' | '700' };
    spinner: string;
  }
> = {
  primary: {
    container: { backgroundColor: colors.forest },
    label: { color: colors.white, fontWeight: '700' },
    spinner: colors.white,
  },
  secondary: {
    container: {
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.creamBorder,
    },
    label: { color: colors.forest, fontWeight: '600' },
    spinner: colors.forest,
  },
  danger: {
    container: { backgroundColor: colors.dangerSolid },
    label: { color: colors.white, fontWeight: '700' },
    spinner: colors.white,
  },
  /** 긍정적 1차 CTA — 연간 목표 적용·축하 모달 등 */
  accent: {
    container: { backgroundColor: colors.orange },
    label: { color: colors.white, fontWeight: '700' },
    spinner: colors.white,
  },
  /** 취소·보조 텍스트 버튼 */
  ghost: {
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderSecondary,
    },
    label: { color: colors.forest, fontWeight: '600' },
    spinner: colors.forest,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    minHeight: touchTarget.min * 0.74,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  md: {
    minHeight: touchTarget.min,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  lg: {
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  labelMd: {
    fontSize: typography.min,
  },
  labelSm: {
    fontSize: typography.min,
    fontWeight: '700',
  },
});
