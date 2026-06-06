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

/** 키워드·토큰 일치 시 끝에 붙은 구두점은 무시 (예: "하나님," ↔ "하나님") */
function comparableTokenForKeyword(s: string): string {
  let t = normalizeQuizToken(s);
  t = t.replace(
    /^[\s"'「『⟨（〔［]+|[\s"'」』⟩）〕］.,，。．!！?？;；:：…]+$/gu,
    '',
  );
  return t.trim();
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
      comparableTokenForKeyword(tokens[start + k] ?? '') !==
      comparableTokenForKeyword(pattern[k] ?? '')
    )
      return false;
  }
  return true;
}

/**
 * 본문 토큰 중 키워드가 들어 있는 어절 인덱스(오름차순·중복 제거).
 * - 단일 키워드: 해당 문자열을 포함하는 어절 전체(예: 키워드 「하나님」 → 「하나님의」도 빈칸)
 * - 여러 어절 키워드: 연속 어절이 구문과 일치할 때 각 어절을 빈칸
 * 매칭 없으면 null (무작위 빈칸으로 대체).
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

    if (pattern.length >= 2) {
      for (let i = 0; i <= tokens.length - pattern.length; i++) {
        if (!tokensMatchAt(tokens, i, pattern)) continue;
        for (let j = 0; j < pattern.length; j++) idxSet.add(i + j);
      }
      continue;
    }

    const kwNorm = comparableTokenForKeyword(pattern[0]!);
    if (!kwNorm) continue;
    for (let i = 0; i < tokens.length; i++) {
      const tokNorm = comparableTokenForKeyword(tokens[i] ?? '');
      if (tokNorm === kwNorm || tokNorm.includes(kwNorm)) {
        idxSet.add(i);
      }
    }
  }

  if (idxSet.size === 0) return null;
  return [...idxSet].sort((a, b) => a - b);
}

/** `buildBlankChallenge`와 동일한 목표 빈칸 개수 룰 */
function heuristicBlankTarget(tokenCount: number): number {
  const n = tokenCount;
  if (n <= 1) return 1;
  return Math.max(
    1,
    Math.min(n - 1, Math.min(12, Math.max(2, Math.round(n * 0.28)))),
  );
}

export type BuildBlankChallengeOptions = {
  /**
   * true → 키워드 구문에 해당하는 어절만 빈칸(최초 문제용).
   * 다어절 키워드는 연속 어절마다 빈칸 하나씩.
   */
  keywordOnly?: boolean;
};

/** 키워드가 본문에 매칭되면 해당 칸은 모두 빈칸으로 유지하고, 부족하면 나머지에서 채운다 */
export function buildBlankChallengePreferKeywords(
  text: string,
  keywordsCsv: string | null | undefined,
  rnd: () => number = Math.random,
  options: BuildBlankChallengeOptions = {},
): BlankChallenge | null {
  const tokens = tokenizeWords(text);
  const n = tokens.length;
  if (n === 0) return null;

  const hasKeywordInput = splitKeywordCsv(keywordsCsv).length > 0;
  if (!hasKeywordInput) {
    return buildBlankChallenge(text, rnd);
  }

  const keywordIdx = blankIndicesFromKeywords(text, keywordsCsv);
  if (!keywordIdx || keywordIdx.length === 0) {
    return buildBlankChallenge(text, rnd);
  }

  if (options.keywordOnly) {
    const blankIndices = [...keywordIdx].sort((a, b) => a - b);
    return {
      tokens,
      blankIndices,
      answers: blankIndices.map((i) => tokens[i]!),
    };
  }

  const maxBlanks = n > 1 ? n - 1 : 1;
  const heuristicTarget = heuristicBlankTarget(n);

  /** 키워드 매칭 구간은 우선 포함; 전부 가리면 안 되므로 n>1일 때 최대 maxBlanks까지 */
  const picked = new Set<number>(keywordIdx);
  while (picked.size > maxBlanks) {
    const sorted = [...picked].sort((a, b) => a - b);
    picked.delete(sorted[sorted.length - 1]!);
  }

  const targetTotal = Math.min(
    maxBlanks,
    Math.max(heuristicTarget, picked.size),
  );

  const candidates = tokens.map((_, i) => i).filter((i) => !picked.has(i));
  const shuffled = shuffleInPlaceCopy(candidates, rnd);
  for (const i of shuffled) {
    if (picked.size >= targetTotal) break;
    picked.add(i);
  }

  const blankIndices = [...picked].sort((a, b) => a - b);
  return {
    tokens,
    blankIndices,
    answers: blankIndices.map((i) => tokens[i]!),
  };
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
