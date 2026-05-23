import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { i18n } from '../i18n';

const K = {
  annualGoal: '@inscribe/annual_goal',
  language: '@inscribe/language',
  notifyOn: '@inscribe/notify_enabled',
  hour: '@inscribe/notify_hour',
  minute: '@inscribe/notify_minute',
} as const;

const DEFAULT_ANNUAL = 52;
const DEFAULT_LANG = 'ko';

type SettingsContextValue = {
  loaded: boolean;
  annualGoal: number;
  setAnnualGoal: (n: number) => void;
  language: string;
  setLanguage: (code: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  notificationHour: number;
  notificationMinute: number;
  setNotificationTime: (hour: number, minute: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [annualGoal, setAnnualGoalState] = useState(DEFAULT_ANNUAL);
  const [language, setLanguageState] = useState(DEFAULT_LANG);
  const [notificationsEnabled, setNotificationsEnabledState] =
    useState(false);
  const [notificationHour, setNotificationHourState] = useState(9);
  const [notificationMinute, setNotificationMinuteState] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [g, l, ne, h, m] = await Promise.all([
          AsyncStorage.getItem(K.annualGoal),
          AsyncStorage.getItem(K.language),
          AsyncStorage.getItem(K.notifyOn),
          AsyncStorage.getItem(K.hour),
          AsyncStorage.getItem(K.minute),
        ]);
        if (cancel) return;
        if (g != null) {
          const n = parseInt(g, 10);
          if (!Number.isNaN(n) && n >= 1 && n <= 500) {
            setAnnualGoalState(n);
          }
        }
        const allowed = ['ko', 'en', 'es', 'pt', 'zh'] as const;
        if (l === 'ja') {
          await AsyncStorage.setItem(K.language, 'ko');
          setLanguageState('ko');
        } else if (l && (allowed as readonly string[]).includes(l)) {
          setLanguageState(l);
        }
        if (ne === '1') setNotificationsEnabledState(true);
        if (h != null) {
          const hh = parseInt(h, 10);
          if (!Number.isNaN(hh) && hh >= 0 && hh <= 23) {
            setNotificationHourState(hh);
          }
        }
        if (m != null) {
          const mm = parseInt(m, 10);
          if (!Number.isNaN(mm) && mm >= 0 && mm <= 59) {
            setNotificationMinuteState(mm);
          }
        }
      } finally {
        if (!cancel) setLoaded(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void i18n.changeLanguage(language);
    void AsyncStorage.setItem(K.language, language);
  }, [language, loaded]);

  useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(K.annualGoal, String(annualGoal));
  }, [annualGoal, loaded]);

  useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(K.notifyOn, notificationsEnabled ? '1' : '0');
  }, [notificationsEnabled, loaded]);

  useEffect(() => {
    if (!loaded) return;
    void (async () => {
      await AsyncStorage.setItem(K.hour, String(notificationHour));
      await AsyncStorage.setItem(K.minute, String(notificationMinute));
    })();
  }, [notificationHour, notificationMinute, loaded]);

  const setAnnualGoal = useCallback((n: number) => {
    const v = Math.max(1, Math.min(500, Math.floor(n)));
    setAnnualGoalState(v);
  }, []);

  const setLanguage = useCallback((code: string) => {
    if (['ko', 'en', 'es', 'pt', 'zh'].includes(code)) {
      setLanguageState(code);
    }
  }, []);

  const setNotificationsEnabled = useCallback((v: boolean) => {
    setNotificationsEnabledState(v);
  }, []);

  const setNotificationTime = useCallback((hour: number, minute: number) => {
    setNotificationHourState(Math.max(0, Math.min(23, hour)));
    setNotificationMinuteState(Math.max(0, Math.min(59, minute)));
  }, []);

  const value = useMemo(
    (): SettingsContextValue => ({
      loaded,
      annualGoal,
      setAnnualGoal,
      language,
      setLanguage,
      notificationsEnabled,
      setNotificationsEnabled,
      notificationHour,
      notificationMinute,
      setNotificationTime,
    }),
    [
      loaded,
      annualGoal,
      setAnnualGoal,
      language,
      setLanguage,
      notificationsEnabled,
      setNotificationsEnabled,
      notificationHour,
      notificationMinute,
      setNotificationTime,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
