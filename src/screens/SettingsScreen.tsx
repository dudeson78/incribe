import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { useSettings } from '../context/SettingsContext';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import { colors, settingsSectionTitle, typography } from '../theme/colors';
import { touchTarget } from '../theme/layout';

const DEFAULT_GOAL = 52;

export function SettingsScreen() {
  const tabScrollPadding = useBottomTabScrollPadding(40);
  const { t } = useTranslation();
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

      const nothingMsg = `${t('settings.resetPracticeNothingTitle')}\n\n${t('settings.resetPracticeNothingBody')}`;
      const doneMsg = `${t('common.success')}\n\n${t('settings.resetPracticeDone')}`;

      if (n === 0) {
        if (Platform.OS === 'web') {
          globalThis.alert(nothingMsg);
        } else {
          Alert.alert(
            t('settings.resetPracticeNothingTitle'),
            t('settings.resetPracticeNothingBody'),
          );
        }
        return;
      }

      if (Platform.OS === 'web') {
        globalThis.alert(doneMsg);
      } else {
        Alert.alert(t('common.success'), t('settings.resetPracticeDone'));
      }
    } catch (e) {
      const body = mapAppError(e, t);
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('errors.title')}\n\n${body}`);
      } else {
        Alert.alert(t('errors.title'), body);
      }
    } finally {
      setResetPracticeBusy(false);
    }
  }, [resetAllPracticeToNewVerseState, t]);

  function confirmResetPractice() {
    const title = t('settings.resetPracticeTitle');
    const message = t('settings.resetPracticeMessage');

    if (Platform.OS === 'web') {
      const ok =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(`${title}\n\n${message}`)
          : false;
      if (ok) void runResetPractice();
      return;
    }

    Alert.alert(title, message, [
      { text: t('verses.cancel'), style: 'cancel' },
      {
        text: t('settings.resetPracticeConfirm'),
        style: 'destructive',
        onPress: () => void runResetPractice(),
      },
    ]);
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
    <SafeAreaView style={styles.shell} edges={['top']}>
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
            <Pressable style={styles.applyBtn} onPress={applyGoal}>
              <Text style={styles.applyText}>{t('settings.apply')}</Text>
            </Pressable>
          </View>
        </View>

        <VoiceReadingSettings />

        <View style={styles.settingBlock}>
          <Text style={styles.blockTitle}>
            {t('settings.resetPracticeSection')}
          </Text>
          <Text style={styles.hint}>{t('settings.resetPracticeHint')}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.resetPracticeBtn,
              pressed && styles.resetPracticeBtnPressed,
              resetPracticeBusy && styles.resetPracticeBtnDisabled,
            ]}
            onPress={confirmResetPractice}
            disabled={resetPracticeBusy}
            accessibilityRole="button"
            accessibilityLabel={t('settings.resetPracticeA11y')}
          >
            {resetPracticeBusy ? (
              <ActivityIndicator color={colors.forest} size="small" />
            ) : (
              <Text style={styles.resetPracticeBtnText}>
                {t('settings.resetPracticeBtn')}
              </Text>
            )}
          </Pressable>
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
  myProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: colors.backgroundPrimary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderTertiary,
  },
  myProfileName: {
    flex: 1,
    minWidth: 0,
    ...settingsSectionTitle,
  },
  myProfileSignOut: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  myProfileSignOutText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.forest,
    textDecorationLine: 'underline',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  settingBlock: {
    gap: 12,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.forest}18`,
  },
  blockTitle: settingsSectionTitle,
  hint: {
    fontSize: typography.min,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 0,
  },
  resetPracticeBtn: {
    alignSelf: 'stretch',
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.orange}88`,
    backgroundColor: `${colors.orange}14`,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  resetPracticeBtnPressed: {
    opacity: 0.88,
  },
  resetPracticeBtnDisabled: {
    opacity: 0.55,
  },
  resetPracticeBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.forest,
  },
  accountInner: {
    gap: 10,
  },
  accountStatus: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.forest,
    lineHeight: 24,
  },
  accountMutedInline: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.muted,
  },
  authBtnGhost: {
    opacity: 0.45,
  },
  accountWorking: {
    fontSize: typography.caption,
    color: colors.orange,
    fontWeight: '600',
    marginTop: 2,
  },
  accountMsgOk: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.successBorder,
    marginTop: 4,
    fontWeight: '600',
  },
  accountMsgErr: {
    fontSize: typography.min,
    lineHeight: 22,
    color: colors.errorBorder,
    marginTop: 4,
    fontWeight: '600',
  },
  goalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: `${colors.forest}44`,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.forest,
    backgroundColor: colors.card,
    minHeight: touchTarget.min,
  },
  applyBtn: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
});
