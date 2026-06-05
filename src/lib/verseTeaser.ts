/** 훈련 카드에 보여 줄 구절 미리보기 — 공백 정리 후 길이 제한 */
export function verseTeaser(text: string, maxLen = 80): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen).trimEnd()}…`;
}
