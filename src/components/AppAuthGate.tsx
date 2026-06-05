import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './ui/AppButton';
import { EmailAuthLanding } from './EmailAuthLanding';
import { primeAuthSession } from '../lib/primeAuthSession';
import {
  isSupabaseConfigured,
  supabase,
} from '../supabase/client';
import { colors, typography } from '../theme/colors';
import { touchTarget } from '../theme/layout';

/**
 * `EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE=true` 이면 로그인 화면 없이 바로 메인.
 * 세션이 없으면 Supabase 불러오기는 그대로 실패하므로(필요: 실제 로그인 또는 개발 자동 로그인 env).
 */
function bypassEmailAuthGateFromEnv(): boolean {
  const v =
    typeof process.env.EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE === 'string'
      ? process.env.EXPO_PUBLIC_BYPASS_EMAIL_AUTH_GATE.trim().toLowerCase()
      : '';
  return v === 'true' || v === '1' || v === 'yes';
}

const BYPASS_EMAIL_AUTH_GATE = bypassEmailAuthGateFromEnv();

export function AppAuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'auth' | 'error'>(
    'loading',
  );
  const [primeDetail, setPrimeDetail] = useState<string | undefined>();
  const [bootstrapMissingEnv, setBootstrapMissingEnv] = useState(false);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);

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
            if (!BYPASS_EMAIL_AUTH_GATE) setPhase('auth');
            return;
          }
          if (session.user.is_anonymous) {
            await supabase.auth.signOut();
            if (mounted && !BYPASS_EMAIL_AUTH_GATE) setPhase('auth');
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

  if (phase === 'loading') {
    return (
      <View style={gateStyles.fill}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  if (phase === 'auth' && !BYPASS_EMAIL_AUTH_GATE) {
    return (
      <View style={gateStyles.fullBleed}>
        <EmailAuthLanding onSessionEstablished={() => setPhase('ready')} />
      </View>
    );
  }

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

  return children;
}

const gateStyles = StyleSheet.create({
  fullBleed: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.forest,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  detail: {
    fontSize: typography.min,
    color: `${colors.forest}99`,
    textAlign: 'center',
    marginTop: 4,
  },
  retry: {
    alignSelf: 'center',
    marginTop: 8,
    minWidth: touchTarget.min * 3,
  },
});
