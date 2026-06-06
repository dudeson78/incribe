import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import {
  ActivityIndicator,
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

import { AppButton } from './ui/AppButton';
import { developmentEmailAccepted, getDevEmailLocalPartRestriction } from '../lib/devEmailAllowlist';
import { isDevelopmentRuntime } from '../lib/isDevelopmentRuntime';
import { mapAppError } from '../i18n/mapAppError';
import { useDialog, type DialogApi } from '../context/DialogContext';
import { supabase } from '../supabase/client';
import { colors, labelTypography, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';

function looksLikeEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function notifyError(err: unknown, t: TFunction, dialog: DialogApi) {
  void dialog.alert({ title: t('errors.title'), message: mapAppError(err, t) });
}

async function resolveEmailPasswordSession(
  t: TFunction,
  dialog: DialogApi,
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
      notifyError(error, t, dialog);
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
      dialog,
    );
    return null;
  }
  return session;
}

function promptLoginSuccessThenEnter(
  t: TFunction,
  dialog: DialogApi,
  onSessionEstablished?: () => void,
) {
  void dialog
    .alert({
      title: t('account.signIn'),
      message: `${t('account.signedInOk')}\n\n${t('auth.signInProceedHint')}`,
    })
    .then(() => onSessionEstablished?.());
}

function promptSignUpSuccessThenEnter(params: {
  t: TFunction;
  dialog: DialogApi;
  detail: string;
  onDone: () => void;
}) {
  void params.dialog
    .alert({
      title: params.t('account.signUpSuccessTitle'),
      message: params.detail,
    })
    .then(() => params.onDone());
}

type AuthFormStep = 'signIn' | 'signUp';

export type EmailAuthLandingProps = {
  initialStep?: AuthFormStep;
  /** ?? ?? ??? ?? */
  presentation?: 'screen' | 'modal';
  onBackToSplash?: () => void;
  onSessionEstablished?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** ??? ???????? ?. ? ??(????)? AppIntroSplash?? ??. */
export function EmailAuthLanding({
  initialStep = 'signIn',
  presentation = 'screen',
  onBackToSplash,
  onSessionEstablished,
  onBusyChange,
}: EmailAuthLandingProps) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<AuthFormStep>(initialStep);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressLine, setProgressLine] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);

  useEffect(() => {
    setStep(initialStep);
    setPassword('');
    setPasswordConfirm('');
    if (initialStep === 'signIn') setPrivacyConsent(false);
  }, [initialStep]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  function goBackToSplash() {
    if (busy) return;
    setPassword('');
    setPasswordConfirm('');
    setPrivacyConsent(false);
    onBackToSplash?.();
  }

  function returnToSplashAfterSignUp() {
    setFullName('');
    setPassword('');
    setPasswordConfirm('');
    setPrivacyConsent(false);
    setProgressLine(null);
    onBackToSplash?.();
  }

  async function onSignUp() {
    const nm = fullName.trim();
    const em = email.trim();
    const pw = password;
    const pwConfirm = passwordConfirm;
    setBusy(true);
    setProgressLine(null);
    try {
      if (!nm || !em || !pw || !pwConfirm) {
        notifyError(new Error(t('account.fillSignUp')), t, dialog);
        return;
      }
      if (!looksLikeEmail(em)) {
        notifyError(new Error(t('account.badEmail')), t, dialog);
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
          dialog,
        );
        return;
      }
      if (pw.length < 6) {
        notifyError(new Error(t('account.weakPassword')), t, dialog);
        return;
      }
      if (pw !== pwConfirm) {
        notifyError(new Error(t('account.passwordMismatch')), t, dialog);
        return;
      }
      if (!privacyConsent) {
        notifyError(new Error(t('auth.privacyConsentRequired')), t, dialog);
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
        const sess = await resolveEmailPasswordSession(
          t,
          dialog,
          data.session,
          'signUp',
        );
        if (!sess) return;
        setPassword('');
        setPasswordConfirm('');
        setProgressLine(null);
        promptSignUpSuccessThenEnter({
          t,
          dialog,
          detail: t('account.signUpSuccessLoggedIn'),
          onDone: () => onSessionEstablished?.(),
        });
        return;
      }

      setPassword('');
      setPasswordConfirm('');
      setProgressLine(null);
      void dialog
        .alert({
          title: t('account.signUpSuccessTitle'),
          message: t('account.signUpSuccessVerifyEmail'),
        })
        .then(() => returnToSplashAfterSignUp());
    } catch (e) {
      notifyError(e, t, dialog);
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
        notifyError(new Error(t('account.fillBoth')), t, dialog);
        return;
      }
      if (!looksLikeEmail(em)) {
        notifyError(new Error(t('account.badEmail')), t, dialog);
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
          dialog,
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
        dialog,
        signData.session ?? null,
        'signIn',
      );
      if (!sess) return;
      setPassword('');
      setProgressLine(null);
      promptLoginSuccessThenEnter(t, dialog, onSessionEstablished);
    } catch (e) {
      notifyError(e, t, dialog);
    } finally {
      setBusy(false);
      setProgressLine(null);
    }
  }

  const isSignUp = step === 'signUp';

  function submitForm() {
    if (busy) return;
    Keyboard.dismiss();
    if (isSignUp && !privacyConsent) {
      notifyError(new Error(t('auth.privacyConsentRequired')), t, dialog);
      return;
    }
    const p = isSignUp ? onSignUp() : onSignIn();
    void p.catch((e) => notifyError(e, t, dialog));
  }

  const topPad =
    presentation === 'modal' ? Math.max(insets.top, 12) : insets.top;

  return (
    <View style={[styles.shell, { paddingTop: topPad }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.formScrollInner}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={goBackToSplash}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('auth.backToWelcome')}
          hitSlop={12}
        >
          <Text style={styles.backLink}>? {t('auth.backToWelcome')}</Text>
        </Pressable>

        <Text style={styles.title}>
          {isSignUp ? t('account.signUp') : t('account.signIn')}
        </Text>

        {isSignUp ? (
          <Text style={styles.intro}>{t('auth.signUpIntro')}</Text>
        ) : null}

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
              placeholderTextColor={`${colors.textPrimary}55`}
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
              placeholderTextColor={`${colors.textPrimary}55`}
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
              placeholderTextColor={`${colors.textPrimary}55`}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={t('account.password')}
              returnKeyType="next"
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
              blurOnSubmit={false}
            />
            <Text style={styles.fieldLabel}>{t('account.passwordConfirm')}</Text>
            <TextInput
              ref={passwordConfirmRef}
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder={t('account.phPasswordConfirm')}
              placeholderTextColor={`${colors.textPrimary}55`}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel={t('account.passwordConfirmA11y')}
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
                  <Text style={styles.checkMark}>?</Text>
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
              placeholderTextColor={`${colors.textPrimary}55`}
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
              placeholderTextColor={`${colors.textPrimary}55`}
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

        <AppButton
          label={isSignUp ? t('account.signUp') : t('account.signIn')}
          onPress={submitForm}
          variant="accent"
          size="md"
          disabled={busy}
          style={[styles.btnPrimaryWideFooter, webPointerStyle]}
          accessibilityLabel={
            isSignUp ? t('account.signUp') : t('account.signIn')
          }
        />

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
  formScrollInner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  backLink: {
    ...labelTypography,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: colors.textPrimary,
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
  devHint: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  fieldHint: {
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 2,
    marginTop: -2,
  },
  progressLine: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
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
  workingWrap: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
  },
  working: {
    fontSize: typography.min,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textOnDark,
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
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
