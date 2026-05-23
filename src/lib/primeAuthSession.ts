import {
  developmentEmailAccepted,
  getDevEmailLocalPartRestriction,
} from './devEmailAllowlist';
import { isDevelopmentRuntime } from './isDevelopmentRuntime';
import { supabase } from '../supabase/client';

export type PrimeAuthResult =
  | { ok: true }
  /** 이메일 회원가입·로그인 필요 (익명 로그인 사용 안 함) */
  | { ok: false; needsAuth: true }
  | { ok: false; errorMessage: string };

/** 로컬 .env 에 토큰을 넣은 개발 전용 고정 사용자 (브라우저·기기 간 session 공유용) */
function devPinnedCredentials(): {
  accessToken: string;
  refreshToken: string;
} | null {
  const access =
    process.env.EXPO_PUBLIC_DEV_SUPABASE_ACCESS_TOKEN?.trim() ?? '';
  const refresh =
    process.env.EXPO_PUBLIC_DEV_SUPABASE_REFRESH_TOKEN?.trim() ?? '';
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

/**
 * 개발 중에만: `.env`에 넣어 둔 access/refresh 토큰으로 세션 고정 → 항상 동일 Supabase 사용자.
 */
async function primeWithDevPinnedSession(): Promise<PrimeAuthResult> {
  const pinned = devPinnedCredentials()!;
  const { data, error } = await supabase.auth.setSession({
    access_token: pinned.accessToken,
    refresh_token: pinned.refreshToken,
  });
  if (error || !data.session?.user || data.session.user.is_anonymous) {
    return {
      ok: false,
      errorMessage:
        error?.message ??
        'Dev pinned session rejected (토큰이 만료됐거나 잘못됐습니다)',
    };
  }
  return { ok: true };
}

async function clearAnonymousSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.is_anonymous) {
    await supabase.auth.signOut();
  }
}

async function primeDevPasswordLogin(): Promise<PrimeAuthResult | null> {
  const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL?.trim() ?? '';
  const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD ?? '';
  if (!email || !password) return null;
  if (!developmentEmailAccepted(email)) {
    const p = getDevEmailLocalPartRestriction();
    return {
      ok: false,
      errorMessage: `[개발 자동 로그인] 허용 local-part 아님. EXPO_PUBLIC_DEV_EMAIL_LOCAL_PART_ONLY="${p ?? ''}"`,
    };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { ok: false, errorMessage: `[개발 자동 로그인] ${error.message}` };
  }
  return { ok: true };
}

/**
 * 익명 로그인은 사용하지 않습니다. 세션이 없으면 회원가입·로그인 화면으로 보냅니다.
 *
 * Supabase Dashboard: Authentication → Providers → **Email**(및 회원가입 정책) 구성 필요.
 *
 * 개발 전용 우선 순위:
 * 1. `EXPO_PUBLIC_DEV_SUPABASE_ACCESS_TOKEN` + `REFRESH_TOKEN` (토큰 고정)
 * 2. `EXPO_PUBLIC_DEV_LOGIN_EMAIL` + `EXPO_PUBLIC_DEV_LOGIN_PASSWORD` (선택, 이메일 local-part 제한이 켜진 경우 해당 값만 허용)
 */
export async function primeAuthSession(): Promise<PrimeAuthResult> {
  try {
    await clearAnonymousSession();

    if (isDevelopmentRuntime() && devPinnedCredentials()) {
      return primeWithDevPinnedSession();
    }

    if (isDevelopmentRuntime()) {
      const viaPass = await primeDevPasswordLogin();
      if (viaPass !== null) {
        return viaPass;
      }
    }

    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { ok: false, errorMessage: sessionError.message };
    }

    if (data.session?.user?.is_anonymous) {
      await supabase.auth.signOut();
      return { ok: false, needsAuth: true };
    }

    if (data.session) {
      return { ok: true };
    }

    return { ok: false, needsAuth: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errorMessage: msg };
  }
}
