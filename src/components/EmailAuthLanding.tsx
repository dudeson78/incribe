import { useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { developmentEmailAccepted, getDevEmailLocalPartRestriction } from '../lib/devEmailAllowlist';
import { isDevelopmentRuntime } from '../lib/isDevelopmentRuntime';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import { colors, labelTypography, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

function looksLikeEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function notifyError(err: unknown, t: TFunction) {
  const body = mapAppError(err, t);
  if (Platform.OS === 'web') {
    globalThis.alert(`${t('errors.title')}\n\n${body}`);
  } else {
    Alert.alert(t('errors.title'), body);
  }
}

function runAfterInteractions(fn: () => void) {
  if (Platform.OS === 'web') {
    setTimeout(fn, 0);
    return;
  }
  fn();
}

async function resolveEmailPasswordSession(
  t: TFunction,
  hintSession: Session | null,
  context: 'signIn' | 'signUp' = 'signIn',
): Promise<Session | null> {
  let session: Session | null =
    hintSession?.user && !hintSession.user.is_anonymous ? hintSession : null;

  for (
    let attempt = 0;
    attempt < 2 && (!session?.user || session.user.is_anonymous);
    attempt++
  ) {
    if (attempt === 1) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, Platform.OS === 'web' ? 120 : 50);
      });
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      notifyError(error, t);
      return null;
    }
    const cand = data.session;
    if (cand?.user && !cand.user.is_anonymous) {
      session = cand;
    }
  }

  if (!session?.user || session.user.is_anonymous) {
    notifyError(
      new Error(
        context === 'signUp'
          ? t('auth.afterSignUpNoSession')
          : t('auth.afterLoginNoSession'),
      ),
      t,
    );
    return null;
  }
  return session;
}

function promptLoginSuccessThenEnter(
  t: TFunction,
  onSessionEstablished?: () => void,
) {
  const title = t('account.signIn');
  const message =
    `${t('account.signedInOk')}\n\n${t('auth.signInProceedHint')}`;
  const enter = () => onSessionEstablished?.();

  runAfterInteractions(() => {
    if (Platform.OS === 'web') {
      globalThis.alert(`${title}\n\n${message}`);
      enter();
      return;
    }
    Alert.alert(title, message, [{ text: t('common.ok'), onPress: enter }]);
  });
}

function promptSignUpSuccessThenEnter(params: {
  t: TFunction;
  detail: string;
  onDone: () => void;
}) {
  const title = params.t('account.signUpSuccessTitle');
  runAfterInteractions(() => {
    if (Platform.OS === 'web') {
      globalThis.alert(`${title}\n\n${params.detail}`);
      params.onDone();
      return;
    }
    Alert.alert(title, params.detail, [
      { text: params.t('common.ok'), onPress: params.onDone },
    ]);
  });
}

type WelcomeStep = 'welcome' | 'signIn' | 'signUp';

export type EmailAuthLandingProps = {
  onSessionEstablished?: () => void;
};

