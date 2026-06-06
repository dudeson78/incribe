import { canonicalizeReference } from './bibleReference';

/**
 * 참조 문자열 비교용 정규화 (띄어쓰기, 전각 콜론 등)
 */
export function normalizeReference(s: string): string {
  return canonicalizeReference(s).toLowerCase();
}

export function referencesMatch(userAnswer: string, expected: string): boolean {
  const u = canonicalizeReference(userAnswer);
  const e = canonicalizeReference(expected);
  if (u.length === 0) return false;
  if (u === e) return true;
  const uCompact = u.replace(/\s/g, '').toLowerCase();
  const eCompact = e.replace(/\s/g, '').toLowerCase();
  return uCompact === eCompact;
}
