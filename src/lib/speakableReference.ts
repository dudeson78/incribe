/**
 * TTS 낭독 직전에 표준 참조(예: `잠 1:1`)를 자연스러운
 * 한국어(예: `잠언 1장 1절`)로 변환한다.
 */

import { BOOK_FULL_NAMES, canonicalizeReference } from './bibleReference';

/** `1`, `1-3`, `1~3`, `4,7` 등 절 표기를 자연스러운 낭독으로 변환 */
function formatVersePart(versePart: string): string {
  const trimmed = versePart.trim();
  if (!trimmed) return '';

  // 쉼표로 나뉜 각 토큰을 개별 변환 후 다시 합친다.
  const tokens = trimmed.split(/\s*,\s*/).filter(Boolean);
  const parts = tokens.map((token) => {
    const range = token.split(/\s*[-~]\s*/);
    if (range.length === 2 && range[0] && range[1]) {
      return `${range[0]}절부터 ${range[1]}절`;
    }
    return `${token}절`;
  });
  return parts.join(', ');
}

/**
 * 표시용 참조를 낭독용 문장으로 변환한다.
 * 예) `잠 1:1` → `잠언 1장 1절`, `시 23:1~3` → `시편 23장 1절부터 3절`
 */
export function toSpeakableReference(reference: string): string {
  const raw = canonicalizeReference(reference);
  if (!raw) return '';

  const match = raw.match(/^(\S+)\s+(\d+)(?::(.+))?$/);
  if (!match) return raw;

  const bookToken = match[1] ?? '';
  const chapter = match[2] ?? '';
  const versePart = (match[3] ?? '').trim();
  const bookName = BOOK_FULL_NAMES[bookToken] ?? bookToken;

  if (!chapter) return bookName;
  if (!versePart) return `${bookName} ${chapter}장`;

  const spokenVerses = formatVersePart(versePart);
  if (!spokenVerses) return `${bookName} ${chapter}장`;
  return `${bookName} ${chapter}장 ${spokenVerses}`;
}
