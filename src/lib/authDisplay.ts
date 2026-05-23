import type { User } from '@supabase/supabase-js';

/** 프로필 `full_name` 우선, 없으면 이메일 @ 앞 local-part */
export function getDisplayNameFromUser(user: User): string {
  const meta = user.user_metadata;
  if (meta && typeof meta === 'object' && 'full_name' in meta) {
    const fn = (meta as { full_name?: unknown }).full_name;
    if (typeof fn === 'string') {
      const t = fn.trim();
      if (t) return t;
    }
  }
  const em = user.email?.trim();
  if (em) {
    const at = em.indexOf('@');
    if (at > 0) return em.slice(0, at);
    return em;
  }
  return '';
}
