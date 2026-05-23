import { format, startOfDay } from 'date-fns';

type IdVerse = { id: string; is_active?: boolean };

/**
 * 구절 풀이 바뀌지 않는 한 같은 날(로컬)에는 같은 항목이 선택되도록 문자열 해시를 씁니다.
 */
export function pickVerseOfDay<T extends IdVerse>(
  verses: readonly T[],
  day: Date = new Date(),
): T | null {
  const pool = verses.filter((v) => v.is_active);
  if (pool.length === 0) return null;

  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const stamp = format(startOfDay(day), 'yyyy-MM-dd');
  const key = `${stamp}:${sorted.map((v) => v.id).join(',')}`;

  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const idx = Math.abs(h >>> 0) % sorted.length;
  return sorted[idx] ?? null;
}
