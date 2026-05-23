/**
 * 참조 문자열 비교용 정규화 (띄어쓰기, 전각 콜론 등)
 */
export function normalizeReference(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[：︰]/g, ':')
    .toLowerCase();
}

export function referencesMatch(userAnswer: string, expected: string): boolean {
  const u = normalizeReference(userAnswer);
  const e = normalizeReference(expected);
  if (u.length === 0) return false;
  if (u === e) return true;
  const uCompact = u.replace(/\s/g, '');
  const eCompact = e.replace(/\s/g, '');
  return uCompact === eCompact;
}
