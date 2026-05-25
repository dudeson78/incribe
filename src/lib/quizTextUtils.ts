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

/** 저장된 쉼표 구분 키워드 목록 */
export function splitKeywordCsv(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokensMatchAt(
  tokens: string[],
  start: number,
  pattern: string[],
): boolean {
  if (
    pattern.length === 0 ||
    start < 0 ||
    start + pattern.length > tokens.length
  )
    return false;
  for (let k = 0; k < pattern.length; k++) {
    if (
      normalizeQuizToken(tokens[start + k] ?? '') !==
      normalizeQuizToken(pattern[k] ?? '')
    )
      return false;
  }
  return true;
}

/**
 * 본문 토큰 중 키워드 구문과 일치하는 인덱스(오름차순·중복 제거).
 * 아무 구간도 매칭되지 않으면 null (무작위 빈칸으로 대체).
 */
export function blankIndicesFromKeywords(
  text: string,
  keywordsCsv: string | null | undefined,
): number[] | null {
  const phrases = splitKeywordCsv(keywordsCsv);
  if (phrases.length === 0) return null;
  const tokens = tokenizeWords(text);
  if (tokens.length === 0) return null;

  const idxSet = new Set<number>();
  for (const phrase of phrases) {
    const pattern = tokenizeWords(phrase);
    if (pattern.length === 0) continue;

    for (let i = 0; i <= tokens.length - pattern.length; i++) {
      if (!tokensMatchAt(tokens, i, pattern)) continue;
      for (let j = 0; j < pattern.length; j++) idxSet.add(i + j);
    }
  }

  if (idxSet.size === 0) return null;
  return [...idxSet].sort((a, b) => a - b);
}

/** 라운드 키마다 다른 무작위 빈칸(키워드 없을 때 등) */
export function createSeededRandom(seed: number): () => number {
  let s = (Math.imul(seed >>> 0, 0x9e3779b1) ^ 0xdeadbeef) >>> 0;
  if (s === 0) s = 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** 키워드가 본문에 매칭되면 해당 토큰만 빈칸, 아니면 기존 무작위 로직 */
export function buildBlankChallengePreferKeywords(
  text: string,
  keywordsCsv: string | null | undefined,
  rnd: () => number = Math.random,
): BlankChallenge | null {
  const indices = blankIndicesFromKeywords(text, keywordsCsv);
  const tokens = tokenizeWords(text);
  if (tokens.length === 0) return null;
  if (indices && indices.length > 0) {
    return {
      tokens,
      blankIndices: indices,
      answers: indices.map((i) => tokens[i]!),
    };
  }
  return buildBlankChallenge(text, rnd);
}

/**
 * 순서 맞추기용 분절.
 * 쉼표·중점 등은 분절 기준으로 쓰지 않음(한두 덩어로 치우치는 것 방지).
 * 마침표·물음표·느낌표·말줄임 뒤의 공백 경계만 문장처럼 분절하고,
 * 그 외에는 어절을 묶어 대략 균등한 길이의 조각으로 나눈다.
 */
export function splitVerseIntoSegments(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];

  const bySentence = t.split(/(?<=[.!?。…])\s+/u).map((s) => s.trim()).filter(Boolean);

  if (bySentence.length >= 2) return bySentence;

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
