/**
 * 한글 성경 참조 파싱·정규화.
 * 다양한 입력(풀이름/약칭, 장·절 표기, 띄어쓰기, 절 범위)을
 * `히 3:15` 또는 `히 3:15~16` 형태로 통일한다.
 */

/** 표준 권 약칭 → 풀이름 */
export const BOOK_FULL_NAMES: Record<string, string> = {
  창: '창세기',
  출: '출애굽기',
  레: '레위기',
  민: '민수기',
  신: '신명기',
  수: '여호수아',
  삿: '사사기',
  룻: '룻기',
  삼상: '사무엘상',
  삼하: '사무엘하',
  왕상: '열왕기상',
  왕하: '열왕기하',
  대상: '역대상',
  대하: '역대하',
  스: '에스라',
  느: '느헤미야',
  에: '에스더',
  욥: '욥기',
  시: '시편',
  잠: '잠언',
  전: '전도서',
  아: '아가',
  사: '이사야',
  렘: '예레미야',
  애: '예레미야애가',
  겔: '에스겔',
  단: '다니엘',
  호: '호세아',
  욜: '요엘',
  암: '아모스',
  옵: '오바댜',
  욘: '요나',
  미: '미가',
  나: '나훔',
  합: '하박국',
  습: '스바냐',
  학: '학개',
  슥: '스가랴',
  말: '말라기',
  마: '마태복음',
  막: '마가복음',
  눅: '누가복음',
  요: '요한복음',
  행: '사도행전',
  롬: '로마서',
  고전: '고린도전서',
  고후: '고린도후서',
  갈: '갈라디아서',
  엡: '에베소서',
  빌: '빌립보서',
  골: '골로새서',
  살전: '데살로니가전서',
  살후: '데살로니가후서',
  딤전: '디모데전서',
  딤후: '디모데후서',
  딛: '디도서',
  몬: '빌레몬서',
  히: '히브리서',
  약: '야고보서',
  벧전: '베드로전서',
  벧후: '베드로후서',
  요일: '요한일서',
  요이: '요한이서',
  요삼: '요한삼서',
  유: '유다서',
  계: '요한계시록',
};

/** 풀이름·별칭 → 표준 약칭 */
const BOOK_ALIAS_TO_ABBR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [abbr, full] of Object.entries(BOOK_FULL_NAMES)) {
    map[compactKey(full)] = abbr;
    map[compactKey(abbr)] = abbr;
  }
  map[compactKey('에스더')] = '에';
  map[compactKey('슬')] = '애';
  map[compactKey('예레미야애가')] = '애';
  return map;
})();

type BookAlias = { key: string; abbr: string };

const SORTED_BOOK_ALIASES: BookAlias[] = Object.entries(BOOK_ALIAS_TO_ABBR)
  .map(([key, abbr]) => ({ key, abbr }))
  .sort((a, b) => b.key.length - a.key.length);

function compactKey(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase();
}

/** `-`, `~`, `부터`, `절` 등 다양한 범위 표기를 `15~16` 형태로 통일 */
function normalizeVerseToken(token: string): string {
  let s = token
    .replace(/\s+/g, '')
    .replace(/절/g, '')
    .replace(/부터/g, '~')
    .replace(/[-–—−]/g, '~')
    .replace(/~+/g, '~')
    .replace(/^~|~$/g, '');

  const range = s.match(/^(\d+)~(\d+)$/);
  if (range) {
    return `${range[1]}~${range[2]}`;
  }

  if (/^\d+$/.test(s)) {
    return s;
  }

  return s;
}

function normalizeVersePart(versePart: string): string {
  const stripped = versePart.replace(/절/g, ' ').trim();
  const tokens = stripped
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(normalizeVerseToken)
    .filter(Boolean);

  return tokens.join(',');
}

/** 권 이름 이후 문자열을 `3:15` 또는 `3` 형태로 변환 */
function parseLocator(locator: string): string | null {
  const trimmed = locator.trim();
  if (!trimmed) return null;

  const spaced = trimmed
    .replace(/[：︰]/g, ':')
    .replace(/\s+/g, ' ')
    .trim();

  const spaceNum = spaced.match(/^(\d+)\s+(.+)$/);
  if (spaceNum && /\d/.test(spaceNum[2]!)) {
    const chapter = spaceNum[1]!;
    const verse = normalizeVersePart(spaceNum[2]!);
    return verse ? `${chapter}:${verse}` : chapter;
  }

  const compact = spaced
    .replace(/\s+/g, '')
    .replace(/절/g, '')
    .replace(/부터/g, '~');

  const jangMatch = compact.match(/^(\d+)장([\d\-~,]+)?$/);
  if (jangMatch) {
    const chapter = jangMatch[1]!;
    const verse = jangMatch[2] ? normalizeVersePart(jangMatch[2]) : '';
    return verse ? `${chapter}:${verse}` : chapter;
  }

  const colonMatch = compact.match(/^(\d+):([\d\-~,]+)$/);
  if (colonMatch) {
    return `${colonMatch[1]}:${normalizeVersePart(colonMatch[2]!)}`;
  }

  if (/^\d+$/.test(compact)) {
    return compact;
  }

  return null;
}

function splitBookAndRest(input: string, bookKey: string): string {
  let i = 0;
  let matched = 0;
  while (i < input.length && matched < bookKey.length) {
    if (input[i] === ' ') {
      i += 1;
      continue;
    }
    matched += 1;
    i += 1;
  }
  return input.slice(i).trim();
}

function resolveBook(input: string): { abbr: string; rest: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const compactInput = compactKey(trimmed);

  for (const { key, abbr } of SORTED_BOOK_ALIASES) {
    if (compactInput.startsWith(key)) {
      return { abbr, rest: splitBookAndRest(trimmed, key) };
    }
  }

  return null;
}

export type ParsedReference = {
  abbr: string;
  locator: string;
};

/** 참조 문자열을 권·장절로 파싱. 실패 시 null */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return null;

  const book = resolveBook(trimmed);
  if (!book) return null;

  const locator = parseLocator(book.rest);
  if (!locator) return null;

  return { abbr: book.abbr, locator };
}

/** 인식 가능한 성경 권·장절 형식인지 검사 */
export function isValidReference(input: string): boolean {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return false;
  return parseReference(trimmed) !== null;
}

/** 표준 표시 형식으로 변환. 예) `히브리서 3장15~16절` → `히 3:15~16` */
export function canonicalizeReference(input: string): string {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return '';

  const parsed = parseReference(trimmed);
  if (!parsed) return trimmed;

  return `${parsed.abbr} ${parsed.locator}`;
}
