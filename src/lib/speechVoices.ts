import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import type { SpeechVoiceOption } from '../types/speechSettings';

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
        .map((v) => ({
          id: v.voiceURI,
          name: v.name,
          language: v.lang,
          isDefault: v.default,
        }))
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
    .map((v) => ({
      id: v.identifier,
      name: v.name,
      language: v.language,
    }))
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
): SpeechVoiceOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return voices;
  return voices.filter(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      v.language.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q),
  );
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
