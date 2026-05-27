import { REFERENCE_SUGGESTION_SEEDS } from '../constants/referenceSuggestions';

const BOOK_SUFFIX_RE =
  /(?:서|기|복음|행전|편|애가|계시록|애굽기|레위기|민수기|신명기|사사기|에스라|느헤미야|에스더|이사야|예레미야|에스겔|다니엘|호세아|요엘|아모스|오바댜|요나|미가|나훔|하박국|스바냐|학개|스가랴|말라기)$/;

function isFullBookName(name: string): boolean {
  const t = name.trim();
  return t.length >= 3 && BOOK_SUFFIX_RE.test(t);
}

/** 약칭 → 풀네임 (자동완성 시드에서 유도) */
function buildAbbrevToFullMap(): Map<string, string> {
  const map = new Map<string, string>();
  const seeds = REFERENCE_SUGGESTION_SEEDS;

  for (let i = 0; i < seeds.length - 1; i++) {
    const short = seeds[i]!.trim();
    const long = seeds[i + 1]!.trim();
    if (!short || !long || long.length <= short.length) continue;
    if (!isFullBookName(long)) continue;
    if (!map.has(short) || map.get(short)!.length < long.length) {
      map.set(short, long);
    }
  }

  for (const seed of seeds) {
    const t = seed.trim();
    if (t && isFullBookName(t)) {
      map.set(t, t);
    }
  }

  return map;
}

const ABBREV_TO_FULL = buildAbbrevToFullMap();

function expandBookName(bookPart: string): string {
  const raw = bookPart.trim().replace(/\s+/g, ' ');
  if (!raw) return raw;
  if (ABBREV_TO_FULL.has(raw)) return ABBREV_TO_FULL.get(raw)!;

  const noSpace = raw.replace(/\s/g, '');
  for (const [abbr, full] of ABBREV_TO_FULL) {
    if (abbr.replace(/\s/g, '') === noSpace) return full;
  }

  return raw;
}

function parseReferenceParts(
  reference: string,
): { book: string; chapter: string; verse: string } | null {
  const ref = reference.trim().replace(/\s+/g, ' ');
  if (!ref) return null;

  const hangul = /^(.+?)\s*(\d{1,3})\s*장\s*(\d{1,3})\s*절/.exec(ref);
  if (hangul) {
    return {
      book: hangul[1]!.trim(),
      chapter: hangul[2]!,
      verse: hangul[3]!,
    };
  }

  const colon = /^(.+?)\s*(\d{1,3})\s*[:：]\s*(\d{1,3})/.exec(ref);
  if (colon) {
    return {
      book: colon[1]!.trim(),
      chapter: colon[2]!,
      verse: colon[3]!,
    };
  }

  return null;
}

/** TTS용 참조: `벧전 3:7` → `베드로전서 3장 7절` */
export function referenceToSpeech(reference: string): string {
  const parts = parseReferenceParts(reference);
  if (!parts) return reference.trim();

  const book = expandBookName(parts.book);
  const chapter = Number(parts.chapter);
  const verse = Number(parts.verse);
  const chapterSpeech = Number.isFinite(chapter) ? `${chapter}장` : `${parts.chapter}장`;
  const verseSpeech = Number.isFinite(verse) ? `${verse}절` : `${parts.verse}절`;

  return `${book} ${chapterSpeech} ${verseSpeech}`;
}
