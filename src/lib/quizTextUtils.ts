/**
 * 퀴즈용 본문 토크나이즈·분절(빈칸·순서 게임).
 */

/** 공백 기준 어절 목록 */
export function tokenizeWords(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];
  return t.split(/\s+/).filter(Boolean);
}

export type BlankChallenge = {
  tokens: string[];
  blankIndices: number[];
  /** blankIndices 순서와 동일한 정답 토큰 */
  answers: string[];
};

function shuffleInPlaceCopy<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * 무작위로 일부 어절을 빈칸으로 선택.
 * 최소 1칸; 너무 짧은 구절은 전부 표시만(게임 불가 시 빈 칸 배열 가능 → 호출측 처리).
 */
export function buildBlankChallenge(
  text: string,
  rnd: () => number = Math.random,
): BlankChallenge | null {
  const tokens = tokenizeWords(text);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    return { tokens, blankIndices: [0], answers: [tokens[0]!] };
  }

  const n = tokens.length;
  const blankCount = Math.max(
    1,
    Math.min(n - 1, Math.min(12, Math.max(2, Math.round(n * 0.28)))),
  );
  const idxs = tokens.map((_, i) => i);
  const shuffled = shuffleInPlaceCopy(idxs, rnd);
  const pick = shuffled.slice(0, blankCount).sort((a, b) => a - b);
  return {
    tokens,
    blankIndices: pick,
    answers: pick.map((i) => tokens[i]!),
  };
}

/**
 * 문장/절 단위 분절(쉼표·마침표·물음표 등 기준).
 * 분절이 1개뿐이면 어절 덩어리로 나눔.
 */
export function splitVerseIntoSegments(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];

  const byPunct = t
    .split(/(?<=[.!?。…])\s+|(?<=[,，、;；:：])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);

  if (byPunct.length >= 2) return byPunct;

  const byComma = t
    .split(/\s*[,，、]\s*/u)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byComma.length >= 2) return byComma;

  const words = tokenizeWords(t);
  if (words.length <= 2) return [t];
  const chunkSize = Math.max(2, Math.ceil(words.length / Math.min(5, words.length)));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks.length >= 2 ? chunks : [t];
}

export function shuffleSegments<T>(arr: T[], rnd: () => number = Math.random): T[] {
  return shuffleInPlaceCopy(arr, rnd);
}

/** 빈칸 정답 비교용 */
export function normalizeQuizToken(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g, ' ');
}
