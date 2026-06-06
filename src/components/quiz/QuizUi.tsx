import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { fontFamilies } from '../../theme/fonts';
import { shadowMd, tokens } from '../../theme/tokens';

type QuizPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** 퀴즈 확인 버튼 — STEP 4 말씀듣기와 동일 톤 */
export function QuizPrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: QuizPrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        quizStyles.confirmBtn,
        pressed && !disabled && quizStyles.confirmBtnPressed,
        disabled && quizStyles.confirmBtnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={quizStyles.confirmBtnText}>{label}</Text>
    </Pressable>
  );
}

export const quizStyles = StyleSheet.create({
  verseCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadowMd,
  },
  prompt: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  verseText: {
    fontFamily: fontFamilies.verse,
    fontSize: tokens.fontSize.lg,
    lineHeight: Math.round(tokens.fontSize.lg * 1.9),
    color: tokens.color.textPrimary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  answerInput: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    marginBottom: 12,
    textAlign: 'center',
  },
  answerInputFocused: {
    borderColor: tokens.color.primary,
    shadowColor: tokens.color.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  confirmBtn: {
    height: 52,
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 4,
    marginBottom: 8,
  },
  confirmBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 1.01 }],
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: tokens.fontSize.md,
    fontWeight: '600',
    color: tokens.color.textOnDark,
  },
});
