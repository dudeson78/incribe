import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ReviewCycleDisplay } from '../components/ReviewCycleDisplay';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { useSettings } from '../context/SettingsContext';
import {
  developmentEmailAccepted,
  getDevEmailLocalPartRestriction,
} from '../lib/devEmailAllowlist';
import { useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import { supabase } from '../supabase/client';
import { colors, typography } from '../theme/colors';
import { touchTarget } from '../theme/layout';

const DEFAULT_GOAL = 52;

/** 웹에서는 번들에 포함하지 않도록 네이티브 전용 블록 안에서만 require 합니다. */
function NativeReminderTimePicker(props: {
  value: Date;
  onChange: (_e: unknown, date?: Date) => void;
}) {
  if (Platform.OS === 'web') return null;
  const DateTimePicker =
    require('@react-native-community/datetimepicker').default;
  return (
    <DateTimePicker
      value={props.value}
      mode="time"
      is24Hour
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={props.onChange}
    />
  );
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function parseHm24(raw: string): { h: number; m: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

const LANGS = [
  { code: 'ko', labelKey: 'settings.langKo' as const, flag: '🇰🇷' },
  { code: 'en', labelKey: 'settings.langEn' as const, flag: '🇺🇸' },
  { code: 'es', labelKey: 'settings.langEs' as const, flag: '🇪🇸' },
  { code: 'pt', labelKey: 'settings.langPt' as const, flag: '🇵🇹' },
  { code: 'zh', labelKey: 'settings.langZh' as const, flag: '🇨🇳' },
] as const;

export function SettingsScreen() {
  const { t } = useTranslation();
  const authProfile = useAuthProfile();
  const { resetAllPracticeToNewVerseState } = useVerses();
  const {
    annualGoal,
    setAnnualGoal,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    notificationHour,
    notificationMinute,
    setNotificationTime,
    loaded,
  } = useSettings();

  const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL));
  const [showTime, setShowTime] = useState(false);
  const [webTimeDraft, setWebTimeDraft] = useState(
    () => `${pad2(notificationHour)}:${pad2(notificationMinute)}`,
  );
  const [authSlice, setAuthSlice] = useState<{
    sessionOk: boolean;
    email: string | null;
    isAnonymous: boolean;
  }>({
    sessionOk: false,
    email: null,
    isAnonymous: true,
  });
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
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
    if (!loaded) return;
    setWebTimeDraft(`${pad2(notificationHour)}:${pad2(notificationMinute)}`);
  }, [loaded, notificationHour, notificationMinute]);

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
      if (!anon && mail) setAuthEmail(mail);
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

  const timeDate = new Date();
  timeDate.setHours(notificationHour, notificationMinute, 0, 0);

  function onTimeChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowTime(false);
    if (selected) {
      setNotificationTime(selected.getHours(), selected.getMinutes());
    }
  }

  function applyWebNotificationTime() {
    const parsed = parseHm24(webTimeDraft);
    if (!parsed) return;
    setNotificationTime(parsed.h, parsed.m);
  }

  function looksLikeEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  }

  async function handleSignUp() {
    setAccountBanner(null);
    const nm = authFullName.trim();
    const em = authEmail.trim();
    const pw = authPassword;
    if (!nm || !em || !pw) {
      setAccountBanner({ kind: 'error', message: t('account.fillSignUp') });
      return;
    }
    if (!looksLikeEmail(em)) {
      setAccountBanner({ kind: 'error', message: t('account.badEmail') });
      return;
    }
    if (!developmentEmailAccepted(em)) {
      setAccountBanner({
        kind: 'error',
        message: t('auth.devAllowedUser', {
          part: getDevEmailLocalPartRestriction() ?? '?',
        }),
      });
      return;
    }
    if (pw.length < 6) {
      setAccountBanner({ kind: 'error', message: t('account.weakPassword') });
      return;
    }
    setAuthBusy(true);
    try {
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
      setAuthPassword('');
      if (data.session) {
        setAccountBanner({
          kind: 'ok',
          message: t('account.signUpSuccessLoggedIn'),
        });
      } else {
        setAccountBanner({
          kind: 'ok',
          message: t('account.signUpSuccessVerifyEmail'),
        });
      }
    } catch (e) {
      setAccountBanner({ kind: 'error', message: mapAppError(e, t) });
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignIn() {
    setAccountBanner(null);
    const em = authEmail.trim();
    const pw = authPassword;
    if (!em || !pw) {
      setAccountBanner({ kind: 'error', message: t('account.fillBoth') });
      return;
    }
    if (!looksLikeEmail(em)) {
      setAccountBanner({ kind: 'error', message: t('account.badEmail') });
      return;
    }
    if (!developmentEmailAccepted(em)) {
      setAccountBanner({
        kind: 'error',
        message: t('auth.devAllowedUser', {
          part: getDevEmailLocalPartRestriction() ?? '?',
        }),
      });
      return;
    }
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: em,
        password: pw,
      });
      if (error) throw error;
      setAuthPassword('');
      setAccountBanner({ kind: 'ok', message: t('account.signedInOk') });
    } catch (e) {
      setAccountBanner({ kind: 'error', message: mapAppError(e, t) });
    } finally {
      setAuthBusy(false);
    }
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
      setAuthPassword('');
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>{t('settings.annualGoal')}</Text>
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

        <Text style={styles.section}>{t('settings.reviewCycle')}</Text>
        <ReviewCycleDisplay />

        <Text style={styles.section}>{t('settings.resetPracticeSection')}</Text>
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

        <Text style={styles.section}>{t('settings.language')}</Text>
        <View style={styles.langGrid}>
          {LANGS.map((item) => {
            const sel = language === item.code;
            const label = t(item.labelKey);
            return (
              <Pressable
                key={item.code}
                style={({ pressed }) => [
                  styles.langCell,
                  sel && styles.langCellOn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setLanguage(item.code)}
                accessibilityLabel={label}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text
                  style={[styles.langLabel, sel && styles.langLabelOn]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{t('settings.notifications')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('settings.notifyEnable')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: `${colors.forest}33`, true: `${colors.orange}88` }}
            thumbColor={notificationsEnabled ? colors.orange : colors.card}
            accessibilityLabel={t('settings.notifyEnable')}
          />
        </View>
        {Platform.OS === 'web' ? (
          <>
            <View
              style={[
                styles.timeRow,
                !notificationsEnabled && styles.timeRowDisabled,
              ]}
            >
              <Text
                style={[
                  styles.timeLabel,
                  !notificationsEnabled && styles.timeDisabled,
                ]}
              >
                {t('settings.notifyTime')}
              </Text>
              <Text
                style={[
                  styles.timeValue,
                  !notificationsEnabled && styles.timeDisabled,
                ]}
              >
                {pad2(notificationHour)}:{pad2(notificationMinute)}
              </Text>
            </View>
            <Text style={styles.hint}>{t('settings.notifyTimeWebHint')}</Text>
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.goalInput,
                  !notificationsEnabled && styles.inputDisabled,
                ]}
                value={webTimeDraft}
                onChangeText={setWebTimeDraft}
                placeholder="HH:mm"
                placeholderTextColor={`${colors.forest}55`}
                editable={notificationsEnabled}
                keyboardType="default"
                accessible
                accessibilityLabel={t('settings.notifyTime')}
                maxLength={5}
              />
              <Pressable
                style={[
                  styles.applyBtn,
                  !notificationsEnabled && styles.applyBtnDisabled,
                ]}
                onPress={applyWebNotificationTime}
                disabled={!notificationsEnabled}
              >
                <Text style={styles.applyText}>{t('common.ok')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Pressable
              style={styles.timeRow}
              onPress={() => setShowTime(true)}
              disabled={!notificationsEnabled}
            >
              <Text
                style={[
                  styles.timeLabel,
                  !notificationsEnabled && styles.timeDisabled,
                ]}
              >
                {t('settings.notifyTime')}
              </Text>
              <Text
                style={[
                  styles.timeValue,
                  !notificationsEnabled && styles.timeDisabled,
                ]}
              >
                {pad2(notificationHour)}:{pad2(notificationMinute)}
              </Text>
            </Pressable>
            {showTime ? (
              <NativeReminderTimePicker
                value={timeDate}
                onChange={onTimeChange}
              />
            ) : null}
            {Platform.OS === 'ios' && showTime ? (
              <Pressable
                style={styles.closeTime}
                onPress={() => setShowTime(false)}
              >
                <Text style={styles.closeTimeText}>{t('common.ok')}</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <Text style={styles.section}>{t('account.section')}</Text>
        <View style={styles.accountCard}>
          {sessionOk ? (
            <Text style={styles.accountStatus}>
              {authSlice.email
                ? `${t('account.signedInWithEmail')}: ${authSlice.email}`
                : t('account.signedInWithEmail')}
            </Text>
          ) : (
            <Text style={styles.accountMutedInline}>{t('settings.syncNeedAuth')}</Text>
          )}

          <TextInput
            style={[styles.goalInput, styles.accountInput]}
            value={authFullName}
            onChangeText={setAuthFullName}
            placeholder={t('account.phName')}
            placeholderTextColor={`${colors.forest}55`}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!authBusy}
            accessibilityLabel={t('account.fullNameA11y')}
          />
          <TextInput
            style={[styles.goalInput, styles.accountInput]}
            value={authEmail}
            onChangeText={setAuthEmail}
            placeholder={t('account.phEmail')}
            placeholderTextColor={`${colors.forest}55`}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!authBusy}
          />
          <TextInput
            style={[styles.goalInput, styles.accountInput]}
            value={authPassword}
            onChangeText={setAuthPassword}
            placeholder={t('account.phPassword')}
            placeholderTextColor={`${colors.forest}55`}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!authBusy}
          />

          <View style={[styles.row, styles.authBtnRow]}>
            <Pressable
              style={({ pressed }) => [
                styles.authBtnOutline,
                pressed && styles.pressed,
                authBusy && styles.authBtnGhost,
              ]}
              onPress={() => void handleSignUp()}
              disabled={authBusy}
              accessibilityRole="button"
              accessibilityLabel={t('account.signUp')}
            >
              <Text style={styles.authBtnOutlineText}>{t('account.signUp')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.applyBtn,
                styles.authPrimaryFlex,
                pressed && styles.pressed,
                authBusy && styles.applyBtnDisabled,
              ]}
              onPress={() => void handleSignIn()}
              disabled={authBusy}
              accessibilityRole="button"
              accessibilityLabel={t('account.signIn')}
            >
              <Text style={styles.applyText}>{t('account.signIn')}</Text>
            </Pressable>
          </View>

          <Text style={styles.accountHintFoot}>{t('account.hintAfterSignOut')}</Text>

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

        <Text style={styles.section}>{t('settings.sync')}</Text>
        <View style={styles.syncCard}>
          <Text style={styles.syncBody}>{t('settings.syncBody')}</Text>
          <Text
            style={[
              styles.syncStatus,
              sessionOk ? styles.syncOk : styles.syncWarn,
            ]}
          >
            {sessionOk ? t('settings.syncOk') : t('settings.syncNeedAuth')}
          </Text>
          {sessionOk ? (
            <Text style={styles.syncEmail}>
              {t('settings.signedInAs')}: {authSlice.email ?? '—'}
            </Text>
          ) : null}
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
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
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
    paddingBottom: 40,
    flexGrow: 1,
  },
  section: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
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
    marginBottom: 20,
  },
  resetPracticeBtn: {
    alignSelf: 'stretch',
    marginBottom: 20,
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
  accountCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    gap: 8,
    marginBottom: 8,
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
  accountInput: {
    marginBottom: 0,
  },
  authBtnRow: {
    gap: 10,
    marginBottom: 4,
    marginTop: 4,
    alignItems: 'stretch',
  },
  authPrimaryFlex: {
    flex: 1,
    minHeight: touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authBtnOutline: {
    flex: 1,
    minHeight: touchTarget.min,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${colors.forest}77`,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  authBtnOutlineText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
  },
  authBtnGhost: {
    opacity: 0.45,
  },
  accountHintFoot: {
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 4,
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
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  langCell: {
    width: '47%',
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${colors.forest}33`,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  langCellOn: {
    borderColor: colors.forest,
    backgroundColor: `${colors.forest}14`,
  },
  langLabel: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
    marginTop: 4,
    textAlign: 'center',
  },
  langLabelOn: {
    fontWeight: '800',
  },
  langFlag: {
    fontSize: 22,
  },
  pressed: {
    opacity: 0.9,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: touchTarget.min,
  },
  switchLabel: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
  },
  timeValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.orange,
  },
  timeDisabled: {
    opacity: 0.45,
  },
  timeRowDisabled: {
    opacity: 0.85,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  applyBtnDisabled: {
    opacity: 0.45,
  },
  closeTime: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 12,
  },
  closeTimeText: {
    color: colors.forest,
    fontWeight: '700',
    fontSize: typography.min,
  },
  syncCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    gap: 8,
  },
  syncBody: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.muted,
  },
  syncStatus: {
    fontSize: typography.min,
    fontWeight: '700',
  },
  syncOk: {
    color: colors.successBorder,
  },
  syncWarn: {
    color: colors.orange,
  },
  syncEmail: {
    fontSize: typography.body,
    color: colors.forest,
    opacity: 0.85,
  },
});
