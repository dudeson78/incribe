import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from './ui/AppButton';
import { fontFamilies } from '../theme/fonts';
import { radius, touchTarget } from '../theme/layout';
import { SPLASH_FADE_MS, SPLASH_HOLD_MS } from '../theme/motion';
import { tokens } from '../theme/tokens';

const BRAND_MARK = 'INCRIBE';

const SPLASH_GRADIENT = ['#1A4A66', '#2B6B8F', '#1E3D56'] as const;

/** SVG 노이즈 패턴 오버레이 */
const NOISE_PATTERN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

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
 * 앱 첫 화면 — 진한 하늘색 그라데이션, INCRIBE 워드마크, 신 6:6.
 * 웹·네이티브 동일 StyleSheet (CSS 파일 의존 없음).
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
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const fadeStarted = useRef(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(16)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(verseOpacity, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [heroOpacity, heroTranslateY, verseOpacity]);

  useEffect(() => {
    if (!autoFadeOut || fadeStarted.current) return;

    const holdTimer = setTimeout(() => {
      fadeStarted.current = true;
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFadeComplete?.();
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(holdTimer);
  }, [autoFadeOut, onFadeComplete, screenOpacity]);

  return (
    <Animated.View
      style={[
        styles.root,
        style,
        { opacity: autoFadeOut ? screenOpacity : 1 },
      ]}
      pointerEvents={showAuthButtons ? 'auto' : 'box-none'}
    >
      <LinearGradient
        colors={[...SPLASH_GRADIENT]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={{ uri: NOISE_PATTERN_URI }}
        style={styles.noiseOverlay}
        resizeMode="repeat"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline} accessibilityRole="text">
            {t('splash.tagline')}
          </Text>
          <Text style={styles.brand} accessibilityRole="header">
            {BRAND_MARK}
          </Text>
        </Animated.View>

        <Animated.View
          style={[styles.verseWrap, { opacity: verseOpacity }]}
        >
          <Text style={styles.verseBody} accessibilityRole="text">
            {t('splash.verseBody')}
          </Text>
          <Text style={styles.verseRef} accessibilityRole="text">
            {t('splash.verseRef')}
          </Text>
        </Animated.View>
      </View>

      {showAuthButtons ? (
        <View
          style={[
            styles.authRow,
            {
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 24,
            },
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
    overflow: 'hidden',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '300',
    letterSpacing: tokens.fontSize.sm * 0.3,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 8,
  },
  brand: {
    fontFamily: fontFamilies.verseBlack,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 52 * 0.08,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(200,169,110,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
  verseWrap: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 280,
  },
  verseBody: {
    fontFamily: fontFamilies.verse,
    fontSize: tokens.fontSize.lg,
    lineHeight: Math.round(tokens.fontSize.lg * 1.8),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    maxWidth: 280,
  },
  verseRef: {
    fontFamily: fontFamilies.verseMedium,
    fontSize: tokens.fontSize.sm,
    fontWeight: '600',
    color: tokens.color.accent,
    textAlign: 'center',
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
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnOutlinedText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.92,
  },
});
