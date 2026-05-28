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

import {
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_PITCH_MAX,
  SPEECH_PITCH_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  type SpeechSettings,
} from '../types/speechSettings';

const K = {
  annualGoal: '@inscribe/annual_goal',
  speechSettings: '@inscribe/speech_settings',
} as const;

const DEFAULT_ANNUAL = 52;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseSpeechSettings(raw: string | null): SpeechSettings {
  if (!raw) return DEFAULT_SPEECH_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<SpeechSettings>;
    return {
      voiceURI:
        typeof parsed.voiceURI === 'string' ? parsed.voiceURI : null,
      language:
        typeof parsed.language === 'string' && parsed.language.trim()
          ? parsed.language.trim()
          : DEFAULT_SPEECH_SETTINGS.language,
      rate:
        typeof parsed.rate === 'number' && Number.isFinite(parsed.rate)
          ? clamp(parsed.rate, SPEECH_RATE_MIN, SPEECH_RATE_MAX)
          : DEFAULT_SPEECH_SETTINGS.rate,
      pitch:
        typeof parsed.pitch === 'number' && Number.isFinite(parsed.pitch)
          ? clamp(parsed.pitch, SPEECH_PITCH_MIN, SPEECH_PITCH_MAX)
          : DEFAULT_SPEECH_SETTINGS.pitch,
    };
  } catch {
    return DEFAULT_SPEECH_SETTINGS;
  }
}

type SettingsContextValue = {
  loaded: boolean;
  annualGoal: number;
  setAnnualGoal: (n: number) => void;
  speechSettings: SpeechSettings;
  setSpeechSettings: (next: SpeechSettings) => void;
  patchSpeechSettings: (patch: Partial<SpeechSettings>) => void;
  resetSpeechSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [annualGoal, setAnnualGoalState] = useState(DEFAULT_ANNUAL);
  const [speechSettings, setSpeechSettingsState] = useState<SpeechSettings>(
    DEFAULT_SPEECH_SETTINGS,
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [g, speechRaw] = await Promise.all([
          AsyncStorage.getItem(K.annualGoal),
          AsyncStorage.getItem(K.speechSettings),
        ]);
        if (cancel) return;
        if (g != null) {
          const n = parseInt(g, 10);
          if (!Number.isNaN(n) && n >= 1 && n <= 500) {
            setAnnualGoalState(n);
          }
        }
        setSpeechSettingsState(parseSpeechSettings(speechRaw));
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
    void AsyncStorage.setItem(K.annualGoal, String(annualGoal));
  }, [annualGoal, loaded]);

  useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(
      K.speechSettings,
      JSON.stringify(speechSettings),
    );
  }, [speechSettings, loaded]);

  const setAnnualGoal = useCallback((n: number) => {
    const v = Math.max(1, Math.min(500, Math.floor(n)));
    setAnnualGoalState(v);
  }, []);

  const setSpeechSettings = useCallback((next: SpeechSettings) => {
    setSpeechSettingsState({
      ...next,
      rate: clamp(next.rate, SPEECH_RATE_MIN, SPEECH_RATE_MAX),
      pitch: clamp(next.pitch, SPEECH_PITCH_MIN, SPEECH_PITCH_MAX),
    });
  }, []);

  const patchSpeechSettings = useCallback((patch: Partial<SpeechSettings>) => {
    setSpeechSettingsState((prev) => {
      const next = { ...prev, ...patch };
      return {
        ...next,
        rate: clamp(next.rate, SPEECH_RATE_MIN, SPEECH_RATE_MAX),
        pitch: clamp(next.pitch, SPEECH_PITCH_MIN, SPEECH_PITCH_MAX),
      };
    });
  }, []);

  const resetSpeechSettings = useCallback(() => {
    setSpeechSettingsState(DEFAULT_SPEECH_SETTINGS);
  }, []);

  const value = useMemo(
    (): SettingsContextValue => ({
      loaded,
      annualGoal,
      setAnnualGoal,
      speechSettings,
      setSpeechSettings,
      patchSpeechSettings,
      resetSpeechSettings,
    }),
    [
      loaded,
      annualGoal,
      setAnnualGoal,
      speechSettings,
      setSpeechSettings,
      patchSpeechSettings,
      resetSpeechSettings,
    ],
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
