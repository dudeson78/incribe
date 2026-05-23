import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * After `expo-sqlite/localStorage/install`, native uses SQLite-backed `localStorage`
 * (avoids `@react-native-async-storage` "legacy storage" issues with Supabase Auth).
 * Web uses the browser `localStorage`.
 */
function getBrowserLikeStorage(): Storage | null {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      'localStorage' in globalThis &&
      globalThis.localStorage != null &&
      typeof globalThis.localStorage.getItem === 'function'
    ) {
      return globalThis.localStorage as Storage;
    }
  } catch {
    /* restricted environment */
  }
  return null;
}

const persistedStorage = getBrowserLikeStorage();

const memoryStore = new Map<string, string>();
const ephemeralStorage = {
  getItem: (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
  setItem: (key: string, value: string) => {
    memoryStore.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    memoryStore.delete(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: (persistedStorage ?? ephemeralStorage) as Storage,
    autoRefreshToken: true,
    persistSession: persistedStorage !== null,
    detectSessionInUrl: false,
  },
});
