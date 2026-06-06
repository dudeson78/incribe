import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { AppScreenTitle } from '../components/navigation/AppScreenTitle';
import { VoiceReadingSettings } from '../components/VoiceReadingSettings';
import {
  SettingsApplyButton,
  settingsStyles,
} from '../components/settings/SettingsUi';
import { useSettings } from '../context/SettingsContext';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import { tokens } from '../theme/tokens';

const DEFAULT_GOAL = 52;

export function SettingsScreen() {
  const tabScrollPadding = useBottomTabScrollPadding(40);
  const { t } = useTranslation();
  const authProfile = useAuthProfile();
  const {
    annualGoal,
    setAnnualGoal,
    loaded,
  } = useSettings();

  const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL));
  const [authSlice, setAuthSlice] = useState<{
    sessionOk: boolean;
    email: string | null;
    isAnonymous: boolean;
  }>({
    sessionOk: false,
    email: null,
    isAnonymous: true,
  });
  const [authBusy, setAuthBusy] = useState(false);
  const [signOutPressed, setSignOutPressed] = useState(false);
  const [accountBanner, setAccountBanner] = useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!loaded) return;
    setGoalInput(String(annualGoal));
  }, [annualGoal, loaded]);

  useEffect(() => {
    function fromSession(session: {
      user: {
        email?: string | null;
        is_anonymous?: boolean | null;
      };
    } | null) {
      if (!session?.user) {
        setAuthSlice({
          sessionOk: false,
          email: null,
          isAnonymous: true,
        });
        return;
      }
      const u = session.user;
      const anon = !!(u.is_anonymous ?? false);
      const mail =
        typeof u.email === 'string' && u.email.trim().length > 0
          ? u.email.trim()
          : null;
      setAuthSlice({
        sessionOk: true,
        email: mail,
        isAnonymous: anon,
      });
    }

    void supabase.auth.getSession().then(({ data }) =>
      fromSession(data.session ?? null),
    );
    const { data } = supabase.auth.onAuthStateChange((_ev, session) => {
      fromSession(session ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function applyGoal() {
    const n = parseInt(goalInput.replace(/\D/g, ''), 10);
    if (Number.isNaN(n)) return;
    setAnnualGoal(n);
  }

  async function handleSignOut() {
    setAccountBanner(null);
    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
      setAccountBanner({ kind: 'ok', message: t('account.signedOutOk') });
    } catch (e) {
      setAccountBanner({ kind: 'error', message: mapAppError(e, t) });
    } finally {
      setAuthBusy(false);
    }
  }

  const sessionOk = authSlice.sessionOk;
  const showMyAccountBar =
    authProfile.ready &&
    authProfile.signedIn &&
    authProfile.displayName.trim().length > 0;

  return (
    <SafeAreaView style={settingsStyles.screenShell} edges={['top']}>
      <AppScreenTitle title={t('settings.screenTitle')} />
      {showMyAccountBar ? (
        <View style={styles.profileBar}>
          <Text
            style={styles.profileName}
            numberOfLines={1}
            ellipsizeMode="tail"
            accessibilityLabel={t('account.headerSignedInAsA11y', {
              name: authProfile.displayName,
            })}
          >
            {authProfile.displayName}
          </Text>
          <Pressable
            onPress={() => void handleSignOut()}
            onPressIn={() => setSignOutPressed(true)}
            onPressOut={() => setSignOutPressed(false)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.signOutLink,
              (pressed || signOutPressed) && styles.signOutLinkPressed,
              authBusy && styles.authBusy,
            ]}
            disabled={authBusy}
            accessibilityRole="button"
            accessibilityLabel={t('account.signOut')}
          >
            <Text
              style={[
                styles.signOutLinkText,
                signOutPressed && styles.signOutLinkTextPressed,
              ]}
            >
              {t('account.signOut')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          settingsStyles.scroll,
          { paddingBottom: tabScrollPadding },
        ]}
      >
        <View style={settingsStyles.card}>
          <Text style={settingsStyles.sectionTitle}>{t('settings.annualGoal')}</Text>
          <Text style={settingsStyles.sectionSubtitle}>
            {t('settings.annualGoalHint')}
          </Text>
          <View style={settingsStyles.goalRow}>
            <TextInput
              style={settingsStyles.goalInput}
              keyboardType="number-pad"
              value={goalInput}
              onChangeText={setGoalInput}
              accessibilityLabel={t('settings.annualGoal')}
            />
            <SettingsApplyButton
              label={t('settings.apply')}
              onPress={applyGoal}
            />
          </View>
        </View>

        <VoiceReadingSettings />

        <View style={settingsStyles.card}>
          <Text style={settingsStyles.sectionTitle}>{t('account.section')}</Text>
          <View style={styles.accountInner}>
            {sessionOk ? (
              authSlice.isAnonymous ? (
                <Text style={styles.accountMutedInline}>
                  {t('account.anonSession')}
                </Text>
              ) : (
                <Text style={styles.accountStatus}>
                  {authSlice.email
                    ? `${t('account.loginInfoLabel')} ${authSlice.email}`
                    : `${t('account.loginInfoLabel')} —`}
                </Text>
              )
            ) : (
              <Text style={styles.accountMutedInline}>
                {t('settings.syncNeedAuth')}
              </Text>
            )}

            {authBusy ? (
              <Text style={styles.accountWorking}>{t('account.working')}</Text>
            ) : null}
            {accountBanner ? (
              <Text
                style={
                  accountBanner.kind === 'ok'
                    ? styles.accountMsgOk
                    : styles.accountMsgErr
                }
                accessibilityLiveRegion="polite"
              >
                {accountBanner.message}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  profileName: {
    flex: 1,
    minWidth: 0,
    fontSize: tokens.fontSize.md,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  signOutLink: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 2,
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
  authBusy: {
    opacity: 0.45,
  },
  accountInner: {
    gap: 10,
  },
  accountStatus: {
    fontSize: tokens.fontSize.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    lineHeight: 22,
  },
  accountMutedInline: {
    fontSize: tokens.fontSize.sm,
    lineHeight: 20,
    color: tokens.color.textSecondary,
  },
  accountWorking: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  accountMsgOk: {
    fontSize: tokens.fontSize.sm,
    lineHeight: 20,
    color: tokens.color.success,
    marginTop: 4,
    fontWeight: '600',
  },
  accountMsgErr: {
    fontSize: tokens.fontSize.sm,
    lineHeight: 20,
    color: tokens.color.danger,
    marginTop: 4,
    fontWeight: '600',
  },
});
