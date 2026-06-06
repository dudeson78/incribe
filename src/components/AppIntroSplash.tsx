import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from './ui/AppButton';
import { colors, typography } from '../theme/colors';
import { verseTypography } from '../theme/fonts';
import { radius, touchTarget } from '../theme/layout';
import { SPLASH_FADE_MS, SPLASH_HOLD_MS } from '../theme/motion';

const BRAND_MARK = 'INCRIBE';

type Props = {
  style?: StyleProp<ViewStyle>;
  /** 로그인·회원가입 버튼 표시 (미로그인) */
  showAuthButtons?: boolean;
  onSignIn?: () => void;
  onSignUp?: () => void;
  /** true면 잠시 대기 후 페이드아웃 */
  autoFadeOut?: boolean;
  onFadeComplete?: () => void;
};

/**
 * 앱 첫 화면 — 진한 하늘색 배경, 중앙 INCRIBE.
 * 로그인 상태면 잠깐 보여준 뒤 페이드아웃, 미로그인이면 버튼을 함께 표시.
 */
export function AppIntroSplash({
  style,
  showAuthButtons = false,
  onSignIn,
  onSignUp,
  autoFadeOut = false,
  onFadeComplete,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const fadeStarted = useRef(false);

  useEffect(() => {
    if (!autoFadeOut || fadeStarted.current) return;

    const holdTimer = setTimeout(() => {
      fadeStarted.current = true;
      Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFadeComplete?.();
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(holdTimer);
  }, [autoFadeOut, onFadeComplete, opacity]);

  return (
    <Animated.View
      style={[styles.root, style, { opacity: autoFadeOut ? opacity : 1 }]}
      pointerEvents={showAuthButtons ? 'auto' : 'box-none'}
    >
      <View style={styles.center}>
        <View style={styles.hero}>
          <Text style={styles.tagline} accessibilityRole="text">
            {t('splash.tagline')}
          </Text>
          <Text style={styles.brand} accessibilityRole="header">
            {BRAND_MARK}
          </Text>
        </View>
        <Text style={styles.verse} accessibilityRole="text">
          {t('splash.verse')}
        </Text>
      </View>

      {showAuthButtons ? (
        <View
          style={[
            styles.authRow,
            { paddingBottom: insets.bottom + 24, paddingHorizontal: 24 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('account.signIn')}
            style={({ pressed }) => [
              styles.btnOutlined,
              styles.btnHalf,
              pressed && styles.pressed,
            ]}
            onPress={onSignIn}
          >
            <Text style={styles.btnOutlinedText}>{t('account.signIn')}</Text>
          </Pressable>
          <AppButton
            label={t('account.signUp')}
            onPress={() => onSignUp?.()}
            variant="accent"
            size="md"
            fullWidth={false}
            style={styles.btnHalf}
            accessibilityLabel={t('account.signUp')}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.skyDeep,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  brand: {
    fontSize: typography.goalNumber,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  verse: {
    ...verseTypography.body,
    fontSize: typography.min,
    lineHeight: Math.round(typography.min * 1.65),
    textAlign: 'center',
    maxWidth: 320,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    paddingTop: 16,
  },
  btnHalf: {
    flex: 1,
    minWidth: 0,
  },
  btnOutlined: {
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.forest,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnOutlinedText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.92,
  },
});
