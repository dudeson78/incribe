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

const K = {
  annualGoal: '@inscribe/annual_goal',
} as const;

const DEFAULT_ANNUAL = 52;

type SettingsContextValue = {
  loaded: boolean;
  annualGoal: number;
  setAnnualGoal: (n: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [annualGoal, setAnnualGoalState] = useState(DEFAULT_ANNUAL);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const g = await AsyncStorage.getItem(K.annualGoal);
        if (cancel) return;
        if (g != null) {
          const n = parseInt(g, 10);
          if (!Number.isNaN(n) && n >= 1 && n <= 500) {
            setAnnualGoalState(n);
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
    void AsyncStorage.setItem(K.annualGoal, String(annualGoal));
  }, [annualGoal, loaded]);

  const setAnnualGoal = useCallback((n: number) => {
    const v = Math.max(1, Math.min(500, Math.floor(n)));
    setAnnualGoalState(v);
  }, []);

  const value = useMemo(
    (): SettingsContextValue => ({
      loaded,
      annualGoal,
      setAnnualGoal,
    }),
    [loaded, annualGoal, setAnnualGoal],
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
