import { useCallback, useEffect, useState } from 'react';
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
import { VoiceReadingSettings } from '../components/VoiceReadingSettings';
import {
  SettingsApplyButton,
  settingsStyles,
} from '../components/settings/SettingsUi';
import { AppButton } from '../components/ui/AppButton';
import { useSettings } from '../context/SettingsContext';
import { useDialog } from '../context/DialogContext';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import { tokens } from '../theme/tokens';

const DEFAULT_GOAL = 52;

export function SettingsScreen() {
  const tabScrollPadding = useBottomTabScrollPadding(40);
  const { t } = useTranslation();
  const dialog = useDialog();
  const authProfile = useAuthProfile();
  const { resetAllPracticeToNewVerseState } = useVerses();
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
  const [resetPracticeBusy, setResetPracticeBusy] = useState(false);
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

  const runResetPractice = useCallback(async () => {
    setResetPracticeBusy(true);
    try {
      const n = await resetAllPracticeToNewVerseState();

      if (n === 0) {
        await dialog.alert({
          title: t('settings.resetPracticeNothingTitle'),
          message: t('settings.resetPracticeNothingBody'),
        });
        return;
      }

      await dialog.alert({
        title: t('common.success'),
        message: t('settings.resetPracticeDone'),
      });
    } catch (e) {
      await dialog.alert({ title: t('errors.title'), message: mapAppError(e, t) });
    } finally {
      setResetPracticeBusy(false);
    }
  }, [dialog, resetAllPracticeToNewVerseState, t]);

  const confirmResetPractice = useCallback(async () => {
    const ok = await dialog.confirm({
      title: t('settings.resetPracticeTitle'),
      message: t('settings.resetPracticeMessage'),
      confirmText: t('settings.resetPracticeConfirm'),
      cancelText: t('verses.cancel'),
      destructive: true,
    });
    if (ok) void runResetPractice();
  }, [dialog, runResetPractice, t]);

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
      <View style={settingsStyles.pageHeader}>
        {showMyAccountBar ? (
          <View style={settingsStyles.headerRow}>
            <Text
              style={settingsStyles.headerName}
              numberOfLines={2}
              ellipsizeMode="tail"
              accessibilityRole="header"
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
                settingsStyles.signOutLink,
                (pressed || signOutPressed) && settingsStyles.signOutLinkPressed,
                authBusy && styles.authBusy,
              ]}
              disabled={authBusy}
              accessibilityRole="button"
              accessibilityLabel={t('account.signOut')}
            >
              <Text
                style={[
                  settingsStyles.signOutLinkText,
                  (signOutPressed) && settingsStyles.signOutLinkTextPressed,
                ]}
              >
                {t('account.signOut')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={settingsStyles.screenTitleFallback} accessibilityRole="header">
            {t('settings.screenTitle')}
          </Text>
        )}
      </View>
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
          <Text style={settingsStyles.sectionTitle}>
            {t('settings.resetPracticeSection')}
          </Text>
          <Text style={styles.resetSubtitle}>
            {t('settings.resetPracticeHint')}
          </Text>
          <AppButton
            label={t('settings.resetPracticeBtn')}
            onPress={() => void confirmResetPractice()}
            variant="danger"
            loading={resetPracticeBusy}
            accessibilityLabel={t('settings.resetPracticeA11y')}
          />
        </View>

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
  authBusy: {
    opacity: 0.45,
  },
  resetSubtitle: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.textMuted,
    lineHeight: 20,
    marginBottom: 16,
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
