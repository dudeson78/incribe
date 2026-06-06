import { useCallback, useEffect, useState } from 'react';
import {
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
import { AppButton } from '../components/ui/AppButton';
import { useSettings } from '../context/SettingsContext';
import { useDialog } from '../context/DialogContext';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import {
  cardShadow,
  colors,
  screenTitleTypography,
  settingsSectionTitle,
  typography,
} from '../theme/colors';
import {
  cardPadding,
  cardRadius,
  radius,
  screenPadding,
  touchTarget,
} from '../theme/layout';

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
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.screenTitle} accessibilityRole="header">
          {t('settings.screenTitle')}
        </Text>
        {showMyAccountBar ? (
          <View style={styles.myProfileBar}>
            <Text
              style={styles.myProfileName}
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
              hitSlop={10}
              style={({ pressed }) => [
                styles.myProfileSignOut,
                pressed && { opacity: 0.82 },
                authBusy && styles.authBtnGhost,
              ]}
              disabled={authBusy}
              accessibilityRole="button"
              accessibilityLabel={t('account.signOut')}
            >
              <Text style={styles.myProfileSignOutText}>
                {t('account.signOut')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabScrollPadding },
        ]}
      >
        <View style={styles.settingBlock}>
          <Text style={styles.blockTitle}>{t('settings.annualGoal')}</Text>
          <Text style={styles.hint}>{t('settings.annualGoalHint')}</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.goalInput}
              keyboardType="number-pad"
              value={goalInput}
              onChangeText={setGoalInput}
              accessibilityLabel={t('settings.annualGoal')}
            />
            <AppButton
              label={t('settings.apply')}
              onPress={applyGoal}
              variant="primary"
              size="sm"
              fullWidth={false}
              style={styles.applyBtn}
            />
          </View>
        </View>

        <VoiceReadingSettings />

        <View style={styles.settingBlock}>
          <Text style={styles.blockTitle}>
            {t('settings.resetPracticeSection')}
          </Text>
          <Text style={styles.hint}>{t('settings.resetPracticeHint')}</Text>
          <AppButton
            label={t('settings.resetPracticeBtn')}
            onPress={() => void confirmResetPractice()}
            variant="danger"
            loading={resetPracticeBusy}
            accessibilityLabel={t('settings.resetPracticeA11y')}
          />
        </View>

        <View style={styles.settingBlock}>
          <Text style={styles.blockTitle}>{t('account.section')}</Text>
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
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageHeader: {
    paddingHorizontal: screenPadding,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderTertiary,
    backgroundColor: colors.background,
  },
  screenTitle: {
    ...screenTitleTypography,
  },
  myProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  myProfileName: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  myProfileSignOut: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  myProfileSignOutText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
  scroll: {
    paddingHorizontal: screenPadding,
    paddingTop: 14,
    flexGrow: 1,
  },
  settingBlock: {
    gap: 8,
    padding: cardPadding,
    marginBottom: 10,
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    ...cardShadow,
  },
  blockTitle: settingsSectionTitle,
  hint: {
    fontSize: typography.min,
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  accountInner: {
    gap: 10,
  },
  accountStatus: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  accountMutedInline: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  authBtnGhost: {
    opacity: 0.45,
  },
  accountWorking: {
    fontSize: typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  accountMsgOk: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: '600',
  },
  accountMsgErr: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: '600',
  },
  goalInput: {
    width: 96,
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.card,
    minHeight: touchTarget.min * 0.74,
    textAlign: 'center',
  },
  applyBtn: {
    minWidth: 72,
    borderRadius: radius.pill,
  },
});
