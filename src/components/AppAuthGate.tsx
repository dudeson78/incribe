import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './ui/AppButton';
import { AppIntroSplash } from './AppIntroSplash';
import { EmailAuthLanding } from './EmailAuthLanding';
import { FadeModal } from './ui/FadeModal';
import { primeAuthSession } from '../lib/primeAuthSession';
import {
  isSupabaseConfigured,
  supabase,
} from '../supabase/client';
import { colors, typography } from '../theme/colors';
import { radius, touchTarget } from '../theme/layout';
import { modalTheme } from '../theme/modal';

/**
 * `EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE=true` ?? ??? ?? ?? ?? ??.
 * ??? ??? Supabase ????? ??? ?????(??: ?? ??? ?? ?? ?? ??? env).
 */
function bypassEmailAuthGateFromEnv(): boolean {
  const v =
    typeof process.env.EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE === 'string'
      ? process.env.EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE.trim().toLowerCase()
      : '';
  return v === 'true' || v === '1' || v === 'yes';
}

const BYPASS_EMAIL_AUTH_GATE = bypassEmailAuthGateFromEnv();

type AuthForm = 'none' | 'signIn' | 'signUp';

export function AppAuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'auth' | 'error'>(
    'loading',
  );
  const [primeDetail, setPrimeDetail] = useState<string | undefined>();
  const [bootstrapMissingEnv, setBootstrapMissingEnv] = useState(false);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const [introVisible, setIntroVisible] = useState(true);
  const [authForm, setAuthForm] = useState<AuthForm>('none');
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsub: { unsubscribe: () => void } | undefined;

    void (async () => {
      setPhase('loading');
      setPrimeDetail(undefined);
      setBootstrapMissingEnv(false);

      if (!isSupabaseConfigured) {
        if (!mounted) return;
        setBootstrapMissingEnv(true);
        setPhase('error');
        return;
      }

      const r = await primeAuthSession();
      if (!mounted) return;

      if (r.ok) {
        setPhase('ready');
      } else if ('needsAuth' in r && r.needsAuth) {
        if (BYPASS_EMAIL_AUTH_GATE) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const hasUser =
            session?.user && !session.user.is_anonymous ? true : false;
          if (__DEV__ && !hasUser) {
            console.warn(
              '[Inscribe] Auth gate bypassed without a signed-in user. verses load requires auth.uid(). ' +
                'Use the email login screen, or set EXPO_PUBLIC_DEV_LOGIN_EMAIL + EXPO_PUBLIC_DEV_LOGIN_PASSWORD in .env (dev), ' +
                'or EXPO_PUBLIC_DEV_SUPABASE_ACCESS_TOKEN + EXPO_PUBLIC_DEV_SUPABASE_REFRESH_TOKEN. ' +
                'Unset EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE to show the login screen.',
            );
          }
        }
        setPhase(BYPASS_EMAIL_AUTH_GATE ? 'ready' : 'auth');
      } else {
        setPrimeDetail('errorMessage' in r ? r.errorMessage : undefined);
        setPhase('error');
        return;
      }

      const authListenerReturn = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;
          if (!session?.user) {
            if (!BYPASS_EMAIL_AUTH_GATE) {
              setPhase('auth');
              setAuthForm('none');
              setIntroVisible(true);
            }
            return;
          }
          if (session.user.is_anonymous) {
            await supabase.auth.signOut();
            if (mounted && !BYPASS_EMAIL_AUTH_GATE) {
              setPhase('auth');
              setAuthForm('none');
              setIntroVisible(true);
            }
            return;
          }
          if (mounted) setPhase('ready');
        },
      );
      unsub = authListenerReturn.data.subscription;
    })();

    return () => {
      mounted = false;
      unsub?.unsubscribe();
    };
  }, [bootstrapNonce]);

  useEffect(() => {
    if (phase === 'error') {
      setIntroVisible(false);
    }
  }, [phase]);

  /** ??? ???·?? ?? ??? ???? ?? ?? ?? */
  useEffect(() => {
    if (phase === 'ready' && authForm !== 'none') {
      setIntroVisible(false);
      setAuthForm('none');
    }
  }, [phase, authForm]);

  function closeAuthModal() {
    if (authBusy) return;
    setAuthForm('none');
  }

  const showIntroOverlay =
    introVisible && (phase === 'loading' || phase === 'auth' || phase === 'ready');

  const showAuthButtons = phase === 'auth' && authForm === 'none';
  const autoFadeOut = phase === 'ready' && introVisible && authForm === 'none';
  const authModalOpen =
    phase === 'auth' && authForm !== 'none' && !BYPASS_EMAIL_AUTH_GATE;

  if (phase === 'error') {
    return (
      <View style={gateStyles.fill}>
        <Text style={gateStyles.title}>{t('auth.bootstrapFailed')}</Text>
        <Text style={gateStyles.body}>
          {bootstrapMissingEnv
            ? t('auth.supabaseEnvMissing')
            : t('auth.bootstrapHint')}
        </Text>
        {!bootstrapMissingEnv && primeDetail ? (
          <Text style={gateStyles.detail} selectable>
            {t('auth.technicalDetail')} {primeDetail}
          </Text>
        ) : null}
        <AppButton
          label={t('auth.retry')}
          onPress={() => setBootstrapNonce((n) => n + 1)}
          variant="accent"
          size="md"
          fullWidth={false}
          style={gateStyles.retry}
        />
      </View>
    );
  }

  return (
    <View style={gateStyles.shell}>
      {phase === 'ready' ? children : null}
      {showIntroOverlay ? (
        <AppIntroSplash
          style={gateStyles.introOverlay}
          showAuthButtons={showAuthButtons}
          autoFadeOut={autoFadeOut}
          onFadeComplete={() => setIntroVisible(false)}
          onSignIn={() => setAuthForm('signIn')}
          onSignUp={() => setAuthForm('signUp')}
        />
      ) : null}

      <FadeModal visible={authModalOpen} onRequestClose={closeAuthModal}>
        <View style={gateStyles.authModalRoot}>
          <Pressable
            style={modalTheme.backdrop}
            onPress={closeAuthModal}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />
          <View style={gateStyles.authModalSheet}>
            <EmailAuthLanding
              initialStep={authForm === 'signUp' ? 'signUp' : 'signIn'}
              presentation="modal"
              onBackToSplash={closeAuthModal}
              onBusyChange={setAuthBusy}
              onSessionEstablished={() => setPhase('ready')}
            />
          </View>
        </View>
      </FadeModal>
    </View>
  );
}

const gateStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  authModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  authModalSheet: {
    flex: 1,
    maxHeight: '94%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    zIndex: 1,
  },
  fill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  detail: {
    fontSize: typography.min,
    color: `${colors.textPrimary}99`,
    textAlign: 'center',
    marginTop: 4,
  },
  retry: {
    alignSelf: 'center',
    marginTop: 8,
    minWidth: touchTarget.min * 3,
  },
});