/** 시작 화면: 앱 소개 후 로그인·회원가입. 회원가입은 이름·이메일·비번만 받고 Supabase 이메일 인증 플로우 사용. */
export function EmailAuthLanding({
  onSessionEstablished,
}: EmailAuthLandingProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<WelcomeStep>('welcome');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressLine, setProgressLine] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function goWelcome() {
    if (busy) return;
    setStep('welcome');
    setPassword('');
    setPrivacyConsent(false);
  }

  function returnToWelcomeAfterSignUp() {
    setFullName('');
    setPassword('');
    setPrivacyConsent(false);
    setProgressLine(null);
    setStep('welcome');
  }

  async function onSignUp() {
    const nm = fullName.trim();
    const em = email.trim();
    const pw = password;
    setBusy(true);
    setProgressLine(null);
    try {
      if (!nm || !em || !pw) {
        notifyError(new Error(t('account.fillSignUp')), t);
        return;
      }
      if (!looksLikeEmail(em)) {
        notifyError(new Error(t('account.badEmail')), t);
        return;
      }
      if (isDevelopmentRuntime() && !developmentEmailAccepted(em)) {
        notifyError(
          new Error(
            t('auth.devAllowedUser', {
              part: getDevEmailLocalPartRestriction() ?? '',
            }),
          ),
          t,
        );
        return;
      }
      if (pw.length < 6) {
        notifyError(new Error(t('account.weakPassword')), t);
        return;
      }
      if (!privacyConsent) {
        notifyError(new Error(t('auth.privacyConsentRequired')), t);
        return;
      }
      setProgressLine(t('auth.signUpWorking'));
      const { data, error } = await supabase.auth.signUp({
        email: em,
        password: pw,
        options: {
          data: {
            full_name: nm,
          },
        },
      });
      if (error) throw error;

      if (data.session?.user && !data.session.user.is_anonymous) {
        setProgressLine(t('auth.signUpConfirmingSession'));
        const sess = await resolveEmailPasswordSession(t, data.session, 'signUp');
        if (!sess) return;
        setPassword('');
        setProgressLine(null);
        promptSignUpSuccessThenEnter({
          t,
          detail: t('account.signUpSuccessLoggedIn'),
          onDone: () => onSessionEstablished?.(),
        });
        return;
      }

      setPassword('');
      setProgressLine(null);
      runAfterInteractions(() => {
        const title = t('account.signUpSuccessTitle');
        const detail = t('account.signUpSuccessVerifyEmail');
        const back = () => returnToWelcomeAfterSignUp();
        if (Platform.OS === 'web') {
          globalThis.alert(`${title}\n\n${detail}`);
          back();
          return;
        }
        Alert.alert(title, detail, [{ text: t('common.ok'), onPress: back }]);
      });
    } catch (e) {
      notifyError(e, t);
    } finally {
      setBusy(false);
      setProgressLine(null);
    }
  }

  async function onSignIn() {
    const em = email.trim();
    const pw = password;
    setBusy(true);
    setProgressLine(null);
    try {
      if (!em || !pw) {
        notifyError(new Error(t('account.fillBoth')), t);
        return;
      }
      if (!looksLikeEmail(em)) {
        notifyError(new Error(t('account.badEmail')), t);
        return;
      }
      if (isDevelopmentRuntime() && !developmentEmailAccepted(em)) {
        notifyError(
          new Error(
            t('auth.devAllowedUser', {
              part: getDevEmailLocalPartRestriction() ?? '',
            }),
          ),
          t,
        );
        return;
      }
      setProgressLine(t('auth.signInWorking'));
      const { data: signData, error } = await supabase.auth.signInWithPassword({
        email: em,
        password: pw,
      });
      if (error) throw error;
      setProgressLine(t('auth.signInReadingSession'));
      const sess = await resolveEmailPasswordSession(
        t,
        signData.session ?? null,
        'signIn',
      );
      if (!sess) return;
      setPassword('');
      setProgressLine(null);
      promptLoginSuccessThenEnter(t, onSessionEstablished);
    } catch (e) {
      notifyError(e, t);
    } finally {
      setBusy(false);
      setProgressLine(null);
    }
  }

  if (step === 'welcome') {
    return (
      <View style={[styles.shell, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.welcomeScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.welcomeAppTitle}>{t('tabs.appTitle')}</Text>
            <Text style={styles.welcomeTagline}>{t('tabs.appSubtitle')}</Text>
            <Text style={styles.welcomeBlurb}>{t('auth.welcomeBlurb')}</Text>
          </View>
        </ScrollView>
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('account.signIn')}
            style={({ pressed }) => [
              styles.btnOutlined,
              pressed && pressedOpacity,
              busy && btnDisabled,
            ]}
            onPress={() => {
              setStep('signIn');
              setPassword('');
            }}
            disabled={busy}
          >
            <Text style={styles.btnOutlinedText}>{t('account.signIn')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('account.signUp')}
            style={({ pressed }) => [
              styles.btnPrimaryWide,
              pressed && pressedOpacity,
              busy && btnDisabled,
            ]}
            onPress={() => {
              setStep('signUp');
              setPassword('');
              setPrivacyConsent(false);
            }}
            disabled={busy}
          >
            <Text style={styles.btnPrimaryText}>{t('account.signUp')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isSignUp = step === 'signUp';

  function submitForm() {
    if (busy) return;
    Keyboard.dismiss();
    if (isSignUp && !privacyConsent) {
      notifyError(new Error(t('auth.privacyConsentRequired')), t);
      return;
    }
    const p = isSignUp ? onSignUp() : onSignIn();
    void p.catch((e) => notifyError(e, t));
  }

  return (
    <View style={[styles.shell, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.formScrollInner}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={goWelcome}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('auth.backToWelcome')}
          hitSlop={12}
        >
          <Text style={styles.backLink}>‹ {t('auth.backToWelcome')}</Text>
        </Pressable>

        <Text style={styles.title}>
          {isSignUp ? t('account.signUp') : t('account.signIn')}
        </Text>

        {isSignUp ? (
          <Text style={styles.intro}>{t('auth.signUpIntro')}</Text>
        ) : (
          <Text style={styles.body}>{t('auth.emailGateBodySignIn')}</Text>
        )}

        {isDevelopmentRuntime() &&
        getDevEmailLocalPartRestriction() != null ? (
          <Text style={styles.devHint}>
            {t('auth.devAllowedUserHint', {
              part: getDevEmailLocalPartRestriction() ?? '',
            })}
          </Text>
        ) : null}

        {isSignUp ? (
          <>
            <Text style={styles.fieldLabel}>{t('account.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('account.phName')}
              placeholderTextColor={`${colors.forest}55`}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={t('account.fullNameA11y')}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
            <Text style={styles.fieldLabel}>{t('account.email')}</Text>
            <Text style={styles.fieldHint}>{t('account.emailIdHint')}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('account.phEmail')}
              placeholderTextColor={`${colors.forest}55`}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!busy}
              accessibilityLabel={t('account.email')}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <Text style={styles.fieldLabel}>{t('account.password')}</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('account.phPassword')}
              placeholderTextColor={`${colors.forest}55`}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={t('account.password')}
              returnKeyType="done"
              onSubmitEditing={submitForm}
            />

            <View style={styles.privacyNoticeBox}>
              <Text style={styles.privacyNoticeText}>
                {t('auth.privacySignUpNotice')}
              </Text>
            </View>
            <Pressable
              style={styles.consentRow}
              disabled={busy}
              onPress={() => setPrivacyConsent((c) => !c)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyConsent }}
              accessibilityLabel={t('auth.privacyConsentCheck')}
            >
              <View
                style={[
                  styles.checkOuter,
                  privacyConsent && styles.checkOuterOn,
                ]}
              >
                {privacyConsent ? (
                  <Text style={styles.checkMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.consentLabel}>
                {t('auth.privacyConsentCheck')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>{t('account.email')}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('account.phEmail')}
              placeholderTextColor={`${colors.forest}55`}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!busy}
              accessibilityLabel={t('account.email')}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <Text style={styles.fieldLabel}>{t('account.password')}</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('account.phPassword')}
              placeholderTextColor={`${colors.forest}55`}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={t('account.password')}
              returnKeyType="done"
              onSubmitEditing={submitForm}
            />
          </>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <View
        style={[
          styles.formFooter,
          {
            paddingBottom: Math.max(insets.bottom + 12, 20),
          },
        ]}
      >
        {progressLine ? (
          <Text
            style={styles.progressLine}
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {progressLine}
          </Text>
        ) : null}

        {isSignUp && !privacyConsent && !busy ? (
          <Text
            style={styles.consentButtonHint}
            accessibilityLiveRegion="polite"
          >
            {t('auth.signUpNeedConsentHint')}
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.btnPrimaryWide,
            styles.btnPrimaryWideFooter,
            pressed && pressedOpacity,
            busy && btnDisabled,
            webPointerStyle,
          ]}
          onPress={submitForm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            isSignUp ? t('account.signUp') : t('account.signIn')
          }
        >
          <Text style={styles.btnPrimaryText}>
            {isSignUp ? t('account.signUp') : t('account.signIn')}
          </Text>
        </Pressable>

        {busy ? (
          <View style={styles.workingWrap}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.working}>{t('account.working')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const pressedOpacity = { opacity: 0.92 };
const btnDisabled = { opacity: 0.55 };

const webPointerStyle = Platform.select<{ cursor: 'pointer' } | undefined>({
  web: { cursor: 'pointer' },
  default: undefined,
});

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  welcomeScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  welcomeAppTitle: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: colors.forest,
    textAlign: 'center',
  },
  welcomeTagline: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  welcomeBlurb: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomActions: {
    paddingHorizontal: 24,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${colors.forest}22`,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  btnOutlined: {
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.forest,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnOutlinedText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
  },
  formScrollInner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  backLink: {
    ...labelTypography,
    color: colors.forest,
    textDecorationLine: 'underline',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 8,
  },
  intro: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  devHint: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.orange,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    alignSelf: 'flex-start',
    marginTop: 6,
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.forest,
  },
  fieldHint: {
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.muted,
    alignSelf: 'flex-start',
    marginBottom: 2,
    marginTop: -2,
  },
  progressLine: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.forest,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: `${colors.forest}33`,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: typography.body,
    backgroundColor: colors.card,
    minHeight: touchTarget.min * 0.85,
    color: colors.textPrimary,
  },
  btnPrimaryWide: {
    marginTop: 14,
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  btnPrimaryWideFooter: {
    marginTop: 0,
  },
  formFooter: {
    paddingHorizontal: 24,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${colors.forest}22`,
    backgroundColor: colors.background,
  },
  btnPrimaryText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  workingWrap: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
  },
  working: {
    fontSize: typography.min,
    color: colors.muted,
  },
  privacyNoticeBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.forest}33`,
  },
  privacyNoticeText: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
    paddingVertical: 4,
  },
  checkOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.forest,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkOuterOn: {
    backgroundColor: colors.forest,
  },
  checkMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  consentLabel: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  consentButtonHint: {
    marginTop: 10,
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.orange,
    fontWeight: '600',
    textAlign: 'center',
  },
});
