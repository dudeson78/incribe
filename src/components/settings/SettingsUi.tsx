import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fontFamilies } from '../../theme/fonts';
import { shadowSm, tokens } from '../../theme/tokens';

type SettingsButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SettingsPrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: SettingsButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        settingsStyles.primaryBtn,
        pressed && !disabled && settingsStyles.btnPressed,
        disabled && settingsStyles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={settingsStyles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SettingsSecondaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: SettingsButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        settingsStyles.secondaryBtn,
        pressed && !disabled && settingsStyles.btnPressed,
        disabled && settingsStyles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={settingsStyles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SettingsApplyButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: SettingsButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        settingsStyles.applyBtn,
        pressed && !disabled && settingsStyles.btnPressed,
        disabled && settingsStyles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={settingsStyles.applyBtnText}>{label}</Text>
    </Pressable>
  );
}

export const settingsStyles = StyleSheet.create({
  screenShell: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  headerName: {
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  signOutLink: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 6,
  },
  signOutLinkPressed: {
    opacity: 0.82,
  },
  signOutLinkText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
  },
  signOutLinkTextPressed: {
    textDecorationLine: 'underline',
  },
  screenTitleFallback: {
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.xxl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadowSm,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: tokens.fontSize.lg,
    color: tokens.color.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalInput: {
    width: 100,
    height: 44,
    paddingHorizontal: 14,
    fontSize: tokens.fontSize.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    textAlign: 'center',
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textOnDark,
  },
  primaryBtn: {
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textOnDark,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  secondaryBtnText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  voiceSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    marginBottom: 16,
  },
  voiceSelectText: {
    flex: 1,
    fontSize: tokens.fontSize.sm,
    fontWeight: '500',
    color: tokens.color.textPrimary,
  },
  voiceSelectChevron: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    fontWeight: '600',
  },
  controlGroup: {
    marginBottom: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  controlLabel: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  sliderValue: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '700',
    color: tokens.color.primary,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sliderEndText: {
    fontSize: tokens.fontSize.xs,
    color: tokens.color.textMuted,
  },
  voiceActionStack: {
    gap: 10,
    marginTop: 4,
  },
});
