/**
 * 화면에는 약칭(예: `잠 1:1`)을 그대로 두고, TTS 낭독 직전에만 자연스러운
 * 한국어 참조(예: `잠언 1장 1절`)로 변환하기 위한 유틸.
 *
 * - 표시/저장/퀴즈 정답 비교에는 영향을 주지 않는다(순수 변환 함수).
 * - 약칭을 모르거나 형식이 예상과 다르면 원본을 그대로 반환해 안전하게 둔다.
 */

/** 한글 성경 권 약칭 → 풀이름 */
const BOOK_FULL_NAMES: Record<string, string> = {
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
 * 예) `잠 1:1` → `잠언 1장 1절`, `시 23:1-3` → `시편 23장 1절부터 3절`
 */
export function toSpeakableReference(reference: string): string {
  const raw = typeof reference === 'string' ? reference.trim() : '';
  if (!raw) return '';

  // 책 토큰(숫자 이전의 비숫자 부분) + 나머지(장:절)로 분리
  const match = raw.match(/^(\S+?)\s*(\d.*)$/);
  if (!match) return raw;

  const bookToken = match[1] ?? '';
  const locator = (match[2] ?? '').trim();
  const bookName = BOOK_FULL_NAMES[bookToken] ?? bookToken;

  if (!locator) return bookName;

  // 장:절 분리
  const [chapterRaw, ...verseRest] = locator.split(':');
  const chapter = (chapterRaw ?? '').trim();
  const versePart = verseRest.join(':').trim();

  if (!chapter) return bookName;
  if (!versePart) return `${bookName} ${chapter}장`;

  const spokenVerses = formatVersePart(versePart);
  if (!spokenVerses) return `${bookName} ${chapter}장`;
  return `${bookName} ${chapter}장 ${spokenVerses}`;
}
