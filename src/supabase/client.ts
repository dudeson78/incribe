import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
).trim();

/** 두 값 모두 필요. 비어 있으면 createClient가 throw → 특히 배포 웹에서 흰 화면만 보임 */
export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

const resolvedSupabaseUrl = isSupabaseConfigured
  ? supabaseUrl
  : 'https://placeholder.supabase.co';
const resolvedSupabaseAnonKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.EhJQRkNfVHVyZFVpdmVyc2lvbmFjY2lkZW50';

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

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: (persistedStorage ?? ephemeralStorage) as Storage,
    autoRefreshToken: true,
    persistSession: persistedStorage !== null,
    detectSessionInUrl: false,
  },
});
