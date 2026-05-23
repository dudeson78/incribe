import { isDevelopmentRuntime } from './isDevelopmentRuntime';

/**
 * 개발 빌드에서만: `.env`에 `EXPO_PUBLIC_DEV_EMAIL_LOCAL_PART_ONLY` 값이 비어있지 않으면
 * 이메일 @ 앞(local-part)이 그 문자열(대소문자 무시)일 때만 가입·로그인 허용.
 *
 * 변수가 비어있거나 설정하지 않았으면 **개발 중에도 임의 이메일 허용** (기본값).
 */
export function getDevEmailLocalPartRestriction(): string | null {
  if (!isDevelopmentRuntime()) return null;
  const raw = process.env.EXPO_PUBLIC_DEV_EMAIL_LOCAL_PART_ONLY;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function developmentEmailAccepted(emailRaw: string): boolean {
  const only = getDevEmailLocalPartRestriction();
  if (!only) return true;

  const trimmed = emailRaw.trim();
  const amp = trimmed.indexOf('@');
  const local = (
    amp < 1 ? trimmed : trimmed.slice(0, amp)
  ).toLowerCase();
  return local === only;
}
