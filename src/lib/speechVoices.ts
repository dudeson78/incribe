import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import type {
  SpeechVoiceCategory,
  SpeechVoiceCategoryFilter,
  SpeechVoiceOption,
} from '../types/speechSettings';

/** OS·브라우저 TTS는 성별 API가 없어 음성 이름으로 추정 */
export function inferVoiceCategory(name: string): SpeechVoiceCategory {
  const n = name.toLowerCase();

  if (
    /\b(child|kid|junior|young)\b|어린이|아이\s*목소리|소년|소녀/.test(n)
  ) {
    return 'child';
  }
  if (
    /\b(female|woman|girl)\b|여성|여자|heami|heera|yuna|sora|sunhi|sol|seoyeon|naayf|zira|hyejin|younghwa/.test(
      n,
    )
  ) {
    return 'female';
  }
  if (
    /\b(male|man|boy)\b|남성|남자|injoon|hyunsu|naaym|david|mark|daniel|james|guy/.test(
      n,
    )
  ) {
    return 'male';
  }
  return 'unknown';
}

function withCategory(v: Omit<SpeechVoiceOption, 'category'>): SpeechVoiceOption {
  return { ...v, category: inferVoiceCategory(v.name) };
}

function sortVoices(a: SpeechVoiceOption, b: SpeechVoiceOption): number {
  const aKo = a.language.toLowerCase().startsWith('ko');
  const bKo = b.language.toLowerCase().startsWith('ko');
  if (aKo !== bKo) return aKo ? -1 : 1;
  if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
  return a.name.localeCompare(b.name, 'ko');
}

function loadWebSpeechVoices(): Promise<SpeechVoiceOption[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const mapVoices = (): SpeechVoiceOption[] => {
      const raw = window.speechSynthesis.getVoices();
      return raw
        .map((v) =>
          withCategory({
            id: v.voiceURI,
            name: v.name,
            language: v.lang,
            isDefault: v.default,
          }),
        )
        .sort(sortVoices);
    };

    const first = mapVoices();
    if (first.length > 0) {
      resolve(first);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(mapVoices());
    };
  });
}

async function loadExpoSpeechVoices(): Promise<SpeechVoiceOption[]> {
  const raw = await Speech.getAvailableVoicesAsync();
  return raw
    .map((v) =>
      withCategory({
        id: v.identifier,
        name: v.name,
        language: v.language,
      }),
    )
    .sort(sortVoices);
}

/** Web Speech API(웹) 또는 expo-speech(네이티브) 음성 목록 */
export async function loadSpeechVoiceOptions(): Promise<SpeechVoiceOption[]> {
  if (Platform.OS === 'web') {
    return loadWebSpeechVoices();
  }
  return loadExpoSpeechVoices();
}

export function filterSpeechVoices(
  voices: SpeechVoiceOption[],
  query: string,
  category: SpeechVoiceCategoryFilter = 'all',
): SpeechVoiceOption[] {
  const q = query.trim().toLowerCase();
  return voices.filter((v) => {
    if (category !== 'all' && (v.category ?? 'unknown') !== category) {
      return false;
    }
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.language.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q)
    );
  });
}

export function pickDefaultVoice(
  voices: SpeechVoiceOption[],
): SpeechVoiceOption | null {
  if (voices.length === 0) return null;
  const ko =
    voices.find((v) => v.language.toLowerCase().startsWith('ko') && v.isDefault) ??
    voices.find((v) => v.language.toLowerCase().startsWith('ko'));
  return ko ?? voices.find((v) => v.isDefault) ?? voices[0] ?? null;
}
